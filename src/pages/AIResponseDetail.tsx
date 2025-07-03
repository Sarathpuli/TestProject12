import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Download, 
  Bot, 
  Calendar,
  Clock,
  BookOpen,
  ExternalLink,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface DetailPageState {
  message: string;
  timestamp: Date;
  originalQuery?: string;
}

const AIResponseDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCopied, setIsCopied] = useState(false);
  const [rating, setRating] = useState<'up' | 'down' | null>(null);

  const state = location.state as DetailPageState;

  useEffect(() => {
    if (!state) {
      navigate('/');
    }
  }, [state, navigate]);

  if (!state) {
    return null;
  }

  const { message, timestamp, originalQuery } = state;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Investment Advice',
          text: message,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share failed:', error);
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleDownload = () => {
    const content = `
AI Investment Assistant Response
Generated on: ${timestamp.toLocaleString()}
${originalQuery ? `Original Question: ${originalQuery}\n` : ''}
Response:
${message}

---
Disclaimer: This is educational information only, not financial advice.
`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-response-${timestamp.toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRating = (newRating: 'up' | 'down') => {
    setRating(rating === newRating ? null : newRating);
  };

  const relatedQuestions = [
    "What are the risks involved in stock investing?",
    "How do I create a diversified portfolio?",
    "What's the difference between active and passive investing?",
    "How do economic indicators affect stock prices?",
    "What are dividend-paying stocks?"
  ];

  const formatMessage = (text: string) => {
    return text
      .split('\n\n')
      .map((paragraph, index) => {
        if (paragraph.trim().match(/^\d+\./)) {
          const items = paragraph.split(/(?=\d+\.)/);
          return (
            <ol key={index} className="list-decimal list-inside space-y-2 mb-4">
              {items.filter(item => item.trim()).map((item, itemIndex) => (
                <li key={itemIndex} className="text-gray-100">
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ol>
          );
        } else if (paragraph.includes('**')) {
          const parts = paragraph.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={index} className="text-gray-100 mb-4 leading-relaxed">
              {parts.map((part, partIndex) => 
                partIndex % 2 === 1 ? (
                  <strong key={partIndex} className="text-white font-semibold">{part}</strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        } else {
          return (
            <p key={index} className="text-gray-100 mb-4 leading-relaxed">
              {paragraph}
            </p>
          );
        }
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <Bot className="w-6 h-6 text-blue-400" />
              <h1 className="text-xl font-semibold">AI Response Details</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Metadata */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <span>Response Details</span>
            </h2>
            {isCopied && (
              <span className="text-green-400 text-sm">Copied to clipboard!</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>Date: {timestamp.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Time: {timestamp.toLocaleTimeString()}</span>
            </div>
          </div>
          
          {originalQuery && (
            <div className="mt-4 p-4 bg-gray-700 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Original Question:</h3>
              <p className="text-gray-100">{originalQuery}</p>
            </div>
          )}
        </div>

        {/* Response Content */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-xl font-semibold mb-6 text-white">AI Response</h2>
            <div className="text-base">
              {formatMessage(message)}
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <p className="text-yellow-200 text-sm">
              <strong>Disclaimer:</strong> This information is for educational purposes only and should not be considered as financial advice. 
              Always do your own research and consider consulting with a qualified financial professional before making investment decisions.
            </p>
          </div>
        </div>

        {/* Rating and Feedback */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Was this response helpful?</h3>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleRating('up')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                rating === 'up' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:text-green-400'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span>Helpful</span>
            </button>
            <button
              onClick={() => handleRating('down')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                rating === 'down' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-400 hover:text-red-400'
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span>Not helpful</span>
            </button>
          </div>
        </div>

        {/* Related Questions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Related Questions</h3>
          <div className="space-y-2">
            {relatedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => navigate('/', { state: { askQuestion: question } })}
                className="block w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-100 hover:text-white"
              >
                <div className="flex items-center justify-between">
                  <span>{question}</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-700">
            <button
              onClick={() => navigate('/')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors font-semibold"
            >
              Ask Another Question
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIResponseDetail;