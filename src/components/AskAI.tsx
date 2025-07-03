import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, Loader, ExternalLink, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLong?: boolean;
  rating?: 'up' | 'down' | null;
}

interface AskAIProps {
  className?: string;
  prefilledQuestion?: string;
  onQuestionProcessed?: () => void;
}

// SECURITY NOTE: In production, move this to a backend service to hide your API key
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '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';

const AskAI: React.FC<AskAIProps> = ({ className = '', prefilledQuestion, onQuestionProcessed }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm your AI investment assistant. I can help you understand stocks, explain financial concepts, and provide educational insights about investing. What would you like to know?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle prefilled questions from navigation
  useEffect(() => {
    if (prefilledQuestion && prefilledQuestion.trim()) {
      setIsExpanded(true);
      setTimeout(() => {
        sendMessage(prefilledQuestion);
        onQuestionProcessed?.();
      }, 500);
    }
  }, [prefilledQuestion]);

  const predefinedQuestions = [
    "What is a stock?",
    "How do I start investing?",
    "What's the difference between stocks and bonds?",
    "What is diversification?",
    "How do I read financial statements?",
    "What are ETFs?",
    "Explain compound interest",
    "What is dollar-cost averaging?",
    "How do I analyze a company's financial health?",
    "What are the risks of investing?"
  ];

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Rate limiting - 1 second between requests
    const now = Date.now();
    if (now - lastRequestTime < 1000) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Please wait a moment before sending another message.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }
    setLastRequestTime(now);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are TechInvestor AI, a helpful financial education assistant for beginner investors. Your role is to:
              
              1. Provide clear, educational explanations about investing, stocks, and financial concepts
              2. Use simple language suitable for beginners
              3. Always emphasize that you're providing educational information, not financial advice
              4. Encourage users to do their own research and consult financial professionals
              5. Focus on long-term, responsible investing principles
              6. Avoid giving specific stock recommendations or predictions
              7. Be encouraging and supportive to help users build confidence in learning about investing
              
              Keep responses concise but informative (2-4 paragraphs max). Always end with a disclaimer that this is educational content, not financial advice.`
            },
            ...messages.slice(-10).map(msg => ({
              role: msg.role,
              content: msg.content
            })),
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiResponse = data.choices[0].message.content;
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        isLong: aiResponse.length > 300 // Mark as long if over 300 characters
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorContent = "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
      
      if (error instanceof Error) {
        if (error.message.includes('API key') || error.message.includes('not configured')) {
          errorContent = "I'm sorry, but the AI service is not configured properly. Please make sure the VITE_OPENAI_API_KEY is set up correctly.";
        } else if (error.message.includes('quota') || error.message.includes('billing')) {
          errorContent = "I've reached my usage limit. Please try again later or contact support.";
        } else if (error.message.includes('rate_limit')) {
          errorContent = "I'm receiving too many requests. Please wait a moment and try again.";
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
  };

  const rateMessage = (messageId: string, rating: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, rating: msg.rating === rating ? null : rating }
        : msg
    ));
  };

  const openDetailedView = (message: Message) => {
    // Navigate to detailed view page with message content
    navigate('/ai-response-detail', { 
      state: { 
        message: message.content, 
        timestamp: message.timestamp,
        originalQuery: messages[messages.findIndex(m => m.id === message.id) - 1]?.content 
      } 
    });
  };

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (!isExpanded) {
    return (
      <div className={`bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Ask AI</h2>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Start Chat</span>
          </button>
        </div>
        
        <p className="text-gray-300 mb-4">
          Get instant answers to your investment questions from our AI assistant.
        </p>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Popular questions:</p>
          {predefinedQuestions.slice(0, 3).map((question, index) => (
            <button
              key={index}
              onClick={() => {
                setIsExpanded(true);
                setTimeout(() => handleQuickQuestion(question), 100);
              }}
              className="block w-full text-left text-sm text-blue-400 hover:text-blue-300 transition-colors py-1 hover:bg-gray-700 rounded px-2"
            >
              • {question}
            </button>
          ))}
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            View all questions →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg flex flex-col ${className}`} style={{ height: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-750 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">TechInvestor AI</h2>
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Live</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white transition-colors text-sm px-2 py-1 rounded hover:bg-gray-700"
        >
          Minimize
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              
              <div className={`rounded-lg p-3 ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap">
                  {message.isLong ? truncateText(message.content) : message.content}
                </p>
                
                {message.isLong && (
                  <button
                    onClick={() => openDetailedView(message)}
                    className="text-xs text-blue-300 hover:text-blue-200 mt-2 flex items-center space-x-1"
                  >
                    <span>Read more</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-xs ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="text-gray-400 hover:text-white transition-colors p-1"
                        title="Copy message"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => rateMessage(message.id, 'up')}
                        className={`transition-colors p-1 ${
                          message.rating === 'up' ? 'text-green-400' : 'text-gray-400 hover:text-green-400'
                        }`}
                        title="Rate positive"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => rateMessage(message.id, 'down')}
                        className={`transition-colors p-1 ${
                          message.rating === 'down' ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                        }`}
                        title="Rate negative"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2 max-w-[85%]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-600">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-lg p-3 bg-gray-700">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm text-gray-300">Getting real-time response...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1">
            {predefinedQuestions.slice(0, 6).map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                disabled={isLoading}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors disabled:opacity-50 border border-gray-600 hover:border-gray-500"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-750 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about investing..."
            disabled={isLoading}
            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">
            Real-time AI responses • Educational information only, not financial advice.
          </p>
          <p className="text-xs text-gray-500">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </form>
    </div>
  );
};

export default AskAI;