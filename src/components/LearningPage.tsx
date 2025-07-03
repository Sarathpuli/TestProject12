// LearningPage.tsx - Step 2 + Simple Progress (Minimal Addition)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  TrendingUp, 
  Shield, 
  Clock, 
  Home,
  PieChart,
  Play,
  CheckCircle,
  Info,
  AlertTriangle,
  Video,
  Image as ImageIcon,
  Brain,
  Target,
  Award,
  RotateCcw
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LearningSection {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  examples?: string[];
  risks?: string[];
  media?: {
    image?: string;
    video?: string;
    videoTitle?: string;
  };
  quiz?: QuizQuestion[];
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  icon: any;
  sections: LearningSection[];
}

const LearningPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState<string>('stocks');
  const [activeSection, setActiveSection] = useState<string>('');
  
  // Simple progress tracking - just completed sections
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<{[key: string]: number}>({});
  const [quizResults, setQuizResults] = useState<{[key: string]: boolean}>({});
  const [showQuizResults, setShowQuizResults] = useState<{[key: string]: boolean}>({});

  // Simple function to mark section complete
  const markSectionComplete = (sectionId: string) => {
    setCompletedSections(prev => new Set([...prev, sectionId]));
  };

  // Quiz functions
  const handleQuizAnswer = (questionId: string, answer: number) => {
    setQuizAnswers(prev => ({...prev, [questionId]: answer}));
  };

  const submitQuiz = (sectionId: string, quiz: QuizQuestion[]) => {
    const results: {[key: string]: boolean} = {};
    let correctCount = 0;
    
    quiz.forEach(question => {
      const isCorrect = quizAnswers[question.id] === question.correctAnswer;
      results[question.id] = isCorrect;
      if (isCorrect) correctCount++;
    });
    
    setQuizResults(prev => ({...prev, ...results}));
    setShowQuizResults(prev => ({...prev, [sectionId]: true}));
    
    // Auto-complete section if quiz score is good (70% or higher)
    if (correctCount / quiz.length >= 0.7) {
      markSectionComplete(sectionId);
    }
  };

  const resetQuiz = (sectionId: string, quiz: QuizQuestion[]) => {
    const resetAnswers = {...quizAnswers};
    const resetResults = {...quizResults};
    
    quiz.forEach(question => {
      delete resetAnswers[question.id];
      delete resetResults[question.id];
    });
    
    setQuizAnswers(resetAnswers);
    setQuizResults(resetResults);
    setShowQuizResults(prev => ({...prev, [sectionId]: false}));
  };

  // Learning modules data (same as Step 2)
  const learningModules: LearningModule[] = [
    {
      id: 'stocks',
      title: 'Stocks & Equity Investing',
      description: 'Learn about stock market fundamentals',
      difficulty: 'Beginner',
      duration: '45 min',
      icon: TrendingUp,
      sections: [
        {
          id: 'what-are-stocks',
          title: 'What Are Stocks?',
          content: 'Stocks represent ownership shares in a company. When you buy stock, you become a shareholder and own a piece of that business. Companies issue stocks to raise capital for growth, expansion, or operations.',
          keyPoints: [
            'Stocks represent partial ownership in companies',
            'Shareholders have voting rights and may receive dividends',
            'Stock prices fluctuate based on company performance and market conditions',
            'Two main types: Common stocks and Preferred stocks'
          ],
          examples: [
            'If Apple has 1 billion shares and you own 100 shares, you own 0.00001% of Apple',
            'Coca-Cola pays quarterly dividends to shareholders',
            'Tesla stock price varies based on electric vehicle market trends'
          ],
          media: {
            image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=300&fit=crop',
            video: 'https://www.youtube.com/embed/p7HKvqRI_Bo',
            videoTitle: 'What Are Stocks? Stock Market for Beginners'
          },
          quiz: [
            {
              id: 'stocks-q1',
              question: 'What do stocks represent?',
              options: [
                'Loans to companies',
                'Ownership shares in companies', 
                'Government bonds',
                'Bank deposits'
              ],
              correctAnswer: 1,
              explanation: 'Stocks represent ownership shares in companies. When you buy stock, you become a partial owner of that business.'
            },
            {
              id: 'stocks-q2',
              question: 'What are the two main types of stocks?',
              options: [
                'Buy and Sell stocks',
                'Cheap and Expensive stocks',
                'Common and Preferred stocks',
                'Local and International stocks'
              ],
              correctAnswer: 2,
              explanation: 'The two main types are Common stocks (with voting rights) and Preferred stocks (with fixed dividends but limited voting rights).'
            }
          ]
        },
        {
          id: 'stock-valuation',
          title: 'Stock Valuation Basics',
          content: 'Understanding how to evaluate whether a stock is fairly priced is crucial for successful investing. Key metrics include P/E ratio, P/B ratio, and dividend yield.',
          keyPoints: [
            'P/E Ratio: Price-to-Earnings ratio shows how much investors pay per dollar of earnings',
            'P/B Ratio: Price-to-Book ratio compares market value to book value',
            'Dividend Yield: Annual dividends per share divided by stock price',
            'Market Cap: Total value of all company shares'
          ],
          examples: [
            'A P/E ratio of 20 means investors pay $20 for every $1 of annual earnings',
            'A P/B ratio below 1 might indicate undervalued stock',
            'High dividend yield could signal financial distress or great value'
          ],
          media: {
            image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=300&fit=crop',
            video: 'https://www.youtube.com/embed/7pwHkI7QAnU',
            videoTitle: 'Stock Valuation Methods Explained'
          },
          quiz: [
            {
              id: 'valuation-q1',
              question: 'What does a P/E ratio of 20 mean?',
              options: [
                'The stock costs $20',
                'Investors pay $20 for every $1 of annual earnings',
                'The company has 20 employees',
                'The stock will double in 20 years'
              ],
              correctAnswer: 1,
              explanation: 'A P/E ratio of 20 means investors are willing to pay $20 for every $1 of annual earnings the company generates.'
            },
            {
              id: 'valuation-q2',
              question: 'What might a P/B ratio below 1 indicate?',
              options: [
                'The stock is overvalued',
                'The company is bankrupt',
                'The stock might be undervalued',
                'The company has no assets'
              ],
              correctAnswer: 2,
              explanation: 'A P/B ratio below 1 means the stock is trading below its book value, which might indicate the stock is undervalued.'
            }
          ]
        },
        {
          id: 'investment-strategies',
          title: 'Investment Strategies',
          content: 'Different approaches to stock investing suit different risk tolerances and time horizons. Common strategies include value investing, growth investing, and dividend investing.',
          keyPoints: [
            'Value Investing: Buy undervalued stocks below intrinsic value',
            'Growth Investing: Focus on companies with strong growth potential',
            'Dividend Investing: Target stocks with consistent dividend payments',
            'Index Investing: Diversify through broad market exposure'
          ],
          examples: [
            'Warren Buffett is famous for value investing approach',
            'Technology stocks often appeal to growth investors',
            'Utility companies typically provide steady dividends',
            'S&P 500 index funds offer broad market diversification'
          ],
          risks: [
            'Value traps: Stocks cheap for good reasons',
            'Growth stocks can be volatile and overvalued',
            'Dividend cuts can occur during economic downturns',
            'Market risks affect all investments'
          ]
        }
      ]
    },
    {
      id: 'options',
      title: 'Options Trading',
      description: 'Advanced derivatives trading strategies',
      difficulty: 'Advanced',
      duration: '60 min',
      icon: Shield,
      sections: [
        {
          id: 'options-basics',
          title: 'What Are Options?',
          content: 'Options are financial contracts that give you the right (but not obligation) to buy or sell a stock at a specific price within a certain timeframe. They are powerful tools for hedging and speculation.',
          keyPoints: [
            'Call Options: Right to buy at strike price',
            'Put Options: Right to sell at strike price',
            'Premium: Cost to purchase the option',
            'Expiration Date: When option contract ends'
          ],
          examples: [
            'Buy AAPL $150 call expiring next month for $5 premium',
            'Sell cash-secured puts to potentially acquire stock',
            'Covered calls generate income on existing holdings'
          ],
          risks: [
            'Options can expire worthless',
            'Limited time value decay',
            'High leverage amplifies losses',
            'Complex strategies require experience'
          ],
          media: {
            image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=300&fit=crop',
            video: 'https://www.youtube.com/embed/VJgHkAqohbE',
            videoTitle: 'Options Trading for Beginners'
          },
          quiz: [
            {
              id: 'options-q1',
              question: 'What does a call option give you the right to do?',
              options: [
                'Sell a stock at the strike price',
                'Buy a stock at the strike price',
                'Keep the premium',
                'Cancel the contract'
              ],
              correctAnswer: 1,
              explanation: 'A call option gives you the right (but not obligation) to buy a stock at the strike price within a certain timeframe.'
            },
            {
              id: 'options-q2',
              question: 'What is the main risk of buying options?',
              options: [
                'Unlimited losses',
                'Options can expire worthless',
                'You must exercise them',
                'They never make money'
              ],
              correctAnswer: 1,
              explanation: 'The main risk of buying options is that they can expire worthless, meaning you lose the entire premium paid.'
            }
          ]
        }
      ]
    },
    {
      id: 'futures',
      title: 'Futures Trading',
      description: 'Commodity and financial futures markets',
      difficulty: 'Advanced',
      duration: '50 min',
      icon: Clock,
      sections: [
        {
          id: 'futures-basics',
          title: 'Understanding Futures',
          content: 'Futures contracts are agreements to buy or sell an asset at a predetermined price on a specific future date. They are commonly used for commodities, currencies, and financial instruments.',
          keyPoints: [
            'Standardized contracts traded on exchanges',
            'Margin requirements allow leverage',
            'Mark-to-market daily settlement',
            'Physical delivery or cash settlement'
          ],
          examples: [
            'Oil futures for energy price exposure',
            'S&P 500 futures for market hedging',
            'Currency futures for foreign exchange',
            'Agricultural futures for commodity trading'
          ],
          risks: [
            'High leverage can lead to significant losses',
            'Margin calls require additional funds',
            'Volatile price movements',
            'Contract specifications must be understood'
          ]
        }
      ]
    },
    {
      id: 'real-estate',
      title: 'Real Estate Investing',
      description: 'Property investment strategies and REITs',
      difficulty: 'Intermediate',
      duration: '40 min',
      icon: Home,
      sections: [
        {
          id: 'real-estate-basics',
          title: 'Real Estate Investment Fundamentals',
          content: 'Real estate investing involves acquiring, owning, managing, and disposing of property for profit. This asset class provides income generation, capital appreciation, and inflation hedging.',
          keyPoints: [
            'Direct ownership: Rental properties, fix-and-flip, commercial real estate',
            'Indirect ownership: REITs, real estate funds, crowdfunding platforms',
            'Income generation through rental yields and lease agreements',
            'Capital appreciation through property value increases over time'
          ],
          examples: [
            'Single-family rental generating $2,000 monthly rent on $300,000 property',
            'Commercial office building with long-term triple-net leases',
            'Realty Income Corp (O) REIT paying monthly dividends to shareholders'
          ],
          risks: [
            'Illiquidity compared to stocks and bonds',
            'Property management time and complexity',
            'Market cycles can cause significant value fluctuations',
            'Maintenance, repairs, and vacancy costs impact returns'
          ]
        }
      ]
    },
    {
      id: 'portfolio',
      title: 'Portfolio Management',
      description: 'Modern portfolio theory and diversification',
      difficulty: 'Intermediate',
      duration: '35 min',
      icon: PieChart,
      sections: [
        {
          id: 'portfolio-basics',
          title: 'Portfolio Construction',
          content: 'Building a diversified investment portfolio involves balancing risk and return through strategic asset allocation across different investment types and sectors.',
          keyPoints: [
            'Asset allocation: Stocks, bonds, real estate, commodities',
            'Diversification: Spread risk across investments',
            'Risk tolerance: Match investments to comfort level',
            'Rebalancing: Maintain target allocations over time'
          ],
          examples: [
            '60/40 portfolio: 60% stocks, 40% bonds for balanced approach',
            'Age-based allocation: 100 minus age in stocks (e.g., 30-year-old = 70% stocks)',
            'Geographic diversification: US, international, emerging markets'
          ],
          risks: [
            'Over-diversification can limit returns',
            'Correlation increases during market stress',
            'Rebalancing costs and tax implications',
            'Behavioral biases affect decision making'
          ]
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-900/30';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-900/30';
      case 'Advanced': return 'text-red-400 bg-red-900/30';
      default: return 'text-gray-400 bg-gray-900/30';
    }
  };

  const currentModule = learningModules.find(m => m.id === activeModule);
  const currentSection = currentModule?.sections.find(s => s.id === activeSection);

  console.log('Step 2.5 - Simple progress tracking. Completed sections:', completedSections.size);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Investment Learning Center</h1>
            <p className="text-gray-400">Master the fundamentals of investing</p>
            {/* Simple progress indicator */}
            {completedSections.size > 0 && (
              <p className="text-sm text-green-400 mt-1">
                ✅ {completedSections.size} sections completed
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Module Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-lg sticky top-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
                Learning Modules
              </h2>
              
              <div className="space-y-3">
                {learningModules.map((module) => {
                  const IconComponent = module.icon;
                  return (
                    <button
                      key={module.id}
                      onClick={() => {
                        setActiveModule(module.id);
                        setActiveSection('');
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-colors ${
                        activeModule === module.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm">{module.title}</h3>
                          <p className="text-xs opacity-80 mt-1">{module.description}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(module.difficulty)}`}>
                              {module.difficulty}
                            </span>
                            <span className="text-xs opacity-60">{module.duration}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentModule && !activeSection && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-blue-600 rounded-lg">
                    <currentModule.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentModule.title}</h2>
                    <p className="text-gray-400">{currentModule.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className={`text-sm px-3 py-1 rounded ${getDifficultyColor(currentModule.difficulty)}`}>
                        {currentModule.difficulty}
                      </span>
                      <span className="text-sm text-gray-400">{currentModule.duration}</span>
                      <span className="text-sm text-gray-400">{currentModule.sections.length} sections</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentModule.sections.map((section, index) => {
                    const isCompleted = completedSections.has(section.id);
                    
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="text-left p-5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600 hover:border-gray-500 relative"
                      >
                        {/* Simple completion indicator */}
                        {isCompleted && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-white">{section.title}</h3>
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-400 line-clamp-3 mb-3">{section.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {section.quiz && <Brain className="w-4 h-4 text-purple-400" />}
                            {section.media?.video && <Video className="w-4 h-4 text-red-400" />}
                            {section.media?.image && <ImageIcon className="w-4 h-4 text-blue-400" />}
                            <Play className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-400">
                              {isCompleted ? 'Review' : 'Start Learning'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {section.keyPoints.length} key points
                            {section.quiz && ` • ${section.quiz.length} quiz`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {currentSection && (
              <div className="bg-gray-800 p-6 rounded-lg">
                <button
                  onClick={() => setActiveSection('')}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {currentModule?.title}</span>
                </button>

                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2 flex items-center">
                    {currentSection.title}
                    {completedSections.has(activeSection) && (
                      <CheckCircle className="w-6 h-6 text-green-400 ml-3" />
                    )}
                  </h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <BookOpen className="w-4 h-4 mr-1" />
                        {currentModule?.title}
                      </span>
                      <span className={`px-2 py-1 rounded ${getDifficultyColor(currentModule?.difficulty || '')}`}>
                        {currentModule?.difficulty}
                      </span>
                    </div>
                    
                    {/* Simple mark complete button */}
                    {!completedSections.has(activeSection) && (
                      <button
                        onClick={() => markSectionComplete(activeSection)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Mark Complete</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed mb-6">{currentSection.content}</p>

                  {/* Media Content */}
                  {currentSection.media && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Image */}
                      {currentSection.media.image && (
                        <div className="bg-gray-700 rounded-lg overflow-hidden">
                          <div className="flex items-center space-x-2 p-3 border-b border-gray-600">
                            <ImageIcon className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-gray-300">Visual Learning</span>
                          </div>
                          <img 
                            src={currentSection.media.image} 
                            alt={currentSection.title}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Video */}
                      {currentSection.media.video && (
                        <div className="bg-gray-700 rounded-lg overflow-hidden">
                          <div className="flex items-center space-x-2 p-3 border-b border-gray-600">
                            <Video className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-medium text-gray-300">
                              {currentSection.media.videoTitle || 'Educational Video'}
                            </span>
                          </div>
                          <div className="relative h-48">
                            <iframe
                              src={currentSection.media.video}
                              title={currentSection.media.videoTitle}
                              className="w-full h-full"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Key Points
                    </h3>
                    <ul className="space-y-2">
                      {currentSection.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {currentSection.examples && (
                    <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-green-300 mb-3 flex items-center">
                        <Info className="w-5 h-5 mr-2" />
                        Examples
                      </h3>
                      <ul className="space-y-2">
                        {currentSection.examples.map((example, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentSection.risks && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-red-300 mb-3 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Important Risks
                      </h3>
                      <ul className="space-y-2">
                        {currentSection.risks.map((risk, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Interactive Quiz */}
                  {currentSection.quiz && (
                    <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-5">
                      <h3 className="text-xl font-semibold text-purple-300 mb-4 flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        Test Your Knowledge
                      </h3>
                      
                      <div className="space-y-4">
                        {currentSection.quiz.map((question, qIndex) => (
                          <div key={question.id} className="bg-purple-800/20 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-3">
                              {qIndex + 1}. {question.question}
                            </h4>
                            
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => {
                                const isSelected = quizAnswers[question.id] === oIndex;
                                const isCorrect = oIndex === question.correctAnswer;
                                const showResult = showQuizResults[activeSection];
                                
                                return (
                                  <button
                                    key={oIndex}
                                    onClick={() => handleQuizAnswer(question.id, oIndex)}
                                    disabled={showResult}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                                      showResult
                                        ? isCorrect
                                          ? 'bg-green-600/50 border border-green-500'
                                          : isSelected
                                          ? 'bg-red-600/50 border border-red-500'
                                          : 'bg-gray-700/50 border border-gray-600'
                                        : isSelected
                                        ? 'bg-purple-600 border border-purple-500'
                                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        showResult && isCorrect
                                          ? 'border-green-400 bg-green-400'
                                          : showResult && isSelected && !isCorrect
                                          ? 'border-red-400 bg-red-400'
                                          : isSelected
                                          ? 'border-purple-400 bg-purple-400'
                                          : 'border-gray-400'
                                      }`}>
                                        {showResult && isCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                                        {showResult && isSelected && !isCorrect && <span className="text-white text-xs">✗</span>}
                                        {isSelected && !showResult && <span className="w-2 h-2 bg-white rounded-full" />}
                                      </div>
                                      <span className="text-white">{option}</span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                            
                            {/* Show explanation after quiz submission */}
                            {showQuizResults[activeSection] && (
                              <div className="mt-3 p-3 bg-blue-900/30 border border-blue-700 rounded-lg">
                                <p className="text-blue-200 text-sm">
                                  <strong>Explanation:</strong> {question.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Quiz Actions */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="text-sm text-gray-400">
                            {Object.keys(quizAnswers).filter(qId => 
                              currentSection.quiz?.some(q => q.id === qId)
                            ).length} of {currentSection.quiz.length} questions answered
                          </div>
                          
                          <div className="flex space-x-3">
                            {showQuizResults[activeSection] ? (
                              <>
                                <div className="flex items-center space-x-2 text-sm">
                                  {(() => {
                                    const correctCount = currentSection.quiz?.filter(q => 
                                      quizResults[q.id] === true
                                    ).length || 0;
                                    const total = currentSection.quiz?.length || 0;
                                    const percentage = Math.round((correctCount / total) * 100);
                                    
                                    return (
                                      <>
                                        <span className={`${percentage >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
                                          Score: {correctCount}/{total} ({percentage}%)
                                        </span>
                                        {percentage >= 70 && <Award className="w-4 h-4 text-yellow-400" />}
                                      </>
                                    );
                                  })()}
                                </div>
                                <button
                                  onClick={() => resetQuiz(activeSection, currentSection.quiz!)}
                                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  <span>Retry Quiz</span>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => submitQuiz(activeSection, currentSection.quiz!)}
                                disabled={Object.keys(quizAnswers).filter(qId => 
                                  currentSection.quiz?.some(q => q.id === qId)
                                ).length !== currentSection.quiz.length}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                              >
                                <Target className="w-4 h-4" />
                                <span>Submit Quiz</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      Section {currentModule?.sections.findIndex(s => s.id === activeSection) + 1} of {currentModule?.sections.length}
                    </div>
                    <div className="flex space-x-3">
                      {currentModule?.sections.findIndex(s => s.id === activeSection) > 0 && (
                        <button
                          onClick={() => {
                            const currentIndex = currentModule.sections.findIndex(s => s.id === activeSection);
                            setActiveSection(currentModule.sections[currentIndex - 1].id);
                          }}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                        >
                          Previous Section
                        </button>
                      )}
                      {currentModule?.sections.findIndex(s => s.id === activeSection) < currentModule.sections.length - 1 && (
                        <button
                          onClick={() => {
                            const currentIndex = currentModule.sections.findIndex(s => s.id === activeSection);
                            setActiveSection(currentModule.sections[currentIndex + 1].id);
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                        >
                          Next Section
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug info */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          Step 5: Interactive quizzes added! 🧠🎯 Completed: {completedSections.size} sections
        </div>
      </div>
    </div>
  );
};

export default LearningPage;