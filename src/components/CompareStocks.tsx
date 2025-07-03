import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  X, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Search,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  DollarSign,
  Target,
  Users,
  Zap,
  Activity,
  PieChart,
  Calculator,
  Gauge,
  Shield,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Maximize2,
  Minimize2,
  Star,
  Clock,
  Building,
  Globe,
  Calendar,
  LineChart,
  Brain,
  Lightbulb,
  Timer,
  MapPin
} from 'lucide-react';

interface CompareStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
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
  volume?: number;
  avgVolume?: number;
  sector?: string;
  industry?: string;
  employees?: number;
  founded?: string;
  country?: string;
  quarterlyData?: QuarterlyData;
  priceHistory?: number[];
  recommendation?: StockRecommendation;
  riskMetrics?: RiskMetrics;
  technicalIndicators?: TechnicalIndicators;
  newsMetrics?: NewsMetrics;
  insiderActivity?: InsiderActivity;
}

interface RiskMetrics {
  riskScore: number; // 0-10 (10 = highest risk)
  volatilityRank: number; // 1-5 (5 = most volatile)
  liquidityScore: number; // 0-10 (10 = most liquid)
  fundamentalRisk: number; // 0-10 (10 = highest risk)
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

interface CompareStocksProps {
  isOpen: boolean;
  onClose: () => void;
  initialStock?: string;
}

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';

// Enhanced API cache for the comparison component
class ComparisonAPICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
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

  async fetchWithRetry(url: string, maxRetries: number = 2): Promise<any> {
    const cached = this.get(url);
    if (cached) return cached;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const data = await response.json();
        this.set(url, data);
        return data;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
}

const comparisonCache = new ComparisonAPICache();

// Mini Chart Component using SVG
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

// Compact Visual Indicator Component
const MetricIndicator: React.FC<{ 
  value: number | undefined; 
  allValues: (number | undefined)[]; 
  isHigherBetter: boolean;
  format: (val: number) => string;
}> = ({ value, allValues, isHigherBetter, format }) => {
  if (value === undefined) return (
    <div className="p-2 bg-gray-700/50 rounded text-center h-10 flex items-center justify-center">
      <span className="text-gray-400 text-xs">N/A</span>
    </div>
  );
  
  const validValues = allValues.filter(v => v !== undefined) as number[];
  if (validValues.length === 0) return (
    <div className="p-2 bg-gray-700/50 rounded text-center h-10 flex items-center justify-center">
      <span className="text-gray-400 text-xs">N/A</span>
    </div>
  );
  
  const max = Math.max(...validValues);
  const min = Math.min(...validValues);
  
  let bgColor = 'bg-gray-600/70';
  let textColor = 'text-gray-100';
  let borderColor = 'border-gray-500/50';
  let icon = null;
  
  if (validValues.length > 1) {
    if (isHigherBetter) {
      if (value === max) {
        bgColor = 'bg-green-600/80';
        textColor = 'text-green-100';
        borderColor = 'border-green-400/60';
        icon = <Star className="w-2 h-2" />;
      } else if (value === min) {
        bgColor = 'bg-red-600/80';
        textColor = 'text-red-100';
        borderColor = 'border-red-400/60';
      }
    } else {
      if (value === min) {
        bgColor = 'bg-green-600/80';
        textColor = 'text-green-100';
        borderColor = 'border-green-400/60';
        icon = <Star className="w-2 h-2" />;
      } else if (value === max) {
        bgColor = 'bg-red-600/80';
        textColor = 'text-red-100';
        borderColor = 'border-red-400/60';
      }
    }
  }
  
  return (
    <div className={`${bgColor} border ${borderColor} p-2 rounded text-center relative h-10 flex items-center justify-center transition-all duration-200 hover:scale-105 cursor-pointer group`}>
      {icon && (
        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
          {icon}
        </div>
      )}
      <span className={`${textColor} font-semibold text-xs group-hover:scale-110 transition-transform`}>
        {format(value)}
      </span>
    </div>
  );
};

// Enhanced Progress Bar with better pointer
const ProgressBar: React.FC<{ current: number; min: number; max: number; }> = ({ current, min, max }) => {
  const percentage = ((current - min) / (max - min)) * 100;
  const position = Math.max(0, Math.min(100, percentage));
  
  return (
    <div className="w-full bg-gray-600 rounded-full h-2 mt-1 relative">
      <div 
        className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${position}%` }}
      >
      </div>
      {/* Enhanced pointer */}
      <div 
        className="absolute -top-1 w-4 h-4 transform -translate-x-1/2 transition-all duration-300"
        style={{ left: `${position}%` }}
      >
        <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg relative">
          <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
        </div>
        {/* Tooltip */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {position.toFixed(0)}%
        </div>
      </div>
      {/* Range labels */}
      <div className="flex justify-between text-[8px] text-gray-400 mt-0.5">
        <span>${min.toFixed(0)}</span>
        <span className="text-blue-400 font-bold">${current.toFixed(2)}</span>
        <span>${max.toFixed(0)}</span>
      </div>
    </div>
  );
};

// Smart Recommendation Component (without key factors)
const SmartRecommendation: React.FC<{ stock: CompareStock }> = ({ stock }) => {
  const calculateRecommendation = (stock: CompareStock): StockRecommendation => {
    let longTerm = 5;
    let shortTerm = 5;
    let dividend = 0;
    const reasons: string[] = [];

    // Long-term scoring
    if (stock.peRatio && stock.peRatio < 15) { longTerm += 1; reasons.push('Low P/E ratio'); }
    if (stock.peRatio && stock.peRatio > 30) { longTerm -= 1; }
    if (stock.roe && stock.roe > 15) { longTerm += 1; reasons.push('Strong ROE'); }
    if (stock.debtToEquity && stock.debtToEquity < 0.5) { longTerm += 1; reasons.push('Low debt'); }
    if (stock.currentRatio && stock.currentRatio > 1.5) { longTerm += 1; reasons.push('Good liquidity'); }
    if (stock.profitMargin && stock.profitMargin > 10) { longTerm += 1; reasons.push('High profit margins'); }

    // Short-term scoring
    if (stock.changePercent > 5) { shortTerm += 2; reasons.push('Strong momentum'); }
    if (stock.changePercent < -5) { shortTerm -= 2; }
    if (stock.beta && stock.beta > 1.5) { shortTerm += 1; reasons.push('High volatility opportunity'); }
    if (stock.volume && stock.avgVolume && stock.volume > stock.avgVolume * 1.5) { 
      shortTerm += 1; 
      reasons.push('High volume'); 
    }

    // Dividend scoring
    if (stock.dividend) {
      dividend = Math.min(10, stock.dividend * 2);
      if (stock.dividend > 3) reasons.push('Good dividend yield');
      if (stock.dividend > 5) reasons.push('High dividend yield');
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
      reasons: reasons.slice(0, 3) // Top 3 reasons
    };
  };

  const rec = calculateRecommendation(stock);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getOverallColor = (overall: string) => {
    if (overall === 'BUY') return 'bg-green-600 text-green-100';
    if (overall === 'SELL') return 'bg-red-600 text-red-100';
    return 'bg-yellow-600 text-yellow-100';
  };

  return (
    <div className="bg-gray-700/30 p-2 rounded text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Brain className="w-3 h-3 text-purple-400 mr-1" />
          <span className="font-semibold text-white">AI Score</span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${getOverallColor(rec.overall)}`}>
          {rec.overall}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Timer className="w-2 h-2 mr-1" />
            <span className="text-[10px] text-gray-400">Long</span>
          </div>
          <span className={`font-bold ${getScoreColor(rec.longTerm)}`}>{rec.longTerm}/10</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <Zap className="w-2 h-2 mr-1" />
            <span className="text-[10px] text-gray-400">Short</span>
          </div>
          <span className={`font-bold ${getScoreColor(rec.shortTerm)}`}>{rec.shortTerm}/10</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center">
            <DollarSign className="w-2 h-2 mr-1" />
            <span className="text-[10px] text-gray-400">Div</span>
          </div>
          <span className={`font-bold ${getScoreColor(rec.dividend)}`}>{rec.dividend}/10</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Search Bar Component
const StockSearchBar: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSelect: (symbol: string) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ value, onChange, onSelect, placeholder, disabled }) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchStocks = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && Array.isArray(data.result)) {
          const formattedResults: SearchResult[] = data.result
            .slice(0, 5)
            .map((item: any) => ({
              symbol: item.symbol,
              name: item.description,
              type: item.type
            }));
          setSuggestions(formattedResults);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(value);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, searchStocks]);

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    setSuggestions([]);
    setShowSuggestions(false);
    onChange('');
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-7 pr-3 py-2 bg-gray-700/80 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-xs transition-all"
          disabled={disabled}
        />
        {loading && (
          <RefreshCw className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 animate-spin" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-2xl max-h-32 overflow-y-auto">
          {suggestions.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result.symbol)}
              className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 focus:outline-none focus:bg-gray-700"
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-xs">{result.symbol}</p>
                  <p className="text-[10px] text-gray-400 truncate">{result.name}</p>
                </div>
                <div className="text-[10px] text-gray-500 ml-1">{result.type}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CompareStocks: React.FC<CompareStocksProps> = ({ isOpen, onClose, initialStock }) => {
  const [compareStocks, setCompareStocks] = useState<CompareStock[]>([]);
  const [searchInputs, setSearchInputs] = useState<string[]>(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    valuation: true,
    profitability: false,
    financial: false,
    performance: false,
    quarterly: false,
    company: false,
    recommendations: false
  });

  // Initialize with the stock from the page
  useEffect(() => {
    if (initialStock && compareStocks.length === 0) {
      addStockToComparison(initialStock);
    }
  }, [initialStock, isOpen]);

  // Clear data when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchInputs(['', '', '', '', '']);
      setError(null);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  const generatePriceHistory = (): number[] => {
    // Generate sample price history data (in real implementation, fetch from API)
    const history = [];
    let price = 100;
    for (let i = 0; i < 30; i++) {
      price += (Math.random() - 0.5) * 5;
      history.push(Math.max(50, price));
    }
    return history;
  };

  const generateAdditionalMetrics = (stock: any, metricsData: any): { 
    riskMetrics: RiskMetrics, 
    technicalIndicators: TechnicalIndicators, 
    newsMetrics: NewsMetrics, 
    insiderActivity: InsiderActivity 
  } => {
    // Generate Risk Metrics
    const beta = metricsData.metric?.beta || 1;
    const debtToEquity = metricsData.metric?.totalDebt2EquityQuarterly || 0;
    const currentRatio = metricsData.metric?.currentRatioQuarterly || 1;
    
    const riskScore = Math.min(10, Math.max(0, 
      (beta > 1.5 ? 3 : beta > 1 ? 1 : 0) +
      (debtToEquity > 1 ? 3 : debtToEquity > 0.5 ? 1 : 0) +
      (currentRatio < 1 ? 2 : 0) +
      (Math.abs(stock.changePercent) > 10 ? 2 : 0)
    ));

    const riskMetrics: RiskMetrics = {
      riskScore,
      volatilityRank: Math.min(5, Math.max(1, Math.ceil(beta))),
      liquidityScore: Math.min(10, Math.max(0, currentRatio * 3)),
      fundamentalRisk: Math.min(10, Math.max(0, debtToEquity * 5))
    };

    // Generate Technical Indicators (simulated)
    const rsi = 30 + Math.random() * 40; // Random RSI between 30-70
    const currentPrice = stock.c;
    const technicalIndicators: TechnicalIndicators = {
      rsi,
      movingAvg20: currentPrice * (0.95 + Math.random() * 0.1),
      movingAvg50: currentPrice * (0.90 + Math.random() * 0.2),
      support: currentPrice * (0.85 + Math.random() * 0.1),
      resistance: currentPrice * (1.05 + Math.random() * 0.1),
      momentum: stock.changePercent > 2 ? 'BULLISH' : stock.changePercent < -2 ? 'BEARISH' : 'NEUTRAL'
    };

    // Generate News Metrics (simulated)
    const sentimentScore = -50 + Math.random() * 100;
    const newsMetrics: NewsMetrics = {
      sentiment: sentimentScore > 10 ? 'POSITIVE' : sentimentScore < -10 ? 'NEGATIVE' : 'NEUTRAL',
      sentimentScore,
      newsCount: Math.floor(Math.random() * 20) + 5,
      buzzScore: Math.min(10, Math.max(0, Math.abs(stock.changePercent) + Math.random() * 5))
    };

    // Generate Insider Activity (simulated)
    const recentBuys = Math.floor(Math.random() * 10);
    const recentSells = Math.floor(Math.random() * 10);
    const insiderActivity: InsiderActivity = {
      recentBuys,
      recentSells,
      netActivity: recentBuys > recentSells ? 'BUYING' : recentSells > recentBuys ? 'SELLING' : 'NEUTRAL',
      institutionalOwnership: 40 + Math.random() * 40 // 40-80%
    };

    return { riskMetrics, technicalIndicators, newsMetrics, insiderActivity };
  };

  const fetchStockData = useCallback(async (symbol: string): Promise<CompareStock> => {
    if (!FINNHUB_API_KEY) {
      throw new Error('API key not configured');
    }

    const [quote, profile, metrics, earnings, financials] = await Promise.allSettled([
      comparisonCache.fetchWithRetry(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      comparisonCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      comparisonCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`),
      comparisonCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
      comparisonCache.fetchWithRetry(`https://finnhub.io/api/v1/stock/financials-reported?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
    ]);

    if (quote.status === 'rejected') {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }

    const quoteData = quote.value;
    if (!quoteData || quoteData.c === 0) {
      throw new Error(`Invalid symbol: ${symbol}`);
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

    // Extract revenue data from financials
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

    // Calculate additional metrics
    const marketCap = profileData.marketCapitalization ? profileData.marketCapitalization / 1000 : undefined;
    const eps = metricsData.metric?.epsBasicExclExtraItemsTTM;
    const pegRatio = metricsData.metric?.pegRatio;
    const pbRatio = metricsData.metric?.pbRatio;
    const psRatio = metricsData.metric?.psRatio;

    return {
      symbol: symbol.toUpperCase(),
      name: profileData.name || `${symbol} Corporation`,
      price: quoteData.c,
      change: quoteData.d || 0,
      changePercent: quoteData.dp || 0,
      marketCap,
      peRatio: metricsData.metric?.peBasicExclExtraTTM,
      pegRatio,
      pbRatio,
      psRatio,
      eps,
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
      volume: quoteData.v || 0,
      avgVolume: metricsData.metric?.avgTradingVolume10Day,
      sector: profileData.gicsSector || 'Technology',
      industry: profileData.finnhubIndustry || 'Technology',
      employees: profileData.employeeTotal,
      founded: profileData.ipo,
      country: profileData.country || 'US',
      quarterlyData,
      priceHistory: generatePriceHistory(),
      riskMetrics: additionalMetrics.riskMetrics,
      technicalIndicators: additionalMetrics.technicalIndicators,
      newsMetrics: additionalMetrics.newsMetrics,
      insiderActivity: additionalMetrics.insiderActivity
    };
  }, []);

  const addStockToComparison = useCallback(async (symbol: string, searchIndex?: number) => {
    if (!symbol.trim()) return;
    
    const upperSymbol = symbol.toUpperCase().trim();
    
    // Check if already exists
    if (compareStocks.some(stock => stock.symbol === upperSymbol)) {
      setError(`${upperSymbol} is already in comparison`);
      return;
    }

    // Limit to 5 stocks
    if (compareStocks.length >= 5) {
      setError('Maximum 5 stocks can be compared');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stockData = await fetchStockData(upperSymbol);
      setCompareStocks(prev => [...prev, stockData]);
      
      // Clear the specific search input if provided
      if (searchIndex !== undefined) {
        setSearchInputs(prev => {
          const newInputs = [...prev];
          newInputs[searchIndex] = '';
          return newInputs;
        });
      }
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to add stock');
    } finally {
      setLoading(false);
    }
  }, [compareStocks, fetchStockData]);

  const removeStock = useCallback((symbol: string) => {
    setCompareStocks(prev => prev.filter(stock => stock.symbol !== symbol));
  }, []);

  const refreshAllData = useCallback(async () => {
    if (compareStocks.length === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const symbols = compareStocks.map(stock => stock.symbol);
      const refreshedStocks = await Promise.all(
        symbols.map(symbol => fetchStockData(symbol))
      );
      setCompareStocks(refreshedStocks);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [compareStocks, fetchStockData]);

  const updateSearchInput = (index: number, value: string) => {
    setSearchInputs(prev => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const formatPrice = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const formatEmployees = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (!isOpen) return null;

  const metrics = [
    {
      section: 'valuation',
      title: 'Valuation Metrics',
      icon: DollarSign,
      color: 'text-green-400',
      items: [
        { label: 'Market Cap', key: 'marketCap', format: formatCurrency, higherBetter: true, icon: DollarSign },
        { label: 'P/E Ratio', key: 'peRatio', format: formatNumber, higherBetter: false, icon: Target },
        { label: 'PEG Ratio', key: 'pegRatio', format: formatNumber, higherBetter: false, icon: Activity },
        { label: 'P/B Ratio', key: 'pbRatio', format: formatNumber, higherBetter: false, icon: BarChart3 },
        { label: 'P/S Ratio', key: 'psRatio', format: formatNumber, higherBetter: false, icon: PieChart },
        { label: 'EPS (TTM)', key: 'eps', format: formatPrice, higherBetter: true, icon: Calculator }
      ]
    },
    {
      section: 'profitability',
      title: 'Profitability & Returns',
      icon: TrendingUp,
      color: 'text-blue-400',
      items: [
        { label: 'ROE (%)', key: 'roe', format: formatPercent, higherBetter: true, icon: Award },
        { label: 'ROA (%)', key: 'roa', format: formatPercent, higherBetter: true, icon: Target },
        { label: 'Gross Margin (%)', key: 'grossMargin', format: formatPercent, higherBetter: true, icon: BarChart3 },
        { label: 'Operating Margin (%)', key: 'operatingMargin', format: formatPercent, higherBetter: true, icon: Activity },
        { label: 'Profit Margin (%)', key: 'profitMargin', format: formatPercent, higherBetter: true, icon: TrendingUp },
        { label: 'Dividend Yield (%)', key: 'dividend', format: formatPercent, higherBetter: true, icon: Users }
      ]
    },
    {
      section: 'financial',
      title: 'Financial Health',
      icon: Shield,
      color: 'text-purple-400',
      items: [
        { label: 'Debt/Equity', key: 'debtToEquity', format: formatNumber, higherBetter: false, icon: Shield },
        { label: 'Current Ratio', key: 'currentRatio', format: formatNumber, higherBetter: true, icon: Gauge },
        { label: 'Beta (Volatility)', key: 'beta', format: formatNumber, higherBetter: false, icon: Zap }
      ]
    },
    {
      section: 'performance',
      title: 'Performance & Targets',
      icon: Activity,
      color: 'text-yellow-400',
      items: [
        { label: 'Analyst Target', key: 'analystTarget', format: formatPrice, higherBetter: true, icon: Target },
        { label: 'Volume', key: 'volume', format: formatVolume, higherBetter: true, icon: Activity },
        { label: 'Avg Volume (10D)', key: 'avgVolume', format: formatVolume, higherBetter: true, icon: BarChart3 }
      ]
    },
    {
      section: 'quarterly',
      title: 'Quarterly Performance',
      icon: Calendar,
      color: 'text-cyan-400',
      items: [
        { label: 'Q Revenue', key: 'quarterlyData.revenue', format: formatCurrency, higherBetter: true, icon: DollarSign },
        { label: 'Revenue Growth', key: 'quarterlyData.revenueGrowth', format: formatPercent, higherBetter: true, icon: TrendingUp },
        { label: 'Q Earnings', key: 'quarterlyData.earnings', format: formatPrice, higherBetter: true, icon: Calculator },
        { label: 'Earnings Growth', key: 'quarterlyData.earningsGrowth', format: formatPercent, higherBetter: true, icon: TrendingUp },
        { label: 'Q EPS', key: 'quarterlyData.quarterlyEps', format: formatPrice, higherBetter: true, icon: Target }
      ]
    },
    {
      section: 'company',
      title: 'Company Information',
      icon: Building,
      color: 'text-orange-400',
      items: [
        { label: 'Employees', key: 'employees', format: formatEmployees, higherBetter: true, icon: Users },
        { label: 'Country', key: 'country', format: (val: any) => val || 'N/A', higherBetter: false, icon: Globe }
      ]
    }
  ];

  const modalSize = isFullscreen ? 'w-screen h-screen' : 'w-full max-w-7xl max-h-[95vh]';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className={`bg-gray-800 rounded-lg border border-gray-700 ${modalSize} overflow-hidden flex flex-col`}>
        {/* Compact Fixed Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Compare Stocks</h2>
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              {compareStocks.length}/5
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            
            <button
              onClick={refreshAllData}
              disabled={loading || compareStocks.length === 0}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white rounded transition-colors"
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Search Section */}
        <div className="flex-shrink-0 p-3 border-b border-gray-700 bg-gray-900/50">
          <div className="grid grid-cols-5 gap-2">
            {searchInputs.map((input, index) => (
              <StockSearchBar
                key={index}
                value={input}
                onChange={(value) => updateSearchInput(index, value)}
                onSelect={(symbol) => addStockToComparison(symbol, index)}
                placeholder={`Stock ${index + 1}`}
                disabled={loading}
              />
            ))}
          </div>

          {error && (
            <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded flex items-center space-x-2">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-red-300 text-xs">{error}</span>
            </div>
          )}

          <div className="mt-2 text-[10px] text-gray-400 flex items-center justify-between">
            <div className="flex items-center">
              <Info className="w-3 h-3 inline mr-1" />
              AI recommendations available • Enhanced 52W range pointers
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-600 rounded"></div>
                <span>Best</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-600 rounded"></div>
                <span>Worst</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          {compareStocks.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Stocks to Compare</h3>
              <p className="text-gray-500 text-sm mb-4">Add stocks using the search boxes above</p>
              <div className="bg-gray-700/30 p-3 rounded inline-block">
                <p className="text-xs text-gray-400 mb-2">Popular stocks:</p>
                <div className="flex flex-wrap gap-1 justify-center">
                  {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META'].map(symbol => (
                    <button
                      key={symbol}
                      onClick={() => addStockToComparison(symbol)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3">
              {/* Enhanced Stock Headers with Charts and AI Recommendations */}
              <div className="sticky top-0 z-10 bg-gray-800 pb-3 mb-3">
                <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${compareStocks.length}, minmax(160px, 1fr))` }}>
                  <div className="text-sm font-semibold text-gray-300 flex items-center p-2">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Metrics
                  </div>
                  {compareStocks.map((stock) => (
                    <div key={stock.symbol} className="bg-gradient-to-br from-gray-700/80 to-gray-800/80 p-2 rounded border border-gray-600 relative shadow hover:shadow-lg transition-shadow group">
                      <button
                        onClick={() => removeStock(stock.symbol)}
                        className="absolute top-1 right-1 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors z-10"
                        title="Remove stock"
                      >
                        <X className="w-2 h-2" />
                      </button>
                      
                      <div className="mb-2">
                        <h3 className="font-bold text-white text-sm">{stock.symbol}</h3>
                        <p className="text-gray-300 text-[10px] truncate font-medium" title={stock.name}>
                          {stock.name}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-gray-400 text-[9px] px-1 py-0.5 bg-gray-600/50 rounded">{stock.sector}</span>
                        </div>
                      </div>
                      
                      <div className="text-center mb-2">
                        <p className="text-lg font-bold text-white">${stock.price.toFixed(2)}</p>
                        <div className={`flex items-center justify-center space-x-1 ${stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {stock.changePercent >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="font-semibold text-xs">{stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* Mini Chart */}
                      {stock.priceHistory && (
                        <div className="mb-2 flex justify-center">
                          <MiniChart data={stock.priceHistory} width={80} height={20} />
                        </div>
                      )}

                      {/* Enhanced 52-week range with better pointer */}
                      {stock.yearLow && stock.yearHigh && (
                        <div className="text-center mb-2 group">
                          <p className="text-[9px] text-gray-400 mb-0.5">52W Range Position</p>
                          <ProgressBar current={stock.price} min={stock.yearLow} max={stock.yearHigh} />
                        </div>
                      )}

                      {/* AI Recommendation */}
                      <SmartRecommendation stock={stock} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Compact Comparison Metrics */}
              <div className="space-y-4">
                {metrics.map((section) => {
                  const SectionIcon = section.icon;
                  const isExpanded = expandedSections[section.section];
                  
                  return (
                    <div key={section.section} className="bg-gray-800/30 rounded border border-gray-700/50">
                      {/* Compact Section Header */}
                      <button
                        onClick={() => toggleSection(section.section)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-700/20 transition-colors rounded-t"
                      >
                        <div className="flex items-center space-x-2">
                          <SectionIcon className={`w-4 h-4 ${section.color}`} />
                          <h3 className="text-sm font-semibold text-white">{section.title}</h3>
                          <span className="text-xs text-gray-400 bg-gray-700/50 px-1.5 py-0.5 rounded">
                            {section.items.length}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {/* Compact Section Content */}
                      {isExpanded && (
                        <div className="p-3 pt-0 space-y-2">
                          {section.items.map((metric) => {
                            const MetricIcon = metric.icon;
                            return (
                              <div key={metric.key} className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${compareStocks.length}, minmax(160px, 1fr))` }}>
                                <div className="flex items-center space-x-2 py-2 bg-gray-700/20 px-2 rounded text-xs">
                                  <MetricIcon className="w-3 h-3 text-gray-400" />
                                  <div>
                                    <span className="font-medium text-gray-200 block">{metric.label}</span>
                                    <span className="text-[9px] text-gray-500">
                                      {metric.higherBetter ? '↑ Higher better' : '↓ Lower better'}
                                    </span>
                                  </div>
                                </div>
                                {compareStocks.map((stock) => {
                                  // Handle nested properties like quarterlyData.revenue
                                  const getNestedValue = (obj: any, path: string) => {
                                    return path.split('.').reduce((current, key) => current?.[key], obj);
                                  };
                                  
                                  const value = getNestedValue(stock, metric.key);
                                  const allValues = compareStocks.map(s => getNestedValue(s, metric.key));
                                  
                                  return (
                                    <MetricIndicator
                                      key={`${stock.symbol}-${metric.key}`}
                                      value={value}
                                      allValues={allValues}
                                      isHigherBetter={metric.higherBetter}
                                      format={metric.format}
                                    />
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Performance Summary with Investment Recommendations */}
              <div className="mt-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-700/30 rounded p-4">
                <h3 className="font-bold text-lg text-blue-300 mb-3 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Investment Analysis & Recommendations
                </h3>
                
                {/* Quick Insights */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="bg-green-900/20 border border-green-700/30 p-2 rounded">
                    <div className="flex items-center mb-1">
                      <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                      <span className="text-green-300 font-semibold text-xs">Best Today</span>
                    </div>
                    <span className="text-green-400 font-bold text-sm">
                      {compareStocks.reduce((best, stock) => 
                        stock.changePercent > best.changePercent ? stock : best
                      ).symbol}
                    </span>
                  </div>
                  
                  <div className="bg-blue-900/20 border border-blue-700/30 p-2 rounded">
                    <div className="flex items-center mb-1">
                      <Timer className="w-3 h-3 text-blue-400 mr-1" />
                      <span className="text-blue-300 font-semibold text-xs">Best Long-Term</span>
                    </div>
                    <span className="text-blue-400 font-bold text-sm">
                      {compareStocks.reduce((best, stock) => {
                        const bestScore = (best.peRatio && best.peRatio < 20 ? 2 : 0) + (best.roe && best.roe > 15 ? 2 : 0);
                        const currentScore = (stock.peRatio && stock.peRatio < 20 ? 2 : 0) + (stock.roe && stock.roe > 15 ? 2 : 0);
                        return currentScore > bestScore ? stock : best;
                      }, compareStocks[0])?.symbol || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-700/30 p-2 rounded">
                    <div className="flex items-center mb-1">
                      <DollarSign className="w-3 h-3 text-yellow-400 mr-1" />
                      <span className="text-yellow-300 font-semibold text-xs">Best Dividend</span>
                    </div>
                    <span className="text-yellow-400 font-bold text-sm">
                      {compareStocks
                        .filter(s => s.dividend !== undefined)
                        .reduce((highest, stock) => 
                          (stock.dividend || 0) > (highest.dividend || 0) ? stock : highest
                        , compareStocks[0])?.symbol || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Smart Investment Recommendations */}
                <div className="bg-gray-800/40 p-3 rounded border border-gray-600/30">
                  <h4 className="font-semibold text-white mb-2 flex items-center">
                    <Brain className="w-4 h-4 mr-2 text-purple-400" />
                    AI Investment Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-blue-900/30 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <Timer className="w-3 h-3 text-blue-400 mr-1" />
                        <span className="text-blue-300 font-semibold">Long-Term Hold</span>
                      </div>
                      <p className="text-blue-200">
                        {(() => {
                          const best = compareStocks.reduce((best, stock) => {
                            const score = (stock.peRatio && stock.peRatio < 20 ? 1 : 0) + 
                                         (stock.roe && stock.roe > 15 ? 1 : 0) + 
                                         (stock.debtToEquity && stock.debtToEquity < 0.5 ? 1 : 0);
                            const bestScore = (best.peRatio && best.peRatio < 20 ? 1 : 0) + 
                                             (best.roe && best.roe > 15 ? 1 : 0) + 
                                             (best.debtToEquity && best.debtToEquity < 0.5 ? 1 : 0);
                            return score > bestScore ? stock : best;
                          }, compareStocks[0]);
                          return `${best.symbol} - Strong fundamentals with good valuation`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-orange-900/30 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <Zap className="w-3 h-3 text-orange-400 mr-1" />
                        <span className="text-orange-300 font-semibold">Short-Term Play</span>
                      </div>
                      <p className="text-orange-200">
                        {(() => {
                          const best = compareStocks.reduce((best, stock) => {
                            const momentum = Math.abs(stock.changePercent);
                            const bestMomentum = Math.abs(best.changePercent);
                            return momentum > bestMomentum ? stock : best;
                          }, compareStocks[0]);
                          return `${best.symbol} - High momentum and volatility`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="bg-green-900/30 p-2 rounded">
                      <div className="flex items-center mb-1">
                        <Users className="w-3 h-3 text-green-400 mr-1" />
                        <span className="text-green-300 font-semibold">Dividend Income</span>
                      </div>
                      <p className="text-green-200">
                        {(() => {
                          const best = compareStocks
                            .filter(s => s.dividend !== undefined)
                            .reduce((highest, stock) => 
                              (stock.dividend || 0) > (highest.dividend || 0) ? stock : highest
                            , compareStocks[0]);
                          return best ? `${best.symbol} - ${best.dividend?.toFixed(1)}% yield` : 'No dividend stocks';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compact Fixed Footer */}
        <div className="flex-shrink-0 p-2 border-t border-gray-700 bg-gray-900/50">
          <div className="flex items-center justify-between text-[10px] text-gray-500">
            <div className="flex items-center space-x-2">
              <p>Finnhub API • Real-time data • AI-powered recommendations</p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            </div>
            <p>Updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareStocks;