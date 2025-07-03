// UpgradeProPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, CreditCard, ArrowLeft, Star } from 'lucide-react';

export const UpgradeProPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const plans = {
    monthly: { price: 29.99, period: 'month', save: '' },
    annual: { price: 299.99, period: 'year', save: 'Save 17%' }
  };

  const proFeatures = [
    'AI-powered stock analysis and insights',
    'Real-time portfolio tracking with live updates',
    'Advanced financial charts and indicators',
    'Priority customer support (24/7)',
    'Export portfolio data to Excel/PDF',
    'Custom alerts and notifications',
    'Advanced screening tools',
    'Unlimited watchlists',
    'Historical data access (10+ years)',
    'Advanced risk analysis tools',
    'Custom dashboard layouts',
    'API access for developers'
  ];

  const handleSubscribe = () => {
    // Integrate with Stripe or your payment processor
    console.log(`Subscribing to ${selectedPlan} plan`);
    // Redirect to payment processor
    navigate('/payment-processing');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Crown className="w-8 h-8 text-yellow-400 mr-3" />
              Upgrade to Pro
            </h1>
            <p className="text-gray-400">Unlock premium features and advanced analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pricing Plans */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">Choose Your Plan</h2>
              
              <div className="space-y-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedPlan === key
                        ? 'border-yellow-400 bg-yellow-900 bg-opacity-20'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold capitalize">{key}</h3>
                        <p className="text-2xl font-bold">
                          ${plan.price}
                          <span className="text-sm text-gray-400">/{plan.period}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        {plan.save && (
                          <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs font-medium">
                            {plan.save}
                          </span>
                        )}
                        <div className={`w-5 h-5 rounded-full mt-2 ${
                          selectedPlan === key ? 'bg-yellow-400' : 'border border-gray-400'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 px-6 py-4 rounded-lg transition-colors flex items-center justify-center space-x-2 font-semibold"
              >
                <CreditCard className="w-5 h-5" />
                <span>Subscribe Now - ${plans[selectedPlan].price}/{plans[selectedPlan].period}</span>
              </button>

              <p className="text-xs text-gray-400 mt-3 text-center">
                Cancel anytime. No long-term commitments.
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <Star className="w-6 h-6 text-yellow-400 mr-2" />
              Pro Features
            </h2>
            
            <div className="space-y-3">
              {proFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <h3 className="font-semibold text-blue-300 mb-2">30-Day Money Back Guarantee</h3>
              <p className="text-sm text-blue-200">
                Try Pro risk-free for 30 days. If you're not satisfied, we'll refund your money.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
