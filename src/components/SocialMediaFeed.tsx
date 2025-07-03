import React, { useEffect, useState } from 'react';
import { Tweet } from 'react-tweet';
import { User } from 'firebase/auth';
import { db, doc, getDoc } from '../firebase';
import { RefreshCw } from 'lucide-react';

interface SocialMediaFeedProps {
  user: User | null;
}

const SocialMediaFeed: React.FC<SocialMediaFeedProps> = ({ user }) => {
  const [tweets, setTweets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<string[]>([]);

  useEffect(() => {
    const loadUserStocks = async () => {
      if (!user) {
        setStocks([]);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setStocks(userDoc.data().portfolio || []);
        }
      } catch (error) {
        console.error('Error loading stocks:', error);
      }
    };

    loadUserStocks();
  }, [user]);

  useEffect(() => {
    const fetchTweets = async () => {
      if (stocks.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // For demo purposes, using static tweet IDs
        // In production, you would fetch these from your backend
        const demoTweetIds = [
          '1767742391092162561', // Example tweet about stocks
          '1767741891092162561',
          '1767741791092162561'
        ];
        
        setTweets(demoTweetIds);
      } catch (error) {
        console.error('Error fetching tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, [stocks]);

  if (!user) {
    return (
      <div className="p-6 bg-gray-800 rounded shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Social Media Updates</h2>
        <p className="text-yellow-300">Please log in to view stock-related tweets.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-800 rounded shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Social Media Updates</h2>
        <button 
          onClick={() => setLoading(true)}
          className="p-2 hover:bg-gray-700 rounded transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : tweets.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {tweets.map((tweetId) => (
            <div key={tweetId} className="bg-gray-900 rounded overflow-hidden">
              <Tweet id={tweetId} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No relevant tweets found for your stocks.</p>
      )}
    </div>
  );
};

export default SocialMediaFeed;