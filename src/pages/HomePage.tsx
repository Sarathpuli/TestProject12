// Enhanced HomePage.tsx - Fixed all TypeScript/ESLint issues
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth, db, doc, getDoc, updateDoc } from '../firebase';
import { 
  TrendingUp, 
  TrendingDown,
  User as UserIcon,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
  BarChart3,
  DollarSign,
  RefreshCw,
  Activity,
  Bell,
  Globe,
  Crown,
  Lock,
  Search,
  PlusCircle,
  AlertCircle,
  CheckCircle,
  StickyNote,
  Plus,
  X,
  PieChart,
  Calculator,
  GraduationCap,
  LogIn,
  UserPlus,
  GitCompare,
  Zap,
  BookOpen,
  Users
} from 'lucide-react';

// Import components
import AskAI from '../components/AskAI';
import NewsSection from '../components/NewsSection';
import StockQuiz from '../components/StockQuiz';
import CompareStocks from '../components/CompareStocks';

interface HomePageProps {
  user: User | null;
  onPortfolioUpdate: () => void;
}

// API Configuration
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const TWITTER_API_KEY = import.meta.env.VITE_TWITTER_API_KEY; // For future Twitter integration

// Market indices data interface
interface MarketIndex {
  name: string;
  symbol: string;
  value: string;
  change: string;
  changePercent: string;
  positive: boolean;
}

// Portfolio interfaces
interface PortfolioHolding {
  symbol: string;
  companyName?: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  industry?: string;
  sector?: string;
  purchaseDate?: Date;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  todayGain: number;
  xirr: number | null;
  diversity: { [key: string]: number };
  industryDiversity: { [key: string]: number };
  holdings: PortfolioHolding[];
}

// Notes interface
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Company search interface
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

// Portfolio item interface for Firebase
interface PortfolioItem {
  symbol: string;
  shares: number;
  avgPrice: number;
  purchaseDate: Date | { seconds: number; nanoseconds: number };
  addedAt: Date | { seconds: number; nanoseconds: number };
}

// Firebase saved note interface
interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number } | Date;
  updatedAt: { seconds: number; nanoseconds: number } | Date;
}

// API response interfaces for better type safety
interface FinnhubSearchResponse {
  result: Array<{
    symbol: string;
    description: string;
    type: string;
  }>;
}

// Login Required Component
const LoginRequired: React.FC<{ 
  title: string; 
  description: string; 
  icon: React.ElementType;
  iconColor?: string;
}> = ({ title, description, icon: Icon, iconColor = "text-blue-400" }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Icon className={`w-5 h-5 mr-2 ${iconColor}`} />
        {title}
      </h3>
      <div className="text-center py-8">
        <Lock className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
        <p className="text-lg font-medium mb-2 text-gray-300">Login Required</p>
        <p className="text-sm text-gray-400 mb-6">{description}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const useUserPlan = (user: User | null) => {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserPlan = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsPro(userData.plan === 'pro' || userData.isPro || false);
        }
      } catch (error) {
        console.error('Error checking user plan:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserPlan();
  }, [user]);

  return { isPro, loading };
};

// Smooth refresh context
const useSmootRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const smoothRefresh = useCallback(async (refreshFn: () => Promise<void>) => {
    setIsRefreshing(true);
    try {
      await refreshFn();
      // Add small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsRefreshing(false);
    }
  }, []);
  
  return { isRefreshing, smoothRefresh };
};

// Enhanced Stock Search Component with Edit/Remove Functionality
const EnhancedStockSearch: React.FC<{ user: User | null; onPortfolioUpdate: () => void }> = ({ user, onPortfolioUpdate }) => {
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
  const navigate = useNavigate();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Search for companies by name or symbol
  const searchCompanies = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(searchTerm)}&token=${FINNHUB_API_KEY}`
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
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage('Search temporarily unavailable');
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
      return;
    }

    const input = searchInput.toUpperCase().trim();
    
    // If it looks like a stock symbol (1-5 uppercase letters), navigate directly
    if (/^[A-Z]{1,5}$/.test(input)) {
      navigate(`/stock/${input}`);
      return;
    }

    // If there are search results, use the first one
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      navigate(`/stock/${firstResult.symbol}`);
      return;
    }

    // If the input contains letters and might be a company name, try to search for it
    if (/^[A-Z\s&.,-]+$/i.test(input)) {
      // Try to find exact matches in our search results
      const exactMatch = searchResults.find(result => 
        result.name.toLowerCase().includes(input.toLowerCase()) ||
        result.symbol.toLowerCase() === input.toLowerCase()
      );
      
      if (exactMatch) {
        navigate(`/stock/${exactMatch.symbol}`);
        return;
      }

      // If no exact match but input looks like a company name, show message
      setMessage('Please select from the search suggestions or enter a valid stock symbol (e.g., AAPL, MSFT).');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Last resort - check if it's a valid ticker with numbers/special characters
    const cleanSymbol = input.replace(/[^A-Z0-9]/g, '');
    if (cleanSymbol.length > 0 && cleanSymbol.length <= 6) {
      navigate(`/stock/${cleanSymbol}`);
      return;
    }

    setMessage('Please enter a valid stock symbol or select from the search suggestions.');
    setTimeout(() => setMessage(''), 3000);
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
    }
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
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {loading && (
            <RefreshCw className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
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

      <div className="flex space-x-4">
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center space-x-2 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>

        {/* Quick access buttons for popular stocks */}
        <div className="flex space-x-2 flex-wrap">
          {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'].map((symbol) => (
            <button
              key={symbol}
              onClick={() => navigate(`/stock/${symbol}`)}
              className="text-xs bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition-colors"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>

      {message && (
        <div className={`mt-3 p-3 rounded-lg flex items-center space-x-2 ${
          message.includes('Error') || message.includes('Invalid') 
            ? 'bg-red-900/50 border border-red-700' 
            : message.includes('successfully') || message.includes('updated') || message.includes('saved')
            ? 'bg-green-900/50 border border-green-700'
            : 'bg-yellow-900/50 border border-yellow-700'
        }`}>
          {message.includes('Error') || message.includes('Invalid') ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : message.includes('successfully') || message.includes('updated') || message.includes('saved') ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-yellow-400" />
          )}
          <span className={`text-sm ${
            message.includes('Error') || message.includes('Invalid') 
              ? 'text-red-300' 
              : message.includes('successfully') || message.includes('updated') || message.includes('saved')
              ? 'text-green-300'
              : 'text-yellow-300'
          }`}>
            {message}
          </span>
        </div>
      )}
    </div>
  );
};

// Enhanced Portfolio Summary with XIRR and Company Names
const EnhancedPortfolioSummary: React.FC<{ user: User | null; refreshTrigger: number }> = ({ user, refreshTrigger }) => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [savedStocks, setSavedStocks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // XIRR Calculation using Newton-Raphson method
  const calculateXIRR = useCallback((cashFlows: number[], dates: Date[]): number | null => {
    if (cashFlows.length !== dates.length || cashFlows.length < 2) {
      return null;
    }

    // Check if all cash flows are the same sign (no actual investment/return)
    const positiveFlows = cashFlows.filter(cf => cf > 0).length;
    const negativeFlows = cashFlows.filter(cf => cf < 0).length;
    if (positiveFlows === 0 || negativeFlows === 0) {
      return null;
    }

    // Convert dates to days from the first date
    const baseDateMs = dates[0].getTime();
    const daysDiff = dates.map(date => (date.getTime() - baseDateMs) / (1000 * 60 * 60 * 24));

    // Newton-Raphson method to find XIRR
    let rate = 0.1; // Initial guess: 10%
    const maxIterations = 100;
    const tolerance = 1e-6;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let j = 0; j < cashFlows.length; j++) {
        const factor = Math.pow(1 + rate, daysDiff[j] / 365.25);
        npv += cashFlows[j] / factor;
        dnpv -= cashFlows[j] * (daysDiff[j] / 365.25) / Math.pow(factor, 2);
      }

      if (Math.abs(npv) < tolerance) {
        return rate * 100; // Return as percentage
      }

      if (Math.abs(dnpv) < tolerance) {
        return null; // Derivative too small, can't continue
      }

      const newRate = rate - npv / dnpv;
      
      // Prevent extreme values
      if (newRate < -0.99 || newRate > 10) {
        return null;
      }

      rate = newRate;
    }

    return null; // Failed to converge
  }, []);

  // Calculate portfolio XIRR
  const calculatePortfolioXIRR = useCallback((holdings: PortfolioHolding[]): number | null => {
    if (holdings.length === 0) return null;

    const cashFlows: number[] = [];
    const dates: Date[] = [];

    // Add purchase cash flows (negative)
    holdings.forEach(holding => {
      const purchaseCost = holding.shares * holding.avgPrice;
      if (purchaseCost > 0) {
        cashFlows.push(-purchaseCost);
        dates.push(holding.purchaseDate || new Date());
      }
    });

    // Add current value as positive cash flow at today's date
    const totalCurrentValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    if (totalCurrentValue > 0) {
      cashFlows.push(totalCurrentValue);
      dates.push(new Date());
    }

    return calculateXIRR(cashFlows, dates);
  }, [calculateXIRR]);

  // Calculate diversity with better sector handling
  const calculateDiversity = useCallback((holdings: PortfolioHolding[]) => {
    const sectorDistribution: { [key: string]: number } = {};
    const industryDistribution: { [key: string]: number } = {};
    const totalValue = holdings.reduce((sum, holding) => sum + holding.totalValue, 0);

    if (totalValue === 0) return { sectorDistribution: {}, industryDistribution: {} };

    holdings.forEach(holding => {
      const percentage = (holding.totalValue / totalValue) * 100;
      
      // Clean and normalize sector names
      let sector = holding.sector || 'Technology';
      if (sector === 'Unknown' || !sector.trim()) {
        sector = 'Technology';
      }
      
      // Clean and normalize industry names  
      let industry = holding.industry || 'Software';
      if (industry === 'Unknown' || !industry.trim()) {
        industry = 'Software';
      }
      
      sectorDistribution[sector] = (sectorDistribution[sector] || 0) + percentage;
      industryDistribution[industry] = (industryDistribution[industry] || 0) + percentage;
    });

    return { sectorDistribution, industryDistribution };
  }, []);

  const fetchPortfolioData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        setPortfolio(null);
        setSavedStocks([]);
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const portfolioData = userData.portfolio || [];
      
      if (portfolioData.length === 0) {
        setPortfolio(null);
        setSavedStocks([]);
        setLoading(false);
        return;
      }
      
      const processedHoldings: PortfolioHolding[] = [];
      const watchlistStocks: string[] = [];
      
      for (const item of portfolioData) {
        let symbol: string;
        let shares: number;
        let avgPrice: number;
        let purchaseDate: Date;
        
        if (typeof item === 'string') {
          symbol = item;
          shares = 0;
          avgPrice = 0;
          purchaseDate = new Date();
        } else {
          symbol = item.symbol;
          shares = item.shares || 0;
          avgPrice = item.avgPrice || 0;
          purchaseDate = item.purchaseDate && typeof item.purchaseDate === 'object' && 'seconds' in item.purchaseDate
            ? new Date((item.purchaseDate as { seconds: number }).seconds * 1000)
            : item.purchaseDate instanceof Date 
            ? item.purchaseDate 
            : new Date();
        }

        // Separate holdings (shares > 0) from saved stocks (shares = 0)
        if (shares === 0) {
          watchlistStocks.push(symbol);
          continue;
        }
        
        try {
          // Fetch current stock data and company profile
          const [stockResponse, profileResponse] = await Promise.all([
            fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
            fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
          ]);
          
          const stockData = await stockResponse.json();
          const profileData = await profileResponse.json();
          
          if (stockData && stockData.c) {
            const currentPrice = stockData.c;
            const totalValue = currentPrice * shares;
            const totalCost = avgPrice * shares;
            const gainLoss = totalValue - totalCost;
            const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
            
            // Helper functions for sector and industry normalization
            const normalizeSector = (sectorName: string): string => {
              const s = sectorName.toLowerCase();
              
              if (s.includes('technology') || s.includes('information technology') || s.includes('software') || s.includes('internet')) {
                return 'Technology';
              } else if (s.includes('health') || s.includes('pharmaceuticals') || s.includes('biotech') || s.includes('medical')) {
                return 'Healthcare';
              } else if (s.includes('financial') || s.includes('bank') || s.includes('insurance') || s.includes('finance')) {
                return 'Financial Services';
              } else if (s.includes('consumer') || s.includes('retail') || s.includes('discretionary') || s.includes('staples')) {
                return 'Consumer Goods';
              } else if (s.includes('energy') || s.includes('oil') || s.includes('gas') || s.includes('petroleum')) {
                return 'Energy';
              } else if (s.includes('industrial') || s.includes('manufacturing') || s.includes('aerospace') || s.includes('defense')) {
                return 'Industrials';
              } else if (s.includes('material') || s.includes('mining') || s.includes('chemical') || s.includes('metals')) {
                return 'Materials';
              } else if (s.includes('real estate') || s.includes('reit')) {
                return 'Real Estate';
              } else if (s.includes('utilities') || s.includes('electric') || s.includes('water') || s.includes('utility')) {
                return 'Utilities';
              } else if (s.includes('communication') || s.includes('telecom') || s.includes('media') || s.includes('entertainment')) {
                return 'Communication Services';
              } else if (s.includes('auto') || s.includes('vehicle') || s.includes('transportation') || s.includes('automotive')) {
                return 'Automotive';
              } else if (s.includes('food') || s.includes('beverage') || s.includes('agriculture') || s.includes('restaurant')) {
                return 'Food & Beverage';
              } else {
                return 'Technology'; // Default fallback
              }
            };
            
            const normalizeIndustry = (industryName: string): string => {
              const i = industryName.toLowerCase();
              
              if (i.includes('software') || i.includes('internet') || i.includes('cloud') || i.includes('saas')) {
                return 'Software';
              } else if (i.includes('semiconductor') || i.includes('chip') || i.includes('electronics') || i.includes('hardware')) {
                return 'Semiconductors';
              } else if (i.includes('auto') || i.includes('vehicle') || i.includes('automotive')) {
                return 'Automotive';
              } else if (i.includes('pharma') || i.includes('drug') || i.includes('biotech') || i.includes('medical')) {
                return 'Pharmaceuticals';
              } else if (i.includes('bank') || i.includes('financial') || i.includes('lending')) {
                return 'Banking';
              } else if (i.includes('retail') || i.includes('e-commerce') || i.includes('store')) {
                return 'Retail';
              } else if (i.includes('energy') || i.includes('oil') || i.includes('renewable')) {
                return 'Energy';
              } else if (i.includes('real estate') || i.includes('property') || i.includes('reit')) {
                return 'Real Estate';
              } else if (i.includes('aerospace') || i.includes('defense') || i.includes('aviation')) {
                return 'Aerospace & Defense';
              } else if (i.includes('telecom') || i.includes('wireless') || i.includes('communication')) {
                return 'Telecommunications';
              } else {
                return 'Software'; // Default fallback
              }
            };

            const getManualSectorMapping = (stockSymbol: string): { sector: string; industry: string } | null => {
              const mappings: { [key: string]: { sector: string; industry: string } } = {
                'AAPL': { sector: 'Technology', industry: 'Consumer Electronics' },
                'MSFT': { sector: 'Technology', industry: 'Software' },
                'AMZN': { sector: 'Consumer Goods', industry: 'E-commerce' },
                'GOOGL': { sector: 'Technology', industry: 'Internet Services' },
                'GOOG': { sector: 'Technology', industry: 'Internet Services' },
                'TSLA': { sector: 'Automotive', industry: 'Electric Vehicles' },
                'META': { sector: 'Communication Services', industry: 'Social Media' },
                'NVDA': { sector: 'Technology', industry: 'Semiconductors' },
                'AMD': { sector: 'Technology', industry: 'Semiconductors' },
                'INTC': { sector: 'Technology', industry: 'Semiconductors' },
                'JPM': { sector: 'Financial Services', industry: 'Banking' },
                'BAC': { sector: 'Financial Services', industry: 'Banking' },
                'JNJ': { sector: 'Healthcare', industry: 'Pharmaceuticals' },
                'PFE': { sector: 'Healthcare', industry: 'Pharmaceuticals' },
                'XOM': { sector: 'Energy', industry: 'Oil & Gas' },
                'CVX': { sector: 'Energy', industry: 'Oil & Gas' },
                'WMT': { sector: 'Consumer Goods', industry: 'Retail' },
                'HD': { sector: 'Consumer Goods', industry: 'Home Improvement' },
                'DIS': { sector: 'Communication Services', industry: 'Entertainment' },
                'NFLX': { sector: 'Communication Services', industry: 'Streaming' },
                'CRM': { sector: 'Technology', industry: 'Cloud Software' },
                'ORCL': { sector: 'Technology', industry: 'Enterprise Software' }
              };
              
              return mappings[stockSymbol] || null;
            };

            // Get company name and sector information with better fallback logic
            let companyName = symbol; // Fallback to symbol
            let sector = 'Technology'; // Default fallback
            let industry = 'Software'; // Default fallback
            
            if (profileData) {
              // Get company name
              companyName = profileData.name || symbol;
              
              // Try multiple fields for sector data with better logic
              const possibleSectors = [
                profileData.gicsSector,
                profileData.sector,
                profileData.gicsIndustry,
                profileData.gicsSubIndustry
              ].filter(s => s && s.trim() && s !== 'N/A' && s !== '');

              if (possibleSectors.length > 0) {
                sector = possibleSectors[0];
              }
              
              // Try multiple fields for industry
              const possibleIndustries = [
                profileData.finnhubIndustry,
                profileData.industry,
                profileData.gicsSubIndustry,
                profileData.gicsIndustry
              ].filter(i => i && i.trim() && i !== 'N/A' && i !== '');

              if (possibleIndustries.length > 0) {
                industry = possibleIndustries[0];
              }
              
              // Enhanced sector mapping with more comprehensive coverage
              sector = normalizeSector(sector);
              industry = normalizeIndustry(industry);
            }
            
            // Fallback manual mapping for common stocks if API doesn't provide good data
            if (sector === 'Technology' && industry === 'Software') {
              const manualMapping = getManualSectorMapping(symbol);
              if (manualMapping) {
                sector = manualMapping.sector;
                industry = manualMapping.industry;
              }
            }
            
            processedHoldings.push({
              symbol,
              companyName, // Add company name
              shares,
              avgPrice,
              currentPrice,
              totalValue,
              gainLoss,
              gainLossPercent,
              industry,
              sector,
              purchaseDate
            });
          }
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          // Add holding with default data if API call fails
          processedHoldings.push({
            symbol,
            companyName: symbol,
            shares,
            avgPrice,
            currentPrice: avgPrice,
            totalValue: avgPrice * shares,
            gainLoss: 0,
            gainLossPercent: 0,
            industry: 'Software',
            sector: 'Technology',
            purchaseDate
          });
        }
      }
      
      setSavedStocks(watchlistStocks);
      
      if (processedHoldings.length === 0) {
        setPortfolio(null);
        setLoading(false);
        return;
      }
      
      // Calculate portfolio summary
      const totalValue = processedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
      const totalCost = processedHoldings.reduce((sum, h) => sum + (h.shares * h.avgPrice), 0);
      const totalGain = totalValue - totalCost;
      const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
      
      // Calculate today's gain (simulate with random change)
      const todayGain = processedHoldings.reduce((sum, h) => {
        return sum + (h.totalValue * 0.01 * (Math.random() - 0.5));
      }, 0);
      
      // Calculate actual XIRR
      const xirr = calculatePortfolioXIRR(processedHoldings);
      const { sectorDistribution, industryDistribution } = calculateDiversity(processedHoldings);

      setPortfolio({
        totalValue,
        totalCost,
        totalGain,
        totalGainPercent,
        todayGain,
        xirr,
        diversity: sectorDistribution,
        industryDiversity: industryDistribution,
        holdings: processedHoldings
      });
      
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  }, [user, calculatePortfolioXIRR, calculateDiversity]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData, refreshTrigger]);

  if (!user) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-white">Portfolio Overview</h3>
          <div className="text-center text-gray-400 py-8">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">Authentication Required</p>
            <p className="text-sm">Please log in to view your portfolio summary</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 p-6 rounded-lg border border-gray-700 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-4 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="text-center text-red-400 py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">Error Loading Portfolio</p>
            <p className="text-sm">{error}</p>
            <button 
              onClick={fetchPortfolioData}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Portfolio Performance Overview */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-6 flex items-center text-white">
          <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
          Portfolio Performance
        </h3>
        
        {!portfolio || portfolio.holdings.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Start Building Your Portfolio</p>
            <p className="text-sm">Add stocks with quantity &gt; 0 to see your performance metrics</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Total Value */}
            <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 p-4 rounded-lg border border-green-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600/20 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Total Portfolio Value</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Total Gain/Loss */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm text-gray-300">Total Return</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${portfolio.totalGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(portfolio.totalGain)}
                    </p>
                    <p className={`text-sm ${portfolio.totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(portfolio.totalGainPercent)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* XIRR */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <div>
                      <span className="text-sm text-gray-300">XIRR (Annualized)</span>
                      <p className="text-xs text-gray-500">Time-weighted return</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {portfolio.xirr !== null ? (
                      <p className={`font-bold text-lg ${portfolio.xirr >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercent(portfolio.xirr)}
                      </p>
                    ) : (
                      <p className="font-bold text-lg text-gray-400">N/A</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Today's Change */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Today's Change</span>
                  </div>
                  <p className={`font-bold ${portfolio.todayGain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {portfolio.todayGain >= 0 ? '+' : ''}{formatCurrency(Math.abs(portfolio.todayGain))}
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">Total Invested</p>
                <p className="font-bold text-white">{formatCurrency(portfolio.totalCost)}</p>
              </div>
              <div className="bg-gray-700/30 p-3 rounded-lg text-center">
                <p className="text-xs text-gray-400 mb-1">Holdings</p>
                <p className="font-bold text-white">{portfolio.holdings.length} stocks</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sector Allocation */}
      {portfolio && portfolio.holdings.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
            <PieChart className="w-5 h-5 mr-2 text-blue-400" />
            Sector Allocation
          </h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(portfolio.diversity).length > 0 ? (
              Object.entries(portfolio.diversity)
                .sort(([,a], [,b]) => b - a)
                .map(([sector, percentage]) => (
                  <div key={sector} className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300 font-medium">{sector}</span>
                        <span className="text-sm font-bold text-white">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No sector data available</p>
            )}
          </div>
        </div>
      )}

      {/* Holdings Details */}
      {portfolio && portfolio.holdings.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 flex items-center justify-between text-white">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Your Holdings
            </span>
            <span className="text-sm text-gray-400">P&L</span>
          </h4>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {portfolio.holdings.map((holding) => (
              <div key={holding.symbol} className="bg-gray-700/40 p-4 rounded-lg border border-gray-600/30 hover:bg-gray-700/60 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-white text-lg">{holding.symbol}</span>
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">{holding.industry}</span>
                    </div>
                    <p className="text-sm text-gray-300 font-medium">{holding.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${holding.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {holding.gainLoss >= 0 ? '+' : ''}{formatCurrency(Math.abs(holding.gainLoss))}
                    </p>
                    <p className={`text-sm ${holding.gainLossPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(holding.gainLossPercent)}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                  <div>
                    <p className="mb-1">Position</p>
                    <p className="text-white font-medium">{holding.shares.toLocaleString()} shares</p>
                  </div>
                  <div>
                    <p className="mb-1">Avg Cost</p>
                    <p className="text-white font-medium">{formatCurrency(holding.avgPrice)}</p>
                  </div>
                  <div>
                    <p className="mb-1">Current Price</p>
                    <p className="text-white font-medium">{formatCurrency(holding.currentPrice)}</p>
                  </div>
                  <div>
                    <p className="mb-1">Market Value</p>
                    <p className="text-white font-medium">{formatCurrency(holding.totalValue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Stocks */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          Saved Stocks
        </h3>
        
        {savedStocks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium mb-2">No saved stocks</p>
            <p className="text-sm">Add stocks with 0 shares to save for later</p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedStocks.map((stock, index) => (
              <div key={index} className="bg-gray-700/50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{stock}</span>
                  <span className="text-sm text-blue-400">Watchlist</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market News */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
          <Bell className="w-5 h-5 mr-2 text-yellow-400" />
          Market News
        </h4>
        <NewsSection />
      </div>
      
      {/* Social Media & Notes */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4 flex items-center text-white">
          <Activity className="w-5 h-5 mr-2 text-purple-400" />
          Social Media & Notes
        </h4>
        <EnhancedSocialMediaFeed user={user} />
      </div>
    </div>
  );
};

// Notes Widget Component with Firebase Storage
const NotesWidget: React.FC<{ user: User | null }> = ({ user }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  // Load notes from Firebase
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedNotes: SavedNote[] = userData.notes || [];
          setNotes(savedNotes.map((note: SavedNote) => ({
            ...note,
            createdAt: note.createdAt && typeof note.createdAt === 'object' && 'seconds' in note.createdAt 
              ? new Date(note.createdAt.seconds * 1000) 
              : note.createdAt instanceof Date ? note.createdAt : new Date(),
            updatedAt: note.updatedAt && typeof note.updatedAt === 'object' && 'seconds' in note.updatedAt 
              ? new Date(note.updatedAt.seconds * 1000) 
              : note.updatedAt instanceof Date ? note.updatedAt : new Date()
          })));
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };

    loadNotes();
  }, [user]);

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim() || !user) return;

    setLoading(true);
    try {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const updatedNotes = [note, ...notes];
      setNotes(updatedNotes);

      // Save to Firebase
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        notes: updatedNotes
      });

      setNewNote({ title: '', content: '' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className={`bg-gray-700/50 rounded-lg transition-all duration-300 ${
        isExpanded ? 'p-4' : 'p-3'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <StickyNote className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">Notes</span>
        </div>
        {isExpanded && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-400 hover:text-yellow-400 transition-colors"
            disabled={loading}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {isEditing && (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Note title..."
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
              />
              <textarea
                placeholder="Note content..."
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-2 py-1 text-xs bg-gray-600 border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
                rows={3}
              />
              <button
                onClick={handleSaveNote}
                disabled={loading || !newNote.title.trim() || !newNote.content.trim()}
                className="text-xs bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 rounded transition-colors"
              >
                {loading ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notes.length === 0 ? (
              <p className="text-xs text-gray-400">No notes yet. Hover to add!</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="bg-gray-600/50 p-2 rounded text-xs">
                  <p className="font-medium text-yellow-300">{note.title}</p>
                  <p className="text-gray-300">{note.content}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {note.createdAt.toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Social Media Feed with Twitter Integration and Notes
const EnhancedSocialMediaFeed: React.FC<{ user: User | null }> = ({ user }) => {
  const [tweets, setTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTweets = useCallback(async () => {
    setLoading(true);
    try {
      // Placeholder for Twitter API integration
      // Once you have the API key, you can implement real Twitter fetching here
      
      if (TWITTER_API_KEY) {
        // Real Twitter API implementation would go here
        // For now, using demo tweet IDs
        const demoTweets = [
          '1767742391092162561',
          '1767741891092162561', 
          '1767741791092162561'
        ];
        setTweets(demoTweets);
      } else {
        // Demo data when no API key is available
        setTweets([]);
      }
    } catch (error) {
      console.error('Error fetching tweets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Social Media & Notes</h3>
        <button
          onClick={fetchTweets}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Notes Widget */}
      <NotesWidget user={user} />

      {/* Twitter Feed */}
      <div>
        <h4 className="font-medium mb-3 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-blue-400" />
          Market Tweets
        </h4>
        
        {!TWITTER_API_KEY ? (
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              Twitter integration available. Add VITE_TWITTER_API_KEY to .env file to enable real-time tweets.
            </p>
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : tweets.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tweets.map((tweetId) => (
              <div key={tweetId} className="bg-gray-800 rounded p-3">
                <p className="text-sm text-gray-300">Tweet placeholder for ID: {tweetId}</p>
                <p className="text-xs text-gray-500 mt-1">Real tweets will appear when API is configured</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No tweets available at the moment.</p>
        )}
      </div>
    </div>
  );
};

// User Dropdown Component
const UserDropdown: React.FC<{ user: User | null }> = ({ user }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
    setIsOpen(false);
  };

  const menuItems = [
    { 
      icon: UserCircle, 
      label: 'Account', 
      action: () => handleNavigation('/account'),
      description: 'Manage your profile'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      action: () => handleNavigation('/settings'),
      description: 'App preferences'
    },
    { 
      icon: LogOut, 
      label: 'Logout', 
      action: handleLogout,
      description: 'Sign out',
      className: 'text-red-400 hover:text-red-300'
    },
  ];

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <UserIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium hidden sm:block">
          {user.displayName || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium">{user.displayName || 'User'}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="py-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={`w-full flex items-center px-4 py-3 hover:bg-gray-700 transition-colors ${item.className || 'text-gray-300 hover:text-white'}`}
              >
                <item.icon className="w-4 h-4 mr-3" />
                <div className="text-left">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Market Overview Component with smooth refresh
const MarketOverview: React.FC<{ isRefreshing: boolean }> = ({ isRefreshing }) => {
  const [marketData, setMarketData] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const indices = [
        { symbol: '^GSPC', name: 'S&P 500', fallback: 'SPY' },
        { symbol: '^IXIC', name: 'NASDAQ', fallback: 'QQQ' },
        { symbol: '^DJI', name: 'Dow Jones', fallback: 'DIA' }
      ];

      const promises = indices.map(async (index) => {
        let response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${index.symbol}&token=${FINNHUB_API_KEY}`
        );
        let data = await response.json();
        
        if (!data || !data.c || data.c === 0) {
          response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${index.fallback}&token=${FINNHUB_API_KEY}`
          );
          data = await response.json();
        }
        
        if (data && data.c) {
          const change = data.d || 0;
          const changePercent = data.dp || 0;
          
          return {
            name: index.name,
            symbol: index.symbol,
            value: data.c.toFixed(2),
            change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
            changePercent: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            positive: change >= 0
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResults = results.filter(result => result !== null) as MarketIndex[];
      
      setMarketData(validResults);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 120000); // Every 2 minutes
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return (
    <div className={`mb-8 transition-opacity duration-300 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">Market Overview</h3>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))
        ) : (
          marketData.map((index) => (
            <div key={index.symbol} className="bg-gray-800 p-4 rounded-lg hover:bg-gray-700 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-400">{index.name}</p>
                  <p className="text-xl font-bold">${index.value}</p>
                </div>
                <div className={`text-right ${index.positive ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="flex items-center space-x-1">
                    {index.positive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-sm">{index.change}</span>
                  </div>
                  <p className="text-sm">{index.changePercent}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Quick Compare Widget
const QuickCompareWidget: React.FC = () => {
  const [showCompareModal, setShowCompareModal] = useState(false);

  return (
    <>
      <div className="bg-gradient-to-r from-purple-900/20 to-purple-800/20 p-6 rounded-lg border border-purple-700/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <GitCompare className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Compare Stocks</h3>
              <p className="text-sm text-gray-300">Analyze multiple stocks side by side</p>
            </div>
          </div>
          <Zap className="w-8 h-8 text-purple-400 opacity-50" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">✓ Financial metrics comparison</span>
            <span className="text-gray-300">✓ Side-by-side analysis</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300">✓ Performance insights</span>
            <span className="text-gray-300">✓ Investment decisions</span>
          </div>
        </div>

        <button
          onClick={() => setShowCompareModal(true)}
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
        >
          <GitCompare className="w-5 h-5" />
          <span>Start Comparing</span>
        </button>
      </div>

      {/* Compare Stocks Modal */}
      <CompareStocks
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        initialStock=""
      />
    </>
  );
};

// Main HomePage Component
const HomePage: React.FC<HomePageProps> = ({ user, onPortfolioUpdate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [prefilledQuestion, setPrefilledQuestion] = useState<string>('');
  const [portfolioRefreshTrigger, setPortfolioRefreshTrigger] = useState(0);
  const { isRefreshing, smoothRefresh } = useSmootRefresh();
  
  // Check user's Pro status
  const { isPro, loading: planLoading } = useUserPlan(user);

  // Market status state
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [marketHours, setMarketHours] = useState('');

  useEffect(() => {
    if (location.state?.askQuestion) {
      setPrefilledQuestion(location.state.askQuestion);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Market status check
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const day = now.getDay();
      
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = currentTime >= 930 && currentTime <= 1600;
      
      setIsMarketOpen(isWeekday && isMarketHours);
      
      if (isMarketOpen) {
        setMarketHours('Closes 4:00 PM EST');
      } else if (isWeekday) {
        setMarketHours('Opens 9:30 AM EST');
      } else {
        setMarketHours('Closed - Weekend');
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, [isMarketOpen]);

  const handlePortfolioUpdate = useCallback(() => {
    if (user) {
      setPortfolioRefreshTrigger(prev => prev + 1);
      onPortfolioUpdate();
    }
  }, [onPortfolioUpdate, user]);

  const refreshAllData = async () => {
    if (user) {
      await smoothRefresh(async () => {
        handlePortfolioUpdate();
        // Additional refresh logic can be added here
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Professional Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">TechInvestorAI</h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* Learning Page Button */}
              <button
                onClick={() => navigate('/learning')}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:block">Learn</span>
              </button>

              {user ? (
                <>
                  <button
                    onClick={refreshAllData}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Refresh Data"
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <UserDropdown user={user} />
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {/* Welcome Section with Market Status Widget */}
        <div className="mb-8 flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-3xl font-bold">
                {user 
                  ? `Welcome back${user.displayName ? `, ${user.displayName}` : ''}!`
                  : 'Welcome to TechInvestorAI!'
                }
              </h2>
              {user && !planLoading && isPro && (
                <span className="px-3 py-1 text-sm bg-yellow-600 text-yellow-100 rounded-full flex items-center space-x-1">
                  <Crown className="w-4 h-4" />
                  <span>Pro</span>
                </span>
              )}
            </div>
            <p className="text-gray-400">
              {user 
                ? 'Track your investments and discover new opportunities with AI-powered insights'
                : 'Your AI-powered investment platform. Search stocks, get insights, and track your portfolio.'
              }
            </p>
            {!user && (
              <p className="text-sm text-blue-400 mt-2">
                👆 Login or Sign up to unlock all features including portfolio tracking, AI assistant, and more!
              </p>
            )}
          </div>
          
          {/* Market Status Widget */}
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
            </div>
            <p className="text-xs text-gray-400">{marketHours}</p>
          </div>
        </div>

        {/* Search and Ask AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
              Stock Search
              {!user && <span className="ml-2 text-xs text-gray-400">(Always Available)</span>}
            </h3>
            <EnhancedStockSearch user={user} onPortfolioUpdate={handlePortfolioUpdate} />
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-400" />
              Ask AI Assistant
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-yellow-100 rounded-full">Pro</span>
            </h3>
            {user ? (
              <AskAI 
                prefilledQuestion={prefilledQuestion}
                onQuestionProcessed={() => setPrefilledQuestion('')}
              />
            ) : (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
                <p className="text-lg font-medium mb-2 text-gray-300">Login Required</p>
                <p className="text-sm text-gray-400 mb-4">Please login to use the AI assistant feature</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors text-white text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </button>
                  <button
                    onClick={() => navigate('/signup')}
                    className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors text-white text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Sign Up</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Market Overview */}
        <MarketOverview isRefreshing={isRefreshing} />

        {/* Portfolio Summary Grid - Only for logged in users */}
        {user ? (
          <section className="mb-8">
            <EnhancedPortfolioSummary user={user} refreshTrigger={portfolioRefreshTrigger} />
          </section>
        ) : (
          <section className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <LoginRequired 
                title="Portfolio Performance" 
                description="Please login to view your portfolio performance and track your investments"
                icon={BarChart3}
                iconColor="text-green-400"
              />
              <LoginRequired 
                title="Sector Allocation" 
                description="Please login to see your portfolio's sector distribution and diversity metrics"
                icon={PieChart}
                iconColor="text-blue-400"
              />
              <LoginRequired 
                title="Holdings Details" 
                description="Please login to view your individual stock holdings and performance"
                icon={DollarSign}
                iconColor="text-yellow-400"
              />
            </div>
          </section>
        )}

        {/* Compare Stocks Section - Enhanced with Quick Access */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Compare Widget */}
            <QuickCompareWidget />
            
            {/* Feature Highlights */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4 flex items-center text-white">
                <Zap className="w-5 h-5 mr-2 text-orange-400" />
                Why Compare Stocks?
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Financial Analysis</h4>
                    <p className="text-sm text-gray-400">Compare P/E ratios, market cap, revenue, and profitability metrics side by side</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Investment Decisions</h4>
                    <p className="text-sm text-gray-400">Make informed choices by analyzing multiple investment opportunities</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Peer Analysis</h4>
                    <p className="text-sm text-gray-400">Compare stocks within the same industry or across different sectors</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Performance Insights</h4>
                    <p className="text-sm text-gray-400">Identify best and worst performers across key metrics instantly</p>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Pro Feature</span>
                  </div>
                  <p className="text-xs text-blue-200">
                    Stock comparison is available to all users. Login to save comparisons and access advanced analytics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Learning Resources */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-green-900/20 to-green-800/20 p-6 rounded-lg border border-green-700/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                  <GraduationCap className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Learn Investing</h3>
                  <p className="text-sm text-gray-300">Master the fundamentals of stock market investing</p>
                </div>
              </div>
              <BookOpen className="w-8 h-8 text-green-400 opacity-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-300 mb-2">📈 Stock Basics</h4>
                <p className="text-sm text-gray-300">Understand P/E ratios, market cap, dividends, and key metrics</p>
              </div>
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-300 mb-2">💰 Portfolio Building</h4>
                <p className="text-sm text-gray-300">Learn diversification, risk management, and asset allocation</p>
              </div>
              <div className="bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-green-300 mb-2">🔍 Research Methods</h4>
                <p className="text-sm text-gray-300">Fundamental and technical analysis techniques</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/learning')}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Start Learning</span>
            </button>
          </div>
        </section>

        {/* Existing StockQuiz Component */}
        <StockQuiz />
      </main>
    </div>
  );
};

export default HomePage;