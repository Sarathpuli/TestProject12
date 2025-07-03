// Enhanced Stock Search Component with better error handling and navigation
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { 
  Search, 
  PlusCircle, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X 
} from 'lucide-react';
import { db, doc, updateDoc, getDoc } from '../firebase';

interface CompanySearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  marketOpen: string;
  marketClose: string;
  timezone: string;
  currency: string;
  matchScore: number;
}

interface PortfolioItem {
  symbol: string;
  shares: number;
  avgPrice: number;
  purchaseDate: Date | { seconds: number; nanoseconds: number };
  addedAt: Date | { seconds: number; nanoseconds: number };
}

interface FinnhubSearchResponse {
  result: Array<{
    symbol: string;
    description: string;
    type: string;
  }>;
}

interface EnhancedStockSearchProps {
  user: User | null;
  onPortfolioUpdate: () => void;
}

// Simple cache for search results to reduce API calls
class SearchCache {
  private cache = new Map<string, { data: CompanySearchResult[]; timestamp: number }>();
  private TTL = 300000; // 5 minutes

  get(query: string): CompanySearchResult[] | null {
    const cached = this.cache.get(query.toLowerCase());
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(query.toLowerCase());
      return null;
    }
    
    return cached.data;
  }

  set(query: string, data: CompanySearchResult[]): void {
    this.cache.set(query.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }
}

const searchCache = new SearchCache();

// Popular stock symbols for quick access
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Google' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' }
];

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';

const EnhancedStockSearch: React.FC<EnhancedStockSearchProps> = ({ user, onPortfolioUpdate }) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [shares, setShares] = useState<number>(1);
  const [avgPrice, setAvgPrice] = useState<number>(0);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedStock, setSelectedStock] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Validate stock symbol format
  const isValidStockSymbol = (symbol: string): boolean => {
    const cleaned = symbol.trim().toUpperCase();
    // Basic validation: 1-6 characters, letters only or with numbers
    return /^[A-Z]{1,6}(\.[A-Z]{1,3})?$/.test(cleaned) || /^[A-Z]{1,4}\d{0,2}$/.test(cleaned);
  };

  // Enhanced navigation with better error handling
  const navigateToStock = useCallback(async (symbol: string) => {
    const cleanSymbol = symbol.trim().toUpperCase();
    
    if (!cleanSymbol) {
      setMessage('Please enter a valid stock symbol');
      return;
    }

    setNavigationLoading(true);
    setMessage('');

    try {
      // Pre-validate symbol format
      if (!isValidStockSymbol(cleanSymbol)) {
        throw new Error('Invalid stock symbol format');
      }

      // Optional: Quick validation with API
      if (FINNHUB_API_KEY) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${cleanSymbol}&token=${FINNHUB_API_KEY}`,
            { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
              }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.c === 0) {
              throw new Error(`Stock symbol "${cleanSymbol}" not found`);
            }
          } else if (response.status === 429) {
            // Rate limited, but still allow navigation
            console.warn('API rate limited, proceeding with navigation');
          } else if (response.status >= 400) {
            throw new Error(`Stock symbol "${cleanSymbol}" not found`);
          }
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.warn('Stock validation timed out, proceeding anyway');
            } else if (error.message.includes('not found')) {
              throw error;
            } else {
              console.warn('Validation failed, proceeding anyway:', error.message);
            }
          }
        }
      }

      // Navigate to stock page
      navigate(`/stock/${cleanSymbol}`);
      
      // Clear search state
      setSearchInput('');
      setShowResults(false);
      setSearchResults([]);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid stock symbol';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 4000);
    } finally {
      setNavigationLoading(false);
    }
  }, [navigate]);

  // Enhanced search function
  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    // Check cache first
    const cached = searchCache.get(searchTerm);
    if (cached) {
      setSearchResults(cached);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);

    try {
      if (!FINNHUB_API_KEY) {
        throw new Error('API key not configured');
      }

      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(searchTerm)}&token=${FINNHUB_API_KEY}`,
        { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      if (response.ok) {
        const data: FinnhubSearchResponse = await response.json();
        if (data.result && Array.isArray(data.result)) {
          const formattedResults: CompanySearchResult[] = data.result
            .slice(0, 8)
            .map((item) => ({
              symbol: item.symbol,
              name: item.description,
              type: item.type,
              region: '',
              marketOpen: '',
              marketClose: '',
              timezone: '',
              currency: '',
              matchScore: 0
            }));
          
          setSearchResults(formattedResults);
          
          // Cache results
          searchCache.set(searchTerm, formattedResults);
        }
      } else if (response.status === 429) {
        setMessage('Search rate limited. Please wait a moment.');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search error:', error);
        setMessage('Search temporarily unavailable');
        setTimeout(() => setMessage(''), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCompanies(searchInput);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput, searchCompanies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Check if stock exists in portfolio
  const checkExistingStock = async (symbol: string): Promise<PortfolioItem | null> => {
    if (!user) return null;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const portfolio = userData.portfolio || [];
        
        const existing = portfolio.find((item: PortfolioItem | string) => 
          typeof item === 'string' ? item === symbol : item.symbol === symbol
        );

        if (existing && typeof existing === 'object') {
          return existing;
        } else if (existing && typeof existing === 'string') {
          return {
            symbol: existing,
            shares: 0,
            avgPrice: 0,
            purchaseDate: new Date(),
            addedAt: new Date()
          };
        }
      }
    } catch (error) {
      console.error('Error checking existing stock:', error);
    }
    return null;
  };

  const handleStockSelect = async (symbol: string) => {
    setSelectedStock(symbol);
    setSearchInput(symbol);
    setShowResults(false);

    if (!user) {
      setMessage('Please login to add stocks to your portfolio. You can still search and view stock information.');
      setTimeout(() => setMessage(''), 4000);
      return;
    }

    // Check if stock already exists
    const existing = await checkExistingStock(symbol);
    if (existing) {
      setShares(existing.shares);
      setAvgPrice(existing.avgPrice);
      setIsEditing(true);
    } else {
      setIsEditing(false);
      setShares(1);
      // Fetch current price for default avg price
      fetchCurrentPrice(symbol);
    }
    setShowEditForm(true);
  };

  const fetchCurrentPrice = async (symbol: string) => {
    if (!FINNHUB_API_KEY) return;
    
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();
      if (data.c) {
        setAvgPrice(data.c);
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  };

  // Enhanced search function that handles both symbols and company names
  const handleSearch = () => {
    if (!searchInput.trim()) {
      setMessage('Please enter a stock symbol or company name');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const input = searchInput.toUpperCase().trim();
    
    // If it looks like a stock symbol, navigate directly
    if (isValidStockSymbol(input)) {
      navigateToStock(input);
      return;
    }

    // If there are search results, use the first one
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      navigateToStock(firstResult.symbol);
      return;
    }

    // If no results and input might be a company name, show helpful message
    setMessage('Please select from the search suggestions or enter a valid stock symbol (e.g., AAPL, MSFT).');
    setTimeout(() => setMessage(''), 5000);
  };

  const handleAddOrUpdatePortfolio = async () => {
    if (!user) {
      setMessage('Please login to manage your portfolio');
      return;
    }

    if (!selectedStock) {
      setMessage('Please select a stock');
      return;
    }

    if (shares < 0 || avgPrice < 0) {
      setMessage('Shares and price cannot be negative');
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentPortfolio = userData.portfolio || [];

      // Remove existing entry if it exists
      const filteredPortfolio = currentPortfolio.filter((item: PortfolioItem | string) => 
        typeof item === 'string' ? item !== selectedStock : item.symbol !== selectedStock
      );

      // Create new portfolio item
      const portfolioItem = {
        symbol: selectedStock,
        shares: shares,
        avgPrice: avgPrice,
        purchaseDate: new Date(),
        addedAt: new Date()
      };

      // Update portfolio
      await updateDoc(userRef, {
        portfolio: [...filteredPortfolio, portfolioItem]
      });

      if (shares === 0) {
        setMessage(`${selectedStock} saved to watchlist (0 shares)`);
      } else if (isEditing) {
        setMessage(`${selectedStock} updated successfully!`);
      } else {
        setMessage(`${selectedStock} added to portfolio successfully!`);
      }

      // Reset form
      setShowEditForm(false);
      setSelectedStock('');
      setShares(1);
      setAvgPrice(0);
      setSearchInput('');
      setIsEditing(false);
      onPortfolioUpdate();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      setMessage('Error updating portfolio');
    }
  };

  const handleRemoveFromPortfolio = async () => {
    if (!user || !selectedStock) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : {};
      const currentPortfolio = userData.portfolio || [];

      // Remove the stock
      const filteredPortfolio = currentPortfolio.filter((item: PortfolioItem | string) => 
        typeof item === 'string' ? item !== selectedStock : item.symbol !== selectedStock
      );

      await updateDoc(userRef, {
        portfolio: filteredPortfolio
      });

      setMessage(`${selectedStock} removed from portfolio`);
      setShowEditForm(false);
      setSelectedStock('');
      setSearchInput('');
      setIsEditing(false);
      onPortfolioUpdate();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error removing from portfolio:', error);
      setMessage('Error removing from portfolio');
    }
  };

  // Handle keyboard navigation
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showResults && searchResults.length > 0) {
        handleStockSelect(searchResults[0].symbol);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSearchResults([]);
    }
  };

  // Handle quick stock navigation
  const handleQuickStock = (symbol: string) => {
    navigateToStock(symbol);
  };

  return (
    <div className="relative">
      <div className="mb-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name or ticker symbol..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onKeyDown={handleKeyPress}
            disabled={navigationLoading}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
          />
          {(loading || navigationLoading) && (
            <RefreshCw className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && !navigationLoading && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleStockSelect(result.symbol)}
                className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{result.symbol}</p>
                    <p className="text-sm text-gray-400 truncate">{result.name}</p>
                  </div>
                  <div className="text-xs text-gray-500">{result.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Portfolio Form */}
      {showEditForm && (
        <div className="mb-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-medium text-white">
              {isEditing ? `Edit ${selectedStock}` : `Add ${selectedStock} to Portfolio`}
            </h4>
            {isEditing && (
              <span className="text-xs bg-blue-600 text-blue-100 px-2 py-1 rounded">
                Currently in portfolio
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Number of Shares</label>
              <input
                type="number"
                min="0"
                step="1"
                value={shares}
                onChange={(e) => setShares(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0 for watchlist"
              />
              <p className="text-xs text-gray-500 mt-1">0 = Save to watchlist only</p>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Average Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={avgPrice}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleAddOrUpdatePortfolio}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center space-x-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isEditing ? 'Update' : 'Add'} {shares === 0 ? 'to Watchlist' : 'to Portfolio'}</span>
            </button>
            
            {isEditing && (
              <button
                onClick={handleRemoveFromPortfolio}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded flex items-center space-x-2 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </button>
            )}
            
            <button
              onClick={() => setShowEditForm(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSearch}
            disabled={navigationLoading || !searchInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded flex items-center space-x-2 transition-colors"
          >
            {navigationLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{navigationLoading ? 'Loading...' : 'Search'}</span>
          </button>

          {/* API Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${FINNHUB_API_KEY ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
            <span className="text-xs text-gray-400">
              {FINNHUB_API_KEY ? 'API Connected' : 'Limited Mode'}
            </span>
          </div>
        </div>

        {/* Quick access buttons for popular stocks */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Popular stocks:</p>
          <div className="flex space-x-2 flex-wrap gap-2">
            {POPULAR_STOCKS.map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => handleQuickStock(stock.symbol)}
                disabled={navigationLoading}
                className="text-xs bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2 rounded transition-colors flex flex-col items-center"
              >
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-gray-400">{stock.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
          message.includes('Error') || message.includes('Invalid') || message.includes('not found')
            ? 'bg-red-900/50 border border-red-700' 
            : message.includes('successfully') || message.includes('updated') || message.includes('saved')
            ? 'bg-green-900/50 border border-green-700'
            : 'bg-yellow-900/50 border border-yellow-700'
        }`}>
          {message.includes('Error') || message.includes('Invalid') || message.includes('not found') ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : message.includes('successfully') || message.includes('updated') || message.includes('saved') ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className={`text-sm ${
            message.includes('Error') || message.includes('Invalid') || message.includes('not found')
              ? 'text-red-300' 
              : message.includes('successfully') || message.includes('updated') || message.includes('saved')
              ? 'text-green-300'
              : 'text-yellow-300'
          }`}>
            {message}
          </span>
        </div>
      )}

      {/* Help Text */}
      {!message && searchInput.length === 0 && (
        <div className="mt-3 text-xs text-gray-500">
          <p>💡 Tips: Enter a stock symbol (e.g., AAPL) or company name (e.g., Apple) to search</p>
          <p>Press Enter to search, or click on popular stocks above for quick access</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedStockSearch;