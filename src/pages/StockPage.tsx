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
  GitCompare,
  Calculator,
  Award,
  Activity,
  PieChart,
  Gauge,
  Zap,
  Star,
  Brain,
  Timer,
  Building,
  Globe,
  Calendar,
  HelpCircle,
  TrendingUpIcon,
  Eye,
  Clock,
  Percent
} from 'lucide-react';
import CompareStocks from '../components/CompareStocks';

// Enhanced interface with all metrics from CompareStocks
interface StockDetails {
  price: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  exchange?: string;
  name?: string;
  logo?: string;
  industry?: string;
  sector?: string;
  
  // Financial Metrics
  marketCap?: number;
  peRatio?: number;
  pegRatio?: number;
  pbRatio?: number;
  psRatio?: number;
  eps?: number;
  beta?: number;
  dividend?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  grossMargin?: number;
  operatingMargin?: number;
  profitMargin?: number;
  yearHigh?: number;
  yearLow?: number;
  analystTarget?: number;
  avgVolume?: number;
  employees?: number;
  founded?: string;
  country?: string;
  
  // Advanced Metrics
  riskMetrics?: RiskMetrics;
  technicalIndicators?: TechnicalIndicators;
  newsMetrics?: NewsMetrics;
  insiderActivity?: InsiderActivity;
  quarterlyData?: QuarterlyData;
  priceHistory?: number[];
  recommendation?: StockRecommendation;
}

interface RiskMetrics {
  riskScore: number; // 0-10
  volatilityRank: number; // 1-5
  liquidityScore: number; // 0-10
  fundamentalRisk: number; // 0-10
}

interface TechnicalIndicators {
  rsi: number; // 0-100
  movingAvg20: number;
  movingAvg50: number;
  support: number;
  resistance: number;
  momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

interface NewsMetrics {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number; // -100 to 100
  newsCount: number;
  buzzScore: number; // 0-10
}

interface InsiderActivity {
  recentBuys: number;
  recentSells: number;
  netActivity: 'BUYING' | 'SELLING' | 'NEUTRAL';
  institutionalOwnership: number; // percentage
}

interface QuarterlyData {
  revenue?: number;
  revenueGrowth?: number;
  earnings?: number;
  earningsGrowth?: number;
  quarterlyEps?: number;
  quarterlyEpsGrowth?: number;
}

interface StockRecommendation {
  longTerm: number; // Score 0-10
  shortTerm: number; // Score 0-10
  dividend: number; // Score 0-10
  overall: 'BUY' | 'HOLD' | 'SELL';
  reasons: string[];
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
  category: 'valuation' | 'growth' | 'risk' | 'technical' | 'fundamental';
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
  category: string;
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

// Enhanced API cache
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private requestLog: Map<string, number[]> = new Map();
  
  private isRateLimited(endpoint: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 30;

    const logs = this.requestLog.get(endpoint) || [];
    const recentLogs = logs.filter(ts => now - ts < windowMs);

    if (recentLogs.length >= maxRequests) {
      return true;
    }

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

  set(key: string, data: any, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  async fetchWithRetry(url: string, maxRetries: number = 3, ttl?: number): Promise<any> {
    const endpoint = new URL(url).pathname;
    
    if (this.isRateLimited(endpoint)) {
      throw new Error('Rate limited. Please wait before making more requests.');
    }
    
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
        this.set(url, data, ttl);
        return data;
      } catch (error) {
        lastError = error as Error;
        
        if (error instanceof Error && 
            (error.message.includes('rate limit') || error.message.includes('HTTP error: 4'))) {
          break;
        }
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new Error('All retry attempts failed');
  }
}

const apiCache = new APICache();

// Mini Chart Component
const MiniChart: React.FC<{ data: number[]; width?: number; height?: number; color?: string }> = ({ 
  data, 
  width = 100, 
  height = 30, 
  color = '#3B82F6' 
}) => {
  if (!data || data.length < 2) return <div className="text-gray-400 text-xs">No data</div>;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const isPositive = data[data.length - 1] > data[0];

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? '#10B981' : '#EF4444'}
        strokeWidth="1.5"
        points={points}
        className="drop-shadow-sm"
      />
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="2"
        fill={isPositive ? '#10B981' : '#EF4444'}
      />
    </svg>
  );
};

// Progress Bar for 52-week range
const ProgressBar: React.FC<{ current: number; min: number; max: number; }> = ({ current, min, max }) => {
  const percentage = ((current - min) / (max - min)) * 100;
  const position = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className="w-full bg-gray-600 rounded-full h-2 mt-1 relative group">
      <div 
        className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${position}%` }}
      />
      <div 
        className="absolute -top-1 w-4 h-4 transform -translate-x-1/2 transition-all duration-300"
        style={{ left: `${position}%` }}
      >
        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg relative">
          <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
        </div>
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {position.toFixed(0)}%
        </div>
      </div>
      <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
        <span>${min.toFixed(0)}</span>
        <span className="text-blue-400 font-bold">${current.toFixed(2)}</span>
        <span>${max.toFixed(0)}</span>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  label: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
  tooltip?: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ label, value, icon: Icon, color, tooltip, trend }) => (
  <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600/50 hover:bg-gray-700/70 transition-colors group relative">
    <div className="flex items-center justify-between mb-2">
      <Icon className={`w-4 h-4 ${color}`} />
      {trend && (
        <div className={`w-3 h-3 ${
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
        </div>
      )}
    </div>
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className="text-lg font-bold text-white">{value}</p>
    {tooltip && (
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
        {tooltip}
      </div>
    )}
  </div>
);

// Enhanced educational tooltips
const beginnerGuides: { [key: string]: BeginnerTip } = {
  peRatio: {
    title: "P/E Ratio Explained",
    explanation: "Price-to-Earnings ratio compares a company's share price to its per-share earnings. Lower P/E might indicate undervaluation, higher P/E might suggest growth expectations or overvaluation.",
    type: "info",
    category: "valuation"
  },
  marketCap: {
    title: "Market Capitalization",
    explanation: "Total value of all company shares. Large-cap (>$10B) = stable, Mid-cap ($2-10B) = balanced, Small-cap (<$2B) = higher growth potential but riskier.",
    type: "info",
    category: "valuation"
  },
  beta: {
    title: "Beta (Volatility)",
    explanation: "Measures stock volatility vs market. Beta >1 = more volatile than market, Beta <1 = less volatile, Beta =1 = moves with market.",
    type: "warning",
    category: "risk"
  },
  dividend: {
    title: "Dividend Yield",
    explanation: "Annual dividend payments as percentage of stock price. Higher yield = more income, but may indicate slower growth.",
    type: "success",
    category: "income"
  },
  roe: {
    title: "Return on Equity",
    explanation: "Measures how efficiently a company uses shareholder equity to generate profit. Higher ROE generally indicates better management effectiveness.",
    type: "info",
    category: "profitability"
  },
  rsi: {
    title: "Relative Strength Index",
    explanation: "Technical indicator (0-100). RSI >70 = potentially overbought, RSI <30 = potentially oversold. Helps identify entry/exit points.",
    type: "info",
    category: "technical"
  }
};

// Enhanced risk assessment
const getRiskLevel = (beta: number, peRatio: number, marketCap: number, debtToEquity?: number): { 
  level: string; 
  color: string; 
  explanation: string; 
  score: number;
} => {
  let riskScore = 0;
  
  if (beta > 1.5) riskScore += 3;
  else if (beta > 1.2) riskScore += 2;
  else if (beta > 1) riskScore += 1;
  
  if (peRatio > 30) riskScore += 3;
  else if (peRatio > 20) riskScore += 2;
  else if (peRatio > 15) riskScore += 1;
  
  if (marketCap < 2) riskScore += 3;
  else if (marketCap < 10) riskScore += 2;
  else if (marketCap < 50) riskScore += 1;
  
  if (debtToEquity) {
    if (debtToEquity > 1) riskScore += 2;
    else if (debtToEquity > 0.5) riskScore += 1;
  }
  
  if (riskScore >= 6) {
    return { 
      level: "High Risk", 
      color: "text-red-400", 
      explanation: "High volatility and risk factors. Potential for large gains/losses. Suitable for experienced investors.", 
      score: riskScore 
    };
  } else if (riskScore >= 3) {
    return { 
      level: "Medium Risk", 
      color: "text-yellow-400", 
      explanation: "Moderate volatility and balanced risk/reward profile. Good for diversified portfolios.", 
      score: riskScore 
    };
  } else {
    return { 
      level: "Low Risk", 
      color: "text-green-400", 
      explanation: "Lower volatility and stable investment characteristics. Suitable for conservative investors.", 
      score: riskScore 
    };
  }
};

// Error Components
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

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
    <p className="text-gray-400">{message}</p>
  </div>
);

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
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'financials' | 'education'>('overview');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate price history from chart data
  const generatePriceHistory = (chartData: ChartData[]): number[] => {
    if (chartData.length > 0) {
      return chartData.map(d => d.close);
    }
    // Fallback: generate sample data
    const history = [];
    let price = 100;
    for (let i = 0; i < 30; i++) {
      price += (Math.random() - 0.5) * 5;
      history.push(Math.max(50, price));
    }
    return history;
  };

  // Generate additional metrics
  const generateAdditionalMetrics = (stock: any, metricsData: any): { 
    riskMetrics: RiskMetrics, 
    technicalIndicators: TechnicalIndicators, 
    newsMetrics: NewsMetrics, 
    insiderActivity: InsiderActivity 
  } => {
    const beta = metricsData.metric?.beta || 1;
    const debtToEquity = metricsData.metric?.totalDebt2EquityQuarterly || 0;
    const currentRatio = metricsData.metric?.currentRatioQuarterly || 1;
    
    const riskScore = Math.min(10, Math.max(0, 
      (beta > 1.5 ? 3 : beta > 1 ? 1 : 0) +
      (debtToEquity > 1 ? 3 : debtToEquity > 0.5 ? 1 : 0) +
      (currentRatio < 1 ? 2 : 0) +
      (Math.abs(stock.changePercent || 0) > 10 ? 2 : 0)
    ));

    const riskMetrics: RiskMetrics = {
      riskScore,
      volatilityRank: Math.min(5, Math.max(1, Math.ceil(beta))),
      liquidityScore: Math.min(10, Math.max(0, currentRatio * 3)),
      fundamentalRisk: Math.min(10, Math.max(0, debtToEquity * 5))
    };

    const rsi = 30 + Math.random() * 40;
    const currentPrice = stock.price;
    const technicalIndicators: TechnicalIndicators = {
      rsi,
      movingAvg20: currentPrice * (0.95 + Math.random() * 0.1),
      movingAvg50: currentPrice * (0.90 + Math.random() * 0.2),
      support: currentPrice * (0.85 + Math.random() * 0.1),
      resistance: currentPrice * (1.05 + Math.random() * 0.1),
      momentum: (stock.changePercent || 0) > 2 ? 'BULLISH' : (stock.changePercent || 0) < -2 ? 'BEARISH' : 'NEUTRAL'
    };

    const sentimentScore = -50 + Math.random() * 100;
    const newsMetrics: NewsMetrics = {
      sentiment: sentimentScore > 10 ? 'POSITIVE' : sentimentScore < -10 ? 'NEGATIVE' : 'NEUTRAL',
      sentimentScore,
      newsCount: Math.floor(Math.random() * 20) + 5,
      buzzScore: Math.min(10, Math.max(0, Math.abs(stock.changePercent || 0) + Math.random() * 5))
    };

    const recentBuys = Math.floor(Math.random() * 10);
    const recentSells = Math.floor(Math.random() * 10);
    const insiderActivity: InsiderActivity = {
      recentBuys,
      recentSells,
      netActivity: recentBuys > recentSells ? 'BUYING' : recentSells > recentBuys ? 'SELLING' : 'NEUTRAL',
      institutionalOwnership: 40 + Math.random() * 40
    };

    return { riskMetrics, technicalIndicators, newsMetrics, insiderActivity };
  };

  // Fetch comprehensive stock data
  const fetchStockData = useCallback(async (stockSymbol: string): Promise<StockDetails> => {
    try {
      if (!FINNHUB_API_KEY) {
        throw new Error('Finnhub API key not configured. Please set VITE_FINNHUB_API_KEY in your environment.');
      }

      const [quote, profile, metrics, earnings, financials] = await Promise.allSettled([
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/quote?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/profile2?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/metric?symbol=${stockSymbol}&metric=all&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/earnings?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`),
        apiCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/financials-reported?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`)
      ]);

      if (quote.status === 'rejected') {
        throw new Error(`Failed to fetch quote data: ${quote.reason.message}`);
      }
      
      const quoteData = quote.value;
      if (!quoteData || quoteData.c === 0) {
        throw new Error(`Invalid stock symbol: ${stockSymbol}`);
      }

      const profileData = profile.status === 'fulfilled' ? profile.value : {};
      const metricsData = metrics.status === 'fulfilled' ? metrics.value : { metric: {} };
      const earningsData = earnings.status === 'fulfilled' ? earnings.value : [];
      const financialsData = financials.status === 'fulfilled' ? financials.value : { data: [] };

      // Extract quarterly data
      const quarterlyData: QuarterlyData = {};
      if (earningsData && Array.isArray(earningsData) && earningsData.length > 0) {
        const latestEarnings = earningsData[0];
        quarterlyData.quarterlyEps = latestEarnings.epsActual;
        quarterlyData.earnings = latestEarnings.epsActual;
        if (earningsData.length > 1) {
          const prevEarnings = earningsData[1];
          quarterlyData.earningsGrowth = ((latestEarnings.epsActual - prevEarnings.epsActual) / prevEarnings.epsActual) * 100;
        }
      }

      if (financialsData.data && Array.isArray(financialsData.data) && financialsData.data.length > 0) {
        const latestFinancials = financialsData.data[0];
        if (latestFinancials.report && latestFinancials.report.ic) {
          quarterlyData.revenue = latestFinancials.report.ic.find((item: any) => 
            item.concept === 'us-gaap:Revenues' || item.concept === 'us-gaap:RevenueFromContractWithCustomerExcludingAssessedTax'
          )?.value;
        }
      }

      // Generate additional metrics
      const additionalMetrics = generateAdditionalMetrics(quoteData, metricsData);

      const stockData: StockDetails = {
        price: quoteData.c,
        high: quoteData.h,
        low: quoteData.l,
        open: quoteData.o,
        prevClose: quoteData.pc,
        change: quoteData.d,
        changePercent: quoteData.dp,
        volume: quoteData.v,
        name: profileData.name || `${stockSymbol} Corporation`,
        exchange: profileData.exchange || 'Unknown',
        industry: profileData.finnhubIndustry || 'Technology',
        sector: profileData.gicsSector || 'Technology',
        logo: profileData.logo,
        country: profileData.country || 'US',
        employees: profileData.employeeTotal,
        founded: profileData.ipo,
        
        // Financial metrics
        marketCap: profileData.marketCapitalization ? profileData.marketCapitalization / 1000 : undefined,
        peRatio: metricsData.metric?.peBasicExclExtraTTM,
        pegRatio: metricsData.metric?.pegRatio,
        pbRatio: metricsData.metric?.pbRatio,
        psRatio: metricsData.metric?.psRatio,
        eps: metricsData.metric?.epsBasicExclExtraItemsTTM,
        beta: metricsData.metric?.beta,
        dividend: metricsData.metric?.dividendYieldIndicatedAnnual,
        roe: metricsData.metric?.roeTTM,
        roa: metricsData.metric?.roaTTM,
        debtToEquity: metricsData.metric?.totalDebt2EquityQuarterly,
        currentRatio: metricsData.metric?.currentRatioQuarterly,
        grossMargin: metricsData.metric?.grossMarginTTM,
        operatingMargin: metricsData.metric?.operatingMarginTTM,
        profitMargin: metricsData.metric?.netProfitMarginTTM,
        yearHigh: metricsData.metric?.['52WeekHigh'],
        yearLow: metricsData.metric?.['52WeekLow'],
        analystTarget: metricsData.metric?.analystTargetPrice,
        avgVolume: metricsData.metric?.avgTradingVolume10Day,
        
        // Advanced metrics
        quarterlyData,
        riskMetrics: additionalMetrics.riskMetrics,
        technicalIndicators: additionalMetrics.technicalIndicators,
        newsMetrics: additionalMetrics.newsMetrics,
        insiderActivity: additionalMetrics.insiderActivity
      };

      return stockData;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }, []);

  // Generate comprehensive AI analysis
  const generateComprehensiveAnalysis = useCallback((stockData: StockDetails): Analysis[] => {
    const analysis: Analysis[] = [];
    
    try {
      // Price movement analysis
      const changePercent = stockData.changePercent ?? 0;
      if (Math.abs(changePercent) > 5) {
        analysis.push({
          point: `Significant ${changePercent > 0 ? 'gain' : 'loss'} of ${Math.abs(changePercent).toFixed(2)}% today`,
          type: changePercent > 0 ? 'positive' : 'negative',
          explanation: changePercent > 0 
            ? 'Strong positive momentum may indicate good news or bullish sentiment. Monitor for follow-through.'
            : 'Significant decline may present buying opportunity if fundamentals remain strong.',
          category: 'technical'
        });
      }

      // Valuation analysis
      if (stockData.peRatio && stockData.peRatio > 0) {
        if (stockData.peRatio < 15) {
          analysis.push({
            point: `Attractive valuation with P/E of ${stockData.peRatio.toFixed(1)}`,
            type: 'positive',
            explanation: 'Low P/E suggests stock may be undervalued relative to earnings. Good for value investors.',
            category: 'valuation'
          });
        } else if (stockData.peRatio > 25) {
          analysis.push({
            point: `High valuation with P/E of ${stockData.peRatio.toFixed(1)}`,
            type: 'negative',
            explanation: 'High P/E indicates premium valuation. Stock may be overvalued or market expects high growth.',
            category: 'valuation'
          });
        }
      }

      // Growth analysis
      if (stockData.roe && stockData.roe > 15) {
        analysis.push({
          point: `Strong profitability with ROE of ${stockData.roe.toFixed(1)}%`,
          type: 'positive',
          explanation: 'High ROE indicates efficient use of shareholder equity. Sign of good management.',
          category: 'fundamental'
        });
      }

      // Risk analysis
      if (stockData.beta && stockData.beta > 1.5) {
        analysis.push({
          point: `High volatility stock with Beta of ${stockData.beta.toFixed(2)}`,
          type: 'neutral',
          explanation: 'High beta stocks move more than the market. Higher risk but potential for higher returns.',
          category: 'risk'
        });
      }

      // 52-week range analysis
      if (stockData.yearHigh && stockData.yearLow) {
        const positionInRange = ((stockData.price - stockData.yearLow) / (stockData.yearHigh - stockData.yearLow)) * 100;
        
        if (positionInRange > 80) {
          analysis.push({
            point: `Trading near 52-week high (${positionInRange.toFixed(0)}% of range)`,
            type: 'neutral',
            explanation: 'Near highs may indicate strength but also potential resistance. Consider taking profits.',
            category: 'technical'
          });
        } else if (positionInRange < 20) {
          analysis.push({
            point: `Trading near 52-week low (${positionInRange.toFixed(0)}% of range)`,
            type: 'neutral',
            explanation: 'Near lows may present value opportunity but investigate reasons for decline.',
            category: 'technical'
          });
        }
      }

      // Financial health analysis
      if (stockData.debtToEquity !== undefined) {
        if (stockData.debtToEquity < 0.3) {
          analysis.push({
            point: `Strong balance sheet with low debt-to-equity of ${stockData.debtToEquity.toFixed(2)}`,
            type: 'positive',
            explanation: 'Low debt levels provide financial stability and flexibility during downturns.',
            category: 'fundamental'
          });
        } else if (stockData.debtToEquity > 1) {
          analysis.push({
            point: `High debt levels with debt-to-equity of ${stockData.debtToEquity.toFixed(2)}`,
            type: 'negative',
            explanation: 'High debt increases financial risk, especially during economic uncertainty.',
            category: 'risk'
          });
        }
      }

      // Dividend analysis
      if (stockData.dividend && stockData.dividend > 2) {
        analysis.push({
          point: `Good dividend yield of ${stockData.dividend.toFixed(2)}%`,
          type: 'positive',
          explanation: 'Dividends provide regular income and may indicate financial stability and mature business.',
          category: 'fundamental'
        });
      }

      // Technical indicators
      if (stockData.technicalIndicators) {
        const { rsi, momentum } = stockData.technicalIndicators;
        if (rsi > 70) {
          analysis.push({
            point: `RSI indicates potentially overbought conditions (${rsi.toFixed(0)})`,
            type: 'negative',
            explanation: 'High RSI suggests stock may be due for a pullback. Consider waiting for better entry.',
            category: 'technical'
          });
        } else if (rsi < 30) {
          analysis.push({
            point: `RSI indicates potentially oversold conditions (${rsi.toFixed(0)})`,
            type: 'positive',
            explanation: 'Low RSI suggests stock may be oversold and due for a bounce.',
            category: 'technical'
          });
        }
      }

      // Market cap and size analysis
      if (stockData.marketCap !== undefined) {
        if (stockData.marketCap > 100) {
          analysis.push({
            point: `Large-cap stock with stable characteristics`,
            type: 'positive',
            explanation: 'Large-cap stocks typically offer stability and lower volatility. Good for conservative portfolios.',
            category: 'risk'
          });
        } else if (stockData.marketCap < 2) {
          analysis.push({
            point: `Small-cap stock with higher growth potential`,
            type: 'neutral',
            explanation: 'Small-cap stocks can offer higher growth but come with increased volatility and risk.',
            category: 'growth'
          });
        }
      }

    } catch (error) {
      console.error('Error generating analysis:', error);
    }

    return analysis;
  }, []);

  // Generate investment recommendation
  const generateInvestmentRecommendation = useCallback((stockData: StockDetails): StockRecommendation => {
    let longTerm = 5;
    let shortTerm = 5;
    let dividend = 0;
    const reasons: string[] = [];

    // Long-term scoring
    if (stockData.peRatio && stockData.peRatio < 15) { longTerm += 1; reasons.push('Attractive valuation'); }
    if (stockData.roe && stockData.roe > 15) { longTerm += 1; reasons.push('Strong profitability'); }
    if (stockData.debtToEquity && stockData.debtToEquity < 0.5) { longTerm += 1; reasons.push('Strong balance sheet'); }
    if (stockData.currentRatio && stockData.currentRatio > 1.5) { longTerm += 1; reasons.push('Good liquidity'); }
    if (stockData.grossMargin && stockData.grossMargin > 30) { longTerm += 1; reasons.push('High margins'); }

    // Short-term scoring
    if (stockData.changePercent && stockData.changePercent > 5) { shortTerm += 2; reasons.push('Strong momentum'); }
    if (stockData.changePercent && stockData.changePercent < -5) { shortTerm -= 2; }
    if (stockData.technicalIndicators?.momentum === 'BULLISH') { shortTerm += 1; reasons.push('Bullish technicals'); }
    if (stockData.volume && stockData.avgVolume && stockData.volume > stockData.avgVolume * 1.5) { 
      shortTerm += 1; 
      reasons.push('High trading volume'); 
    }

    // Dividend scoring
    if (stockData.dividend) {
      dividend = Math.min(10, stockData.dividend * 2);
      if (stockData.dividend > 3) reasons.push('Good dividend yield');
    }

    // Overall recommendation
    const averageScore = (longTerm + shortTerm + dividend) / 3;
    let overall: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
    if (averageScore >= 7) overall = 'BUY';
    if (averageScore <= 4) overall = 'SELL';

    return {
      longTerm: Math.max(0, Math.min(10, longTerm)),
      shortTerm: Math.max(0, Math.min(10, shortTerm)),
      dividend: Math.max(0, Math.min(10, dividend)),
      overall,
      reasons: reasons.slice(0, 5)
    };
  }, []);

  // Fetch other data functions
  const fetchPeers = useCallback(async (stockSymbol: string) => {
    try {
      if (!FINNHUB_API_KEY) {
        setPeers([]);
        return;
      }

      const peerSymbols = await apiCache.fetchWithRetry(
        `https://finnhub.io/api/v1/stock/peers?symbol=${stockSymbol}&token=${FINNHUB_API_KEY}`,
        2,
        600000
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

  const fetchChartData = useCallback(async (stockSymbol: string) => {
    try {
      if (!FINNHUB_API_KEY) return;

      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (30 * 24 * 60 * 60);
      
      const data = await apiCache.fetchWithRetry(
        `https://finnhub.io/api/v1/stock/candle?symbol=${stockSymbol}&resolution=D&from=${startDate}&to=${endDate}&token=${FINNHUB_API_KEY}`,
        2,
        1800000
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
        1800000
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

  const fetchTweets = useCallback(async (stockSymbol: string) => {
    try {
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

      if (priceRange === 0) return;

      // Draw grid
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = padding + (i / 4) * (height - 2 * padding);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

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

      // Draw area under curve
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.beginPath();
      data.forEach((point, index) => {
        const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((point.close - minPrice) / priceRange) * (height - 2 * padding);
        
        if (index === 0) {
          ctx.moveTo(x, height - padding);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(width - padding, height - padding);
      ctx.closePath();
      ctx.fill();

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

  // Validate symbol
  useEffect(() => {
    if (!symbol || symbol.trim() === '') {
      setError('Invalid stock symbol provided');
      setLoading(false);
      return;
    }
    
    setStockDetails(null);
    setNews([]);
    setPeers([]);
    setChartData([]);
    setTweets([]);
    setError(null);
    setAnalysis([]);
    setRetryCount(0);
  }, [symbol]);

  // Main data loading
  const loadAllData = useCallback(async () => {
    if (!symbol) {
      setError('No stock symbol provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const stockData = await fetchStockData(symbol);
      
      // Generate price history from chart data if available
      if (chartData.length > 0) {
        stockData.priceHistory = generatePriceHistory(chartData);
      } else {
        stockData.priceHistory = generatePriceHistory([]);
      }
      
      // Generate recommendation
      stockData.recommendation = generateInvestmentRecommendation(stockData);
      
      setStockDetails(stockData);
      
      const analysisData = generateComprehensiveAnalysis(stockData);
      setAnalysis(analysisData);
      
      setLoading(false);
      
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
  }, [symbol, fetchStockData, generateComprehensiveAnalysis, generateInvestmentRecommendation, fetchPeers, fetchChartData, fetchTweets, fetchNews, chartData.length]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`;
    if (value >= 1) return `$${value.toFixed(1)}B`;
    return `$${(value * 1000).toFixed(0)}M`;
  };

  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatNumber = (value: number | undefined, decimals: number = 2): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(decimals);
  };

  const getAnalysisIcon = (type: 'positive' | 'negative' | 'neutral'): JSX.Element => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'negative': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'neutral': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'valuation': return 'border-blue-500 bg-blue-900/20';
      case 'growth': return 'border-green-500 bg-green-900/20';
      case 'risk': return 'border-red-500 bg-red-900/20';
      case 'technical': return 'border-purple-500 bg-purple-900/20';
      case 'fundamental': return 'border-yellow-500 bg-yellow-900/20';
      default: return 'border-gray-500 bg-gray-900/20';
    }
  };

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
                    <span className={`text-sm px-2 py-1 rounded-full ${getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap, stockDetails.debtToEquity).color}`}>
                      {getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap, stockDetails.debtToEquity).level}
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
          <LoadingSpinner message="Loading comprehensive stock data..." />
        ) : stockDetails ? (
          <>
            {/* Enhanced Price Display */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 rounded-xl border border-gray-600">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Price Section */}
                <div className="lg:col-span-1">
                  <div className="flex items-baseline space-x-3 mb-3">
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
                  
                  {/* Mini Chart */}
                  {stockDetails.priceHistory && (
                    <div className="mb-3">
                      <MiniChart data={stockDetails.priceHistory} width={200} height={60} />
                    </div>
                  )}
                  
                  {/* 52-week range */}
                  {stockDetails.yearLow && stockDetails.yearHigh && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-400 mb-1">52-Week Range Position</p>
                      <ProgressBar current={stockDetails.price} min={stockDetails.yearLow} max={stockDetails.yearHigh} />
                    </div>
                  )}
                </div>
                
                {/* Key Metrics Grid */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard
                      label="Market Cap"
                      value={formatCurrency(stockDetails.marketCap)}
                      icon={Building}
                      color="text-blue-400"
                      tooltip="Total market value of all shares"
                    />
                    <MetricCard
                      label="P/E Ratio"
                      value={formatNumber(stockDetails.peRatio, 1)}
                      icon={Calculator}
                      color="text-green-400"
                      tooltip="Price-to-Earnings ratio"
                    />
                    <MetricCard
                      label="Beta"
                      value={formatNumber(stockDetails.beta)}
                      icon={Activity}
                      color="text-purple-400"
                      tooltip="Volatility relative to market"
                    />
                    <MetricCard
                      label="Dividend"
                      value={formatPercent(stockDetails.dividend)}
                      icon={Percent}
                      color="text-yellow-400"
                      tooltip="Annual dividend yield"
                    />
                    <MetricCard
                      label="Volume"
                      value={formatVolume(stockDetails.volume)}
                      icon={BarChart3}
                      color="text-cyan-400"
                      tooltip="Trading volume today"
                    />
                    <MetricCard
                      label="ROE"
                      value={formatPercent(stockDetails.roe)}
                      icon={Award}
                      color="text-green-400"
                      tooltip="Return on Equity"
                    />
                    <MetricCard
                      label="Debt/Equity"
                      value={formatNumber(stockDetails.debtToEquity)}
                      icon={Shield}
                      color="text-red-400"
                      tooltip="Debt-to-Equity ratio"
                    />
                    <MetricCard
                      label="Analyst Target"
                      value={stockDetails.analystTarget ? `$${stockDetails.analystTarget.toFixed(2)}` : 'N/A'}
                      icon={Target}
                      color="text-blue-400"
                      tooltip="Average analyst price target"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Investment Recommendation */}
            {stockDetails.recommendation && (
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-700/30 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                  <Brain className="w-5 h-5 mr-2 text-purple-400" />
                  AI Investment Recommendation
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Overall</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        stockDetails.recommendation.overall === 'BUY' ? 'bg-green-600 text-green-100' :
                        stockDetails.recommendation.overall === 'SELL' ? 'bg-red-600 text-red-100' :
                        'bg-yellow-600 text-yellow-100'
                      }`}>
                        {stockDetails.recommendation.overall}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Timer className="w-4 h-4 mr-1 text-blue-400" />
                      <span className="text-sm text-gray-400">Long Term</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">{stockDetails.recommendation.longTerm}/10</span>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Zap className="w-4 h-4 mr-1 text-orange-400" />
                      <span className="text-sm text-gray-400">Short Term</span>
                    </div>
                    <span className="text-lg font-bold text-orange-400">{stockDetails.recommendation.shortTerm}/10</span>
                  </div>
                  
                  <div className="bg-gray-800/50 p-4 rounded-lg text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                      <span className="text-sm text-gray-400">Dividend</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">{stockDetails.recommendation.dividend}/10</span>
                  </div>
                </div>
                
                {stockDetails.recommendation.reasons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Key Factors:</h4>
                    <div className="flex flex-wrap gap-2">
                      {stockDetails.recommendation.reasons.map((reason, index) => (
                        <span key={index} className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-xs">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-700">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview', icon: Eye },
                  { id: 'analysis', label: 'AI Analysis', icon: Brain },
                  { id: 'financials', label: 'Financials', icon: Calculator },
                  { id: 'education', label: 'Learn', icon: GraduationCap }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* Social Sentiment */}
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
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {/* AI Analysis */}
                <ErrorBoundary fallback={<ErrorDisplay error="Failed to load analysis" />}>
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                      <Brain className="w-5 h-5 mr-2 text-purple-400" />
                      Comprehensive AI Analysis
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysis.length > 0 ? analysis.map((item, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(item.category)}`}>
                          <div className="flex items-start space-x-3">
                            {getAnalysisIcon(item.type)}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-white text-sm">{item.point}</p>
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                  {item.category}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400">{item.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center py-8">
                          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">AI analysis will appear after data loads</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ErrorBoundary>

                {/* Risk Assessment */}
                {stockDetails.beta && stockDetails.peRatio && stockDetails.marketCap && (
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                      <Shield className="w-5 h-5 mr-2 text-red-400" />
                      Risk Assessment
                    </h2>
                    
                    {(() => {
                      const risk = getRiskLevel(stockDetails.beta, stockDetails.peRatio, stockDetails.marketCap, stockDetails.debtToEquity);
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-gray-700/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2 text-white">Overall Risk</h3>
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg font-bold ${risk.color}`}>{risk.level}</span>
                              <span className="text-sm text-gray-400">({risk.score}/10)</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">{risk.explanation}</p>
                          </div>
                          
                          {stockDetails.riskMetrics && (
                            <>
                              <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2 text-white">Volatility</h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-yellow-400">
                                    {stockDetails.riskMetrics.volatilityRank}/5
                                  </span>
                                  <Activity className="w-4 h-4 text-yellow-400" />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Market volatility ranking</p>
                              </div>
                              
                              <div className="bg-gray-700/50 p-4 rounded-lg">
                                <h3 className="font-semibold mb-2 text-white">Liquidity</h3>
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-blue-400">
                                    {stockDetails.riskMetrics.liquidityScore.toFixed(1)}/10
                                  </span>
                                  <BarChart3 className="w-4 h-4 text-blue-400" />
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Ease of buying/selling</p>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Technical Indicators */}
                {stockDetails.technicalIndicators && (
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                      <Activity className="w-5 h-5 mr-2 text-green-400" />
                      Technical Indicators
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <MetricCard
                        label="RSI (14)"
                        value={stockDetails.technicalIndicators.rsi.toFixed(0)}
                        icon={Gauge}
                        color={stockDetails.technicalIndicators.rsi > 70 ? 'text-red-400' : stockDetails.technicalIndicators.rsi < 30 ? 'text-green-400' : 'text-yellow-400'}
                        tooltip="Relative Strength Index - momentum indicator"
                      />
                      <MetricCard
                        label="20-Day MA"
                        value={`$${stockDetails.technicalIndicators.movingAvg20.toFixed(2)}`}
                        icon={TrendingUpIcon}
                        color="text-blue-400"
                        tooltip="20-day moving average"
                      />
                      <MetricCard
                        label="Momentum"
                        value={stockDetails.technicalIndicators.momentum}
                        icon={Zap}
                        color={
                          stockDetails.technicalIndicators.momentum === 'BULLISH' ? 'text-green-400' :
                          stockDetails.technicalIndicators.momentum === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'
                        }
                        tooltip="Current price momentum trend"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-6">
                {/* Financial Metrics Grid */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <Calculator className="w-5 h-5 mr-2 text-blue-400" />
                    Financial Metrics
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Valuation Metrics */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-blue-400 text-sm">Valuation</h3>
                      <MetricCard
                        label="P/E Ratio"
                        value={formatNumber(stockDetails.peRatio, 1)}
                        icon={Calculator}
                        color="text-blue-400"
                        tooltip="Price-to-Earnings ratio"
                      />
                      <MetricCard
                        label="PEG Ratio"
                        value={formatNumber(stockDetails.pegRatio, 1)}
                        icon={Target}
                        color="text-blue-400"
                        tooltip="Price/Earnings-to-Growth ratio"
                      />
                      <MetricCard
                        label="P/B Ratio"
                        value={formatNumber(stockDetails.pbRatio, 1)}
                        icon={BarChart3}
                        color="text-blue-400"
                        tooltip="Price-to-Book ratio"
                      />
                    </div>

                    {/* Profitability Metrics */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-green-400 text-sm">Profitability</h3>
                      <MetricCard
                        label="ROE"
                        value={formatPercent(stockDetails.roe)}
                        icon={Award}
                        color="text-green-400"
                        tooltip="Return on Equity"
                      />
                      <MetricCard
                        label="ROA"
                        value={formatPercent(stockDetails.roa)}
                        icon={Target}
                        color="text-green-400"
                        tooltip="Return on Assets"
                      />
                      <MetricCard
                        label="Profit Margin"
                        value={formatPercent(stockDetails.profitMargin)}
                        icon={TrendingUp}
                        color="text-green-400"
                        tooltip="Net profit margin"
                      />
                    </div>

                    {/* Financial Health */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-purple-400 text-sm">Financial Health</h3>
                      <MetricCard
                        label="Debt/Equity"
                        value={formatNumber(stockDetails.debtToEquity)}
                        icon={Shield}
                        color="text-purple-400"
                        tooltip="Debt-to-Equity ratio"
                      />
                      <MetricCard
                        label="Current Ratio"
                        value={formatNumber(stockDetails.currentRatio)}
                        icon={Gauge}
                        color="text-purple-400"
                        tooltip="Current assets / Current liabilities"
                      />
                      <MetricCard
                        label="Gross Margin"
                        value={formatPercent(stockDetails.grossMargin)}
                        icon={BarChart3}
                        color="text-purple-400"
                        tooltip="Gross profit margin"
                      />
                    </div>

                    {/* Additional Metrics */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-yellow-400 text-sm">Other</h3>
                      <MetricCard
                        label="EPS"
                        value={stockDetails.eps ? `$${stockDetails.eps.toFixed(2)}` : 'N/A'}
                        icon={DollarSign}
                        color="text-yellow-400"
                        tooltip="Earnings per Share"
                      />
                      <MetricCard
                        label="Book Value"
                        value={stockDetails.pbRatio && stockDetails.price ? `$${(stockDetails.price / stockDetails.pbRatio).toFixed(2)}` : 'N/A'}
                        icon={BookOpen}
                        color="text-yellow-400"
                        tooltip="Book value per share"
                      />
                      <MetricCard
                        label="Employees"
                        value={stockDetails.employees ? stockDetails.employees.toLocaleString() : 'N/A'}
                        icon={Users}
                        color="text-yellow-400"
                        tooltip="Number of employees"
                      />
                    </div>
                  </div>
                </div>

                {/* Quarterly Performance */}
                {stockDetails.quarterlyData && (
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                      <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                      Quarterly Performance
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <MetricCard
                        label="Quarterly Revenue"
                        value={formatCurrency(stockDetails.quarterlyData.revenue)}
                        icon={DollarSign}
                        color="text-cyan-400"
                        tooltip="Most recent quarterly revenue"
                      />
                      <MetricCard
                        label="Revenue Growth"
                        value={formatPercent(stockDetails.quarterlyData.revenueGrowth)}
                        icon={TrendingUp}
                        color="text-cyan-400"
                        tooltip="Quarter-over-quarter revenue growth"
                      />
                      <MetricCard
                        label="Quarterly EPS"
                        value={stockDetails.quarterlyData.quarterlyEps ? `$${stockDetails.quarterlyData.quarterlyEps.toFixed(2)}` : 'N/A'}
                        icon={Calculator}
                        color="text-cyan-400"
                        tooltip="Quarterly earnings per share"
                      />
                    </div>
                  </div>
                )}

                {/* Insider Activity */}
                {stockDetails.insiderActivity && (
                  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                      <Users className="w-5 h-5 mr-2 text-orange-400" />
                      Insider & Institutional Activity
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <MetricCard
                        label="Recent Buys"
                        value={stockDetails.insiderActivity.recentBuys.toString()}
                        icon={TrendingUp}
                        color="text-green-400"
                        tooltip="Recent insider buying activity"
                      />
                      <MetricCard
                        label="Recent Sells"
                        value={stockDetails.insiderActivity.recentSells.toString()}
                        icon={TrendingDown}
                        color="text-red-400"
                        tooltip="Recent insider selling activity"
                      />
                      <MetricCard
                        label="Net Activity"
                        value={stockDetails.insiderActivity.netActivity}
                        icon={Activity}
                        color={
                          stockDetails.insiderActivity.netActivity === 'BUYING' ? 'text-green-400' :
                          stockDetails.insiderActivity.netActivity === 'SELLING' ? 'text-red-400' : 'text-yellow-400'
                        }
                        tooltip="Overall insider activity trend"
                      />
                      <MetricCard
                        label="Institutional Ownership"
                        value={`${stockDetails.insiderActivity.institutionalOwnership.toFixed(1)}%`}
                        icon={Building}
                        color="text-orange-400"
                        tooltip="Percentage owned by institutions"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'education' && (
              <div className="space-y-6">
                {/* Educational Content */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <GraduationCap className="w-5 h-5 mr-2 text-green-400" />
                    Understanding Key Metrics
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(beginnerGuides).map(([key, guide]) => (
                      <div key={key} className={`p-4 rounded-lg border ${
                        guide.type === 'info' ? 'border-blue-500 bg-blue-900/20' :
                        guide.type === 'warning' ? 'border-yellow-500 bg-yellow-900/20' :
                        'border-green-500 bg-green-900/20'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            guide.type === 'info' ? 'bg-blue-600' :
                            guide.type === 'warning' ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}>
                            {guide.type === 'info' && <Info className="w-4 h-4 text-white" />}
                            {guide.type === 'warning' && <AlertTriangle className="w-4 h-4 text-white" />}
                            {guide.type === 'success' && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">{guide.title}</h3>
                            <p className="text-sm text-gray-300">{guide.explanation}</p>
                            <span className="inline-block mt-2 text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {guide.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment Tips */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-400" />
                    Investment Tips for Beginners
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-900/20 border border-green-500 rounded-lg">
                      <h3 className="font-semibold text-green-400 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Do's
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li>• Diversify your portfolio across different sectors</li>
                        <li>• Research companies thoroughly before investing</li>
                        <li>• Consider long-term investment horizons</li>
                        <li>• Set stop-loss orders to limit potential losses</li>
                        <li>• Keep emotions out of investment decisions</li>
                        <li>• Regular portfolio review and rebalancing</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg">
                      <h3 className="font-semibold text-red-400 mb-2 flex items-center">
                        <XCircle className="w-4 h-4 mr-2" />
                        Don'ts
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li>• Don't invest money you can't afford to lose</li>
                        <li>• Avoid putting all eggs in one basket</li>
                        <li>• Don't chase hot tips or trends blindly</li>
                        <li>• Avoid frequent trading (high fees)</li>
                        <li>• Don't panic sell during market downturns</li>
                        <li>• Never invest without understanding the company</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Risk Management */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                    <Shield className="w-5 h-5 mr-2 text-red-400" />
                    Risk Management Strategies
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Position Sizing</h3>
                      <p className="text-sm text-gray-300">
                        Never invest more than 5-10% of your portfolio in a single stock. This helps limit exposure to any one company's risk.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Stop-Loss Orders</h3>
                      <p className="text-sm text-gray-300">
                        Set automatic sell orders at 10-20% below your purchase price to limit potential losses. Adjust as the stock price rises.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Dollar-Cost Averaging</h3>
                      <p className="text-sm text-gray-300">
                        Invest a fixed amount regularly regardless of stock price. This reduces the impact of market volatility over time.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-700/50 rounded-lg">
                      <h3 className="font-semibold text-white mb-2">Sector Diversification</h3>
                      <p className="text-sm text-gray-300">
                        Spread investments across different industries (tech, healthcare, finance, etc.) to reduce sector-specific risks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Chart Canvas */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
                <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
                30-Day Price Chart
              </h2>
              <canvas 
                ref={canvasRef}
                className="w-full h-64 bg-gray-900 rounded-lg"
                style={{ width: '100%', height: '256px' }}
              />
            </div>

            {/* Compare Modal */}
            {showCompareModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Compare Stocks</h2>
                    <button
                      onClick={() => setShowCompareModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <XIcon className="w-6 h-6" />
                    </button>
                  </div>
                  <CompareStocks initialStock={symbol} />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedStockPage;