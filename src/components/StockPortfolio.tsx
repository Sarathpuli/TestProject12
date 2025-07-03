import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { db, doc, getDoc } from '../firebase';
import { BookOpen, AlertTriangle, TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface StockInfo {
  symbol: string;
  name?: string;
  price?: number;
  recommendation?: 'buy' | 'hold' | 'sell';
}

interface StockPortfolioProps {
  user: User | null;
}

const StockPortfolio: React.FC<StockPortfolioProps> = ({ user }) => {
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user) {
        setStocks([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          setStocks([]);
          setLoading(false);
          return;
        }
        
        const portfolio = userDoc.data().portfolio || [];
        
        // Mock data for the demo
        const mockStocks = portfolio.map((symbol: string) => {
          const randomPrice = (Math.random() * 500 + 50).toFixed(2);
          const recommendations = ['buy', 'hold', 'sell'];
          const randomRec = recommendations[Math.floor(Math.random() * recommendations.length)] as 'buy' | 'hold' | 'sell';
          
          return {
            symbol,
            name: `${symbol} Corp.`,
            price: parseFloat(randomPrice),
            recommendation: randomRec
          };
        });
        
        setStocks(mockStocks);
      } catch (err) {
        console.error('Error loading portfolio:', err);
        setError('Failed to load your portfolio');
      } finally {
        setLoading(false);
      }
    };
    
    loadPortfolio();
  }, [user]);

  const getRecommendationIcon = (rec: 'buy' | 'hold' | 'sell') => {
    switch (rec) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'hold':
        return <Scale className="w-4 h-4 text-yellow-400" />;
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
    }
  };

  if (!user) {
    return (
      <div className="p-6 bg-gray-800 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Your Saved Portfolio</h2>
        <p className="text-yellow-300">Please log in to view your portfolio.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded shadow-lg transform transition-all">
      <h2 className="text-xl font-semibold mb-4">Your Saved Portfolio</h2>
      
      {loading && (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center text-red-400">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <ul className="space-y-3 text-white">
          {stocks.length === 0 ? (
            <li className="text-yellow-300">No stocks saved yet.</li>
          ) : (
            stocks.map((stock) => (
              <li key={stock.symbol} className="p-3 bg-gray-700 rounded flex justify-between items-center">
                <div>
                  <Link to={`/stock/${stock.symbol}`} className="font-semibold text-blue-400 hover:underline">
                    {stock.symbol}
                  </Link>
                  <p className="text-sm text-gray-300">{stock.name}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="font-mono">${stock.price?.toFixed(2)}</span>
                  
                  <div className="flex items-center">
                    {getRecommendationIcon(stock.recommendation || 'hold')}
                  </div>
                  
                  <button className="ml-2 p-1 bg-blue-800 text-blue-200 rounded hover:bg-blue-700 transition-colors">
                    <BookOpen className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default StockPortfolio;