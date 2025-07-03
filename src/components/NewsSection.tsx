import React, { useEffect, useState, useCallback } from 'react';
import { 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock, 
  TrendingUp,
  Share2,
  Bookmark,
  Eye,
  AlertCircle,
  ChevronDown,
  Calendar
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at?: string;
  description?: string;
  image_url?: string;
  entities?: Array<{
    symbol: string;
    name: string;
  }>;
  sentiment?: string;
}

interface MarketAuxResponse {
  data: Array<{
    uuid: string;
    title: string;
    url: string;
    source: string;
    published_at: string;
    description?: string;
    image_url?: string;
    entities?: Array<{
      symbol: string;
      name: string;
    }>;
    sentiment?: string;
  }>;
}

const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const categories = [
    { id: 'all', label: 'All News', icon: Newspaper },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'stocks', label: 'Stocks', icon: TrendingUp },
    { id: 'crypto', label: 'Crypto', icon: TrendingUp },
  ];

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        'https://api.marketaux.com/v1/news/all?api_token=dBfFDS45kS1csJb3lI1LPgRRZr2ZZ1urOAKctDMV&language=en&filter_entities=true&limit=20&sort=published_desc'
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.status}`);
      }

      const data: MarketAuxResponse = await response.json();

      if (!data?.data) {
        throw new Error('No data returned from MarketAux');
      }

      const formatted: NewsItem[] = data.data.map((item) => ({
        id: item.uuid,
        title: item.title,
        url: item.url,
        source: item.source || 'Unknown Source',
        published_at: item.published_at,
        description: item.description,
        image_url: item.image_url,
        entities: item.entities,
        sentiment: item.sentiment
      }));

      setNews(formatted);
      setFilteredNews(formatted);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('❌ Error fetching news:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market news';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    let filtered = news;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => {
        switch (selectedFilter) {
          case 'trending':
            return item.sentiment === 'positive' || (item.entities?.length ?? 0) > 0;
          case 'stocks':
            return item.entities?.some(entity => entity.symbol) || 
                   item.title.toLowerCase().includes('stock') ||
                   item.title.toLowerCase().includes('share');
          case 'crypto':
            return item.title.toLowerCase().includes('crypto') ||
                   item.title.toLowerCase().includes('bitcoin') ||
                   item.title.toLowerCase().includes('ethereum');
          default:
            return true;
        }
      });
    }

    setFilteredNews(filtered);
  }, [news, searchTerm, selectedFilter]);

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const toggleBookmark = (articleId: string) => {
    const newBookmarks = new Set(bookmarkedArticles);
    if (newBookmarks.has(articleId)) {
      newBookmarks.delete(articleId);
    } else {
      newBookmarks.add(articleId);
    }
    setBookmarkedArticles(newBookmarks);
  };

  const shareArticle = async (article: NewsItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description || article.title,
          url: article.url,
        });
      } catch  {
        // Fallback to copying URL
        navigator.clipboard.writeText(article.url);
      }
    } else {
      navigator.clipboard.writeText(article.url);
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      case 'neutral': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      case 'neutral': return '➡️';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-blue-400" />
            Market News
          </h2>
          <div className="animate-spin">
            <RefreshCw className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Newspaper className="w-5 h-5 mr-2 text-blue-400" />
          Market News
        </h2>
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchNews}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-blue-400" />
            Market News
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {formatTimeAgo(lastRefresh.toISOString())}
          </p>
        </div>
        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh news"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search news..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedFilter(category.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      selectedFilter === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filteredNews.length === 0 ? (
          <div className="text-center py-8">
            <Eye className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No news articles found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-400 hover:text-blue-300 text-sm mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          filteredNews.map((article) => (
            <div
              key={article.id}
              className="group p-4 bg-gray-700 hover:bg-gray-650 rounded-lg transition-all hover:shadow-md border border-gray-600 hover:border-gray-500"
            >
              <div className="flex space-x-4">
                {/* Article Image */}
                {article.image_url && (
                  <div className="w-24 h-24 flex-shrink-0">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h3 className="text-blue-400 group-hover:text-blue-300 font-medium text-sm leading-tight line-clamp-2 transition-colors">
                        {article.title}
                      </h3>
                    </a>
                    <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0 ml-2" />
                  </div>

                  {/* Description */}
                  {article.description && (
                    <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  {/* Entities/Tags */}
                  {article.entities && article.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.entities.slice(0, 3).map((entity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full"
                        >
                          ${entity.symbol}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Newspaper className="w-3 h-3" />
                        <span>{article.source}</span>
                      </span>
                      
                      {article.published_at && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(article.published_at)}</span>
                        </span>
                      )}

                      {article.sentiment && (
                        <span className={`flex items-center space-x-1 ${getSentimentColor(article.sentiment)}`}>
                          <span>{getSentimentIcon(article.sentiment)}</span>
                          <span className="capitalize">{article.sentiment}</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleBookmark(article.id)}
                        className={`p-1 rounded transition-colors ${
                          bookmarkedArticles.has(article.id)
                            ? 'text-yellow-400 hover:text-yellow-300'
                            : 'text-gray-500 hover:text-yellow-400'
                        }`}
                        title="Bookmark article"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => shareArticle(article)}
                        className="p-1 text-gray-500 hover:text-blue-400 rounded transition-colors"
                        title="Share article"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            Showing {filteredNews.length} of {news.length} articles
          </span>
          <span className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>Updated every 5 minutes</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default NewsSection;