import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BarChart3,
  Users,
  BookOpen,
  Target,
  Bell,
  DollarSign,
  Info,
  XIcon,
  Shield,
  Lightbulb,
  GraduationCap,
  GitCompare
} from 'lucide-react';
import CompareStocks from '../components/CompareStocks';;

interface StockDetails {
  price: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  exchange?: string;
  name?: string;
  logo?: string;
  industry?: string;
  sector?: string;
  beta?: number;
  eps?: number;
  dividend?: number;
  yearHigh?: number;
  yearLow?: number;
}

interface NewsItem {
  id: string;
  headline: string;
  url: string;
  datetime: number;
  source: string;
  summary?: string;
  sentiment?: string;
  imageUrl?: string;
}

interface Analysis {
  point: string;
  type: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

interface PeerStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap?: number;
}

interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BeginnerTip {
  title: string;
  explanation: string;
  type: 'info' | 'warning' | 'success';
}

interface ComparisonStock {
  symbol: string;
  name: string;
  price: number;
  peRatio: number;
  marketCap: number;
  changePercent: number;
}

interface Tweet {
  id: string;
  text: string;
  author: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
  };
}

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const TWITTER_API_KEY = import.meta.env.VITE_TWITTER_API_KEY || '';

// Enhanced API call with retry logic and caching
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestCounts = new Map<string, number>();
  private lastRequestTime = new Map<string, number>();
  private requestLog: Map<string, number[]> = new Map();
  
  /*private isRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(endpoint) || 0;
    const requestCount = this.requestCounts.get(endpoint) || 0;
    
    // Reset count if more than 1 minute has passed
    if (now - lastRequest > 60000) {
      this.requestCounts.set(endpoint, 0);
      return false;
    }
    
    // Allow max 10 requests per minute per endpoint
    return requestCount >= 30;
  }
  
  private incrementRequestCount(endpoint: string): void {
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(endpoint) || 0;
    
    if (now - lastRequest > 60000) {
      this.requestCounts.set(endpoint, 1);
    } else {
      const current = this.requestCounts.get(endpoint) || 0;
      this.requestCounts.set(endpoint, current + 1);
    }
    
    this.lastRequestTime.set(endpoint, now);
  } */

    // Sliding window: Max 30 requests per endpoint per 60 seconds
private isRateLimited(endpoint: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;

  const logs = this.requestLog.get(endpoint) || [];

  // Only keep recent requests within the time window
  const recentLogs = logs.filter(ts => now - ts < windowMs);

  // If limit hit, deny
  if (recentLogs.length >= maxRequests) {
    return true;
  }

  // Otherwise, record the new request
  recentLogs.push(now);
  this.requestLog.set(endpoint, recentLogs);
  return false;
}

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any, ttl: number = 300000): void { // Default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async fetchWithRetry(url: string, maxRetries: number = 3, ttl?: number): Promise<any> {
    const endpoint = new URL(url).pathname;
    
    // Check rate limiting
    if (this.isRateLimited(endpoint)) {
      throw new Error('Rate limited. Please wait before making more requests.');
    }
    
    // Check cache first
    const cached = this.get(url);
    if (cached) {
      return cached;
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('API rate limit exceeded. Please wait a moment.');
          }
          if (response.status >= 500) {
            throw new Error(`Server error: ${response.status}`);
          }
          throw new Error(`HTTP error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache successful response
        this.set(url, data, ttl);
        
        return data;
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on rate limits or client errors
        if (error instanceof Error && 
            (error.message.includes('rate limit') || error.message.includes('HTTP error: 4'))) {
          break;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }
}

const apiCache = new APICache();

// Educational tooltips for beginners
const beginnerGuides: { [key: string]: BeginnerTip } = {
  peRatio: {
    title: "P/E Ratio Explained",
    explanation: "Price-to-Earnings ratio compares a company's share price to its per-share earnings. Lower P/E might indicate undervaluation, higher P/E might suggest growth expectations or overvaluation.",
    type: "info"
  },
  marketCap: {
    title: "Market Capitalization",
    explanation: "Total value of all company shares. Large-cap (>$10B) = stable, Mid-cap ($2-10B) = balanced, Small-cap (<$2B) = higher growth potential but riskier.",
    type: "info"
  },
  beta: {
    title: "Beta (Volatility)",
    explanation: "Measures stock volatility vs market. Beta >1 = more volatile than market, Beta <1 = less volatile, Beta =1 = moves with market.",
    type: "warning"
  },
  dividend: {
    title: "Dividend Yield",
    explanation: "Annual dividend payments as percentage of stock price. Higher yield = more income, but may indicate slower growth.",
    type: "success"
  }
};

// Risk assessment function
const getRiskLevel = (beta: number, peRatio: number, marketCap: number): { level: string; color: string; explanation: string } => {
  let riskScore = 0;
  
  if (beta > 1.5) riskScore += 2;
  else if (beta > 1.2) riskScore += 1;
  
  if (peRatio > 30) riskScore += 2;
  else if (peRatio > 20) riskScore += 1;
  
  if (marketCap < 2) riskScore += 2;
  else if (marketCap < 10) riskScore += 1;
  
  if (riskScore >= 4) {
    return { level: "High Risk", color: "text-red-400", explanation: "High volatility, potential for large gains/losses" };
  } else if (riskScore >= 2) {
    return { level: "Medium Risk", color: "text-yellow-400", explanation: "Moderate volatility, balanced risk/reward" };
  } else {
    return { level: "Low Risk", color: "text-green-400", explanation: "Lower volatility, more stable investment" };
  }
};

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Stock page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
          <h3 className="text-red-400 font-medium mb-2">Something went wrong</h3>
          <p className="text-red-300 text-sm">Please refresh the page to try again.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
    <p className="text-gray-400">{message}</p>
  </div>
);

// Error Component
const ErrorDisplay: React.FC<{ 
  error: string; 
  onRetry?: () => void; 
  canRetry?: boolean 
}> = ({ error, onRetry, canRetry = true }) => (
  <div className="p-6 bg-red-900/20 border border-red-800 rounded-lg">
    <div className="flex items-start space-x-3">
      <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="text-red-400 font-medium mb-2">Error Loading Data</h3>
        <p className="text-red-300 text-sm mb-4">{error}</p>
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

const EnhancedStockPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [stockDetails, setStockDetails] = useState<StockDetails | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [peers, setPeers] = useState<PeerStock[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [peersLoading, setPeersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Validate symbol
  useEffect(() => {
    if (!symbol || symbol.trim() === '') {
      setError('Invalid stock symbol provided');
      setLoading(false);
      return;
    }
    
    // Reset states when symbol changes
    setStockDetails(null);
    setNews([]);
    setPeers([]);
    setChartData([]);
    setTweets([]);
    setError(null);
    setAnalysis([]);
    setRetryCount(0);
  }, [symbol]);

  // Fetch stock data with enhanced error handling
  const fetchStockData = useCallback(async (stockSymbol: string): Promise<StockDetails> => {
    try {
      if (!FINNHUB_API_KEY) {
        throw new Error('Finnhub API key not configured. Please set VITE_FINNHUB_API_KEY in your environment.');
      }

      const [quote, profile, metrics] = await Promise.allSettled([
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/profile2?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/metric?symbol=${stockSymbol}&metric=all&token=${FINNHUB_API_KEY}`)
      ]);

      // Handle quote data (required)
      if (quote.status === 'rejected') {
        throw new Error(`Failed to fetch quote data: ${quote.reason.message}`);
      }
      
      const quoteData = quote.value;
      if (!quoteData || quoteData.c === 0) {
        throw new Error(`Invalid stock symbol: ${stockSymbol}`);
      }

      // Handle optional data with fallbacks
      const profileData = profile.status === 'fulfilled' ? profile.value : {};
      const metricsData = metrics.status === 'fulfilled' ? metrics.value : { metric: {} };

      return {
        price: quoteData.c,
        high: quoteData.h,
        low: quoteData.l,
        open: quoteData.o,
        prevClose: quoteData.pc,
        change: quoteData.d,
        changePercent: quoteData.dp,
        name: profileData.name || `${stockSymbol} Corporation`,
        exchange: profileData.exchange || 'Unknown',
        marketCap: profileData.marketCapitalization ? profileData.marketCapitalization / 1000 : undefined,
        industry: profileData.finnhubIndustry || 'Technology',
        sector: profileData.gicsSector || 'Technology',
        logo: profileData.logo,
        peRatio: metricsData.metric?.peBasicExclExtraTTM,
        beta: metricsData.metric?.beta,
        eps: metricsData.metric?.epsBasicExclExtraItemsTTM,
        dividend: metricsData.metric?.dividendYieldIndicatedAnnual,
        yearHigh: metricsData.metric?.['52WeekHigh'],
        yearLow: metricsData.metric?.['52WeekLow']
      };
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }, []);

  // Fetch peer stocks with error handling
  const fetchPeers = useCallback(async (stockSymbol: string) => {
    try {
      if (!FINNHUB_API_KEY) {
        setPeers([]);
        return;
      }

      const peerSymbols = await apiCache.fetchWithRetry(
        `https://finnhub.io/api/v1/stock/peers?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`,
        2,
        600000 // 10 minutes cache
      );
      
      if (!Array.isArray(peerSymbols) || peerSymbols.length === 0) {
        setPeers([]);
        return;
      }

      const peerPromises = peerSymbols.slice(0, 5).map(async (peerSymbol: string) => {
        try {
          const [quoteRes, profileRes] = await Promise.allSettled([
            apiCache.fetchWithRetry(`https://finnhub.io/api/v1/quote?symbol=${peerSymbol}&token=${FINNHUB_API_KEY}`, 1),
            apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/profile2?symbol=${peerSymbol}&token=${FINNHUB_API_KEY}`, 1)
          ]);
          
          if (quoteRes.status === 'rejected') return null;
          
          const quote = quoteRes.value;
          const profile = profileRes.status === 'fulfilled' ? profileRes.value : {};
          
          return {
            symbol: peerSymbol,
            name: profile.name || peerSymbol,
            price: quote.c || 0,
            change: quote.d || 0,
            changePercent: quote.dp || 0,
            marketCap: profile.marketCapitalization ? profile.marketCapitalization / 1000 : undefined
          };
        } catch {
          return null;
        }
      });

      const peerResults = await Promise.all(peerPromises);
      const validPeers = peerResults.filter(peer => peer !== null) as PeerStock[];
      setPeers(validPeers);
    } catch (error) {
      console.error('Error fetching peers:', error);
      setPeers([]);
    }
  }, []);

  // Fetch chart data with error handling
  const fetchChartData = useCallback(async (stockSymbol: string) => {
    try {
      if (!FINNHUB_API_KEY) return;

      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (30 * 24 * 60 * 60); // 30 days ago
      
      const data = await apiCache.fetchWithRetry(
        `https://finnhub.io/api/v1/stock/candle?symbol=${stockSymbol}&resolution=D&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`,
        2,
        1800000 // 30 minutes cache
      );
      
      if (data.s === 'ok' && data.t && data.t.length > 0) {
        const chartPoints: ChartData[] = data.t.map((timestamp: number, index: number) => ({
          timestamp: timestamp * 1000,
          open: data.o[index],
          high: data.h[index],
          low: data.l[index],
          close: data.c[index],
          volume: data.v[index]
        }));
        
        setChartData(chartPoints);
        drawChart(chartPoints);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    }
  }, []);

  // Fetch news with error handling
  const fetchNews = useCallback(async (stockSymbol: string) => {
    try {
      if (!FINNHUB_API_KEY) {
        setNews([]);
        return;
      }

      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      
      const newsData = await apiCache.fetchWithRetry(
        `https://finnhub.io/api/v1/company-news?symbol=${stockSymbol}&from=${fromDate.toISOString().split('T')[0]}&to=${toDate.toISOString().split('T')[0]}&token=${FINNHUB_API_KEY}`,
        2,
        1800000 // 30 minutes cache
      );
      
      if (Array.isArray(newsData) && newsData.length > 0) {
        const formattedNews = newsData.slice(0, 5).map((item: any, index: number) => ({
          id: `${stockSymbol}-${index}`,
          headline: item.headline,
          url: item.url,
          datetime: item.datetime * 1000,
          source: item.source,
          summary: item.summary,
          imageUrl: item.image
        }));
        setNews(formattedNews);
      } else {
        setNews([]);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    }
  }, []);

  // Fetch tweets (mock data)
  const fetchTweets = useCallback(async (stockSymbol: string) => {
    try {
      // Mock tweets for demo
      const mockTweets: Tweet[] = [
        {
          id: '1',
          text: `Latest analysis on $${stockSymbol} shows strong fundamentals and positive sentiment from institutional investors.`,
          author: 'MarketAnalyst',
          created_at: new Date().toISOString(),
          public_metrics: { retweet_count: 45, like_count: 128, reply_count: 23 }
        },
        {
          id: '2',
          text: `$${stockSymbol} earnings report next week could be a catalyst for price movement. Keep an eye on revenue guidance.`,
          author: 'StockTrader',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          public_metrics: { retweet_count: 32, like_count: 87, reply_count: 15 }
        }
      ];

      setTweets(mockTweets);
    } catch {
      setTweets([]);
    }
  }, []);

  // Enhanced analysis generation
  const generateEnhancedAnalysis = useCallback((stockData: StockDetails): Analysis[] => {
    const analysis: Analysis[] = [];
    
    try {
      // Price movement analysis
      const changePercent = stockData.changePercent ?? 0;
      if (Math.abs(changePercent) > 5) {
        analysis.push({
          point: `Significant ${changePercent > 0 ? 'gain' : 'loss'} of ${Math.abs(changePercent).toFixed(2)}% today`,
          type: changePercent > 0 ? 'positive' : 'negative',
          explanation: changePercent > 0 
            ? 'Strong positive momentum may indicate good news or market sentiment'
            : 'Significant decline may present buying opportunity or indicate fundamental issues'
        });
      }

      // Valuation analysis
      if (stockData.peRatio && stockData.peRatio > 0) {
        if (stockData.peRatio < 15) {
          analysis.push({
            point: `Attractive valuation with P/E of ${stockData.peRatio.toFixed(1)}`,
            type: 'positive',
            explanation: 'Lower P/E ratios often indicate undervalued stocks relative to earnings'
          });
        } else if (stockData.peRatio > 25) {
          analysis.push({
            point: `High valuation with P/E of ${stockData.peRatio.toFixed(1)}`,
            type: 'negative',
            explanation: 'High P/E may indicate overvaluation or high growth expectations'
          });
        }
      }

      // 52-week range analysis
      if (stockData.yearHigh && stockData.yearLow) {
        const positionInRange = ((stockData.price - stockData.yearLow) / (stockData.yearHigh - stockData.yearLow)) * 100;
        
        if (positionInRange > 80) {
          analysis.push({
            point: `Trading near 52-week high (${positionInRange.toFixed(0)}% of range)`,
            type: 'neutral',
            explanation: 'Stock is performing well but may face resistance at these levels'
          });
        } else if (positionInRange < 20) {
          analysis.push({
            point: `Trading near 52-week low (${positionInRange.toFixed(0)}% of range)`,
            type: 'neutral',
            explanation: 'Stock may be undervalued but consider why it\'s at these levels'
          });
        }
      }

      // Dividend analysis
      if (stockData.dividend && stockData.dividend > 2) {
        analysis.push({
          point: `Good dividend yield of ${stockData.dividend.toFixed(2)}%`,
          type: 'positive',
          explanation: 'Dividend-paying stocks provide regular income and may indicate financial stability'
        });
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
    }

    return analysis;
  }, []);

  // Draw chart with error handling
  const drawChart = useCallback((data: ChartData[]) => {
    try {
      const canvas = canvasRef.current;
      if (!canvas || data.length === 0) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const padding = 40;

      // Clear canvas
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, width, height);

      // Get price range
      const prices = data.map(d => d.close);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;

      if (priceRange === 0) return; // Avoid division by zero

      // Draw price line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((point.close - minPrice) / priceRange) * (height - 2 * padding);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw current price indicator
      const lastPrice = prices[prices.length - 1];
      const lastY = height - padding - ((lastPrice - minPrice) / priceRange) * (height - 2 * padding);
      
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(width - padding, lastY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw price labels
      ctx.fillStyle = '#9ca3af';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      
      ctx.fillText(`$${maxPrice.toFixed(2)}`, width - padding - 10, padding);
      ctx.fillText(`$${minPrice.toFixed(2)}`, width - padding - 10, height - padding);
      ctx.fillText(`$${lastPrice.toFixed(2)}`, width - padding - 10, lastY + 4);
    } catch (error) {
      console.error('Error drawing chart:', error);
    }
  }, []);

  // Main data loading with enhanced error handling
  const loadAllData = useCallback(async () => {
    if (!symbol) {
      setError('No stock symbol provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Load main stock data first (required)
      const stockData = await fetchStockData(symbol);
      setStockDetails(stockData);
      
      // Generate analysis
      const analysisData = generateEnhancedAnalysis(stockData);
      setAnalysis(analysisData);
      
      setLoading(false);
      
      // Load additional data in background (non-blocking)
      Promise.allSettled([
        fetchPeers(symbol).finally(() => setPeersLoading(false)),
        fetchChartData(symbol),
        fetchTweets(symbol),
        fetchNews(symbol).finally(() => setNewsLoading(false))
      ]).catch(err => {
        console.warn('Some background data failed to load:', err);
      });
      
    } catch (err) {
      console.error('Error loading stock data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
      setError(errorMessage);
      setLoading(false);
      setNewsLoading(false);
      setPeersLoading(false);
    }
  }, [symbol, fetchStockData, generateEnhancedAnalysis, fetchPeers, fetchChartData, fetchTweets, fetchNews]);

  // Load data on mount and symbol change
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Retry function
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    loadAllData();
  }, [loadAllData]);

  // Utility functions
  const formatDate = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      return `${Math.floor(diffInHours / 24)}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const formatVolume = (volume?: number): string => {
    if (!volume) return 'N/A';
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  const getAnalysisIcon = (type: 'positive' | 'negative' | 'neutral'): JSX.Element => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'negative': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'neutral': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  // Render error state
  if (error && !stockDetails) {
    return (
      <ErrorBoundary>
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{symbol}</h1>
            <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
          
          <ErrorDisplay 
            error={error} 
            onRetry={handleRetry} 
            canRetry={retryCount < 3}
          />
          
          {retryCount >= 3 && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <p className="text-yellow-300 text-sm">
                Multiple attempts failed. This might be due to API rate limits. 
                Please wait a few minutes before trying again.
              </p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            {stockDetails?.logo && (
              <img 
                src={stockDetails.logo} 
                alt={`${symbol} logo`} 
                className="w-12 h-12 rounded-lg border border-gray-600"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">
                {loading ? 'Loading...' : `${symbol} - ${stockDetails?.name}`}
              </h1>
              {stockDetails && (
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm text-gray-400">{stockDetails.exchange}</span>
                  {stockDetails.sector && (
                    <span className="text-sm bg-blue-600 text-blue-100 px-2 py-1 rounded-full">
                      {stockDetails.sector}
                    </span>
                  )}
                  {stockDetails.beta && stockDetails.peRatio && stockDetails.marketCap && (
                    <span className={`text-sm px-2 py-1 rounded-full ${getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap).color}`}>
                      {getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap).level}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCompareModal(true)}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare</span>
            </button>
            <button
              onClick={handleRetry}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link 
              to="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <LoadingSpinner message="Loading stock data..." />
        ) : stockDetails ? (
          <>
            {/* Price and Key Metrics Row */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl font-bold text-white">${stockDetails.price.toFixed(2)}</span>
                    <div className={`flex items-center space-x-1 ${(stockDetails.change ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(stockDetails.change ?? 0) >= 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="text-lg font-semibold">
                        {(stockDetails.change ?? 0) >= 0 ? '+' : ''}${(stockDetails.change || 0).toFixed(2)}
                      </span>
                      <span className="text-lg">
                        ({(stockDetails.changePercent ?? 0) >= 0 ? '+' : ''}{(stockDetails.changePercent ?? 0).toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Real-time price</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:col-span-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="text-lg font-semibold text-white">
                      {stockDetails.marketCap ? `$${stockDetails.marketCap.toFixed(1)}B` : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-400">P/E Ratio</p>
                    <p className="text-lg font-semibold text-white">
                      {stockDetails.peRatio ? stockDetails.peRatio.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Beta</p>
                    <p className="text-lg font-semibold text-white">
                      {stockDetails.beta ? stockDetails.beta.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Dividend</p>
                    <p className="text-lg font-semibold text-white">
                      {stockDetails.dividend ? `${stockDetails.dividend.toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of the content with proper error boundaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Stock Information */}
              <ErrorBoundary fallback={<ErrorDisplay error="Failed to load stock details" onRetry={handleRetry} />}>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <DollarSign className="w-5 h-5 mr-2 text-green-400" />
                    Stock Details
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Day Range:</span>
                      <span className="text-white">${stockDetails.low.toFixed(2)} - ${stockDetails.high.toFixed(2)}</span>
                    </div>
                    
                    {stockDetails.yearLow && stockDetails.yearHigh && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">52W Range:</span>
                        <span className="text-white">${stockDetails.yearLow.toFixed(2)} - ${stockDetails.yearHigh.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Open:</span>
                      <span className="text-white">${stockDetails.open.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Previous Close:</span>
                      <span className="text-white">${stockDetails.prevClose.toFixed(2)}</span>
                    </div>
                    
                    {stockDetails.eps && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">EPS:</span>
                        <span className="text-white">${stockDetails.eps.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {stockDetails.industry && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Industry:</span>
                        <span className="text-white text-sm">{stockDetails.industry}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ErrorBoundary>

              {/* Latest News */}
              <ErrorBoundary fallback={<ErrorDisplay error="Failed to load news" />}>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
                    Latest News
                  </h2>
                  
                  {newsLoading ? (
                    <LoadingSpinner message="Loading news..." />
                  ) : (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {news.length > 0 ? (
                        news.map((item) => (
                          <div key={item.id} className="border-b border-gray-700 pb-3 last:border-0">
                            <a 
                              href={item.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group block hover:bg-gray-700/30 p-2 rounded-lg transition-colors"
                            >
                              <h3 className="text-blue-400 group-hover:text-blue-300 text-sm font-medium leading-tight line-clamp-2">
                                {item.headline}
                              </h3>
                              <div className="flex items-center justify-between mt-2 text-xs">
                                <span className="text-gray-400">{item.source}</span>
                                <span className="text-gray-500">{formatDate(item.datetime)}</span>
                              </div>
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No recent news available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ErrorBoundary>

              {/* Peer Stocks */}
              <ErrorBoundary fallback={<ErrorDisplay error="Failed to load peer stocks" />}>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <Users className="w-5 h-5 mr-2 text-purple-400" />
                    Peer Stocks
                  </h2>
                  
                  {peersLoading ? (
                    <LoadingSpinner message="Loading peers..." />
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {peers.length > 0 ? (
                        peers.map((peer) => (
                          <Link
                            key={peer.symbol}
                            to={`/stock/${peer.symbol}`}
                            className="block p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors group"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-white group-hover:text-blue-400">{peer.symbol}</p>
                                <p className="text-xs text-gray-400 truncate">{peer.name}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-white font-medium">${peer.price.toFixed(2)}</p>
                                <p className={`text-xs ${peer.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {peer.changePercent >= 0 ? '+' : ''}{peer.changePercent.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-400 text-sm">No peer data available</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ErrorBoundary>

              {/* Stock Analysis */}
              <ErrorBoundary fallback={<ErrorDisplay error="Failed to load analysis" />}>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    AI Analysis
                  </h2>
                  
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {analysis.length > 0 ? analysis.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-start space-x-3">
                          {getAnalysisIcon(item.type)}
                          <div>
                            <p className="font-medium text-white text-sm">{item.point}</p>
                            <p className="text-xs text-gray-400 mt-1">{item.explanation}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-6">
                        <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Analysis will appear after loading</p>
                      </div>
                    )}
                  </div>
                </div>
              </ErrorBoundary>

              {/* Beginner Guide */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <GraduationCap className="w-5 h-5 mr-2 text-green-400" />
                  Beginner Guide
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-300">Understanding Stock Prices</h4>
                        <p className="text-xs text-blue-200 mt-1">
                          Stock prices fluctuate based on supply and demand, company performance, and market sentiment.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {stockDetails && (
                    <div className={`p-3 rounded-lg border ${
                      stockDetails.beta && stockDetails.peRatio && stockDetails.marketCap
                        ? getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap).level === 'High Risk'
                          ? 'bg-red-900/20 border-red-700'
                          : getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap).level === 'Medium Risk'
                          ? 'bg-yellow-900/20 border-yellow-700'
                          : 'bg-green-900/20 border-green-700'
                        : 'bg-gray-700/20 border-gray-600'
                    }`}>
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-sm font-medium">Risk Assessment</h4>
                          <p className="text-xs mt-1">
                            {stockDetails.beta && stockDetails.peRatio && stockDetails.marketCap
                              ? getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap).explanation
                              : 'Consider volatility, valuation, and company size when assessing risk.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-300">Investment Tips</h4>
                        <p className="text-xs text-purple-200 mt-1">
                          Diversify your portfolio, invest only what you can afford to lose, and do your research.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Updates */}
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <XIcon className="w-5 h-5 mr-2 text-blue-400" />
                  Social Sentiment
                </h2>
                
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {tweets.length > 0 ? tweets.map((tweet) => (
                    <div key={tweet.id} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">{tweet.author[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-white">@{tweet.author}</p>
                            <span className="text-xs text-gray-400">
                              {formatDate(new Date(tweet.created_at).getTime())}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{tweet.text}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>♥️ {tweet.public_metrics.like_count}</span>
                            <span>🔄 {tweet.public_metrics.retweet_count}</span>
                            <span>💬 {tweet.public_metrics.reply_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-6">
                      <XIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">No social media data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart Section - Full Width */}
            <ErrorBoundary fallback={<ErrorDisplay error="Failed to load chart" />}>
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
                  Price Chart (30 Days)
                </h2>
                
                <div className="relative h-80 bg-gray-900 rounded-lg border border-gray-600">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full rounded-lg"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {chartData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-gray-400">Chart data loading...</p>
                    </div>
                  )}
                </div>
              </div>
            </ErrorBoundary>

            {/* Data source disclaimer */}
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Real-time data provided by Finnhub API. Data cached for performance.
                {!FINNHUB_API_KEY && (
                  <span className="text-yellow-400"> Configure VITE_FINNHUB_API_KEY for full functionality.</span>
                )}
              </p>
            </div>
          </>
        ) : null}

        {/* Compare Stocks Modal */}
        <CompareStocks
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
          initialStock={symbol}
        />
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedStockPage;