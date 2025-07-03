import React, { useState, useEffect } from 'react';
import { HelpCircle, X, RefreshCw, AlertTriangle } from 'lucide-react';

interface Question {
  id: number;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
}

const StockQuiz: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNewQuestion = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching new quiz question...');
      
      // First check if server is running
      const healthResponse = await fetch('http://localhost:5000/api/health');
      if (!healthResponse.ok) {
        throw new Error('Quiz server is not running. Please start the backend server.');
      }
      
      const response = await fetch('http://localhost:5000/api/quiz', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: "Generate a random investment quiz question" 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data: Question = await response.json();
      console.log('✅ Received question:', data);
      
      // Validate the question structure
      if (!data.text || !Array.isArray(data.options) || data.options.length !== 4) {
        throw new Error('Invalid question format received');
      }
      
      setCurrentQuestion(data);
      setSelectedOption(null);
      setAnswered(false);
      
    } catch (err) {
      console.error('❌ Error fetching question:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load question';
      setError(errorMessage);
      
      // Use a fallback question if server is down
      if (errorMessage.includes('server') || errorMessage.includes('fetch')) {
        const fallbackQuestion: Question = {
          id: Math.floor(Math.random() * 1000),
          text: "What is a stock?",
          options: [
            "A share of ownership in a company",
            "A type of bond",
            "A bank account",
            "A cryptocurrency"
          ],
          answer: 0,
          explanation: "A stock represents a share of ownership in a company. When you buy stock, you become a shareholder and own a piece of that business."
        };
        
        setCurrentQuestion(fallbackQuestion);
        setSelectedOption(null);
        setAnswered(false);
        setError("Using offline question - please start the quiz server for AI-generated questions");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (answered || !currentQuestion) return;
    
    setSelectedOption(optionIndex);
    setAnswered(true);
    
    if (optionIndex === currentQuestion.answer) {
      setScore(score + 1);
    }
    
    setQuestionCount(questionCount + 1);
  };

  const handleNextQuestion = () => {
    fetchNewQuestion();
  };

  const resetQuiz = () => {
    setScore(0);
    setQuestionCount(0);
    setCurrentQuestion(null);
    setSelectedOption(null);
    setAnswered(false);
    setError(null);
  };

  const closeQuiz = () => {
    setIsOpen(false);
    resetQuiz();
  };

  const retryFetch = () => {
    fetchNewQuestion();
  };

  useEffect(() => {
    if (isOpen) {
      fetchNewQuestion();
    }
  }, [isOpen]);

  return (
    <>
      {/* Quiz Button */}
      <div className="fixed bottom-4 right-4 z-30">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transform hover:scale-105 transition-all"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Quiz Time!</span>
        </button>
      </div>

      {/* Quiz Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white shadow-2xl relative">
            {/* Close Button */}
            <button 
              onClick={closeQuiz}
              className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-orange-400">Stock Market Quiz</h2>
              {questionCount > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Score: {score}/{questionCount} ({Math.round((score/questionCount) * 100)}%)
                </p>
              )}
            </div>

            {/* Loading State */}
            {loading && !currentQuestion && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
                <p className="text-lg text-gray-300">Loading question...</p>
              </div>
            )}

            {/* Error State */}
            {error && !currentQuestion && (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={retryFetch}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center space-x-2 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Question Content */}
            {currentQuestion && (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">{currentQuestion.text}</h3>

                  <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        className={`block w-full text-left p-3 rounded transition-colors ${
                          selectedOption === index
                            ? index === currentQuestion.answer
                              ? 'bg-green-700 text-white border-2 border-green-500'
                              : 'bg-red-700 text-white border-2 border-red-500'
                            : answered && index === currentQuestion.answer
                            ? 'bg-green-700 text-white border-2 border-green-500'
                            : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                        }`}
                        disabled={answered}
                      >
                        <span className="font-medium">
                          {String.fromCharCode(65 + index)}. 
                        </span>
                        {' '}
                        {option}
                      </button>
                    ))}
                  </div>

                  {/* Explanation */}
                  {answered && (
                    <div className="bg-gray-900 p-4 rounded border border-gray-700">
                      <p className={`font-semibold mb-2 ${
                        selectedOption === currentQuestion.answer ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedOption === currentQuestion.answer ? '✓ Correct!' : '✗ Incorrect!'}
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Error warning for offline mode */}
                {error && (
                  <div className="mb-4 p-3 bg-yellow-900 bg-opacity-50 border border-yellow-700 rounded">
                    <p className="text-yellow-200 text-sm">{error}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleNextQuestion}
                    disabled={!answered || loading}
                    className={`flex-1 p-3 rounded font-medium transition-colors flex items-center justify-center space-x-2 ${
                      answered && !loading
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Next Question</span>
                    )}
                  </button>
                  
                  <button
                    onClick={resetQuiz}
                    className="px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded font-medium transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default StockQuiz;