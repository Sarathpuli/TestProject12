import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Download, 
  Edit, 
  X, 
  Check, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react';

// Types
interface Subscription {
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  nextBilling: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
}

interface BillingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoice: string;
  description: string;
}

// Modal Component
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmStyle?: string;
}> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", confirmStyle = "bg-red-600 hover:bg-red-700" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
          <p className="text-gray-300 mb-6">{message}</p>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 text-white px-4 py-2 rounded-lg transition-colors ${confirmStyle}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Success Toast Component
const SuccessToast: React.FC<{ message: string; isVisible: boolean; onClose: () => void }> = ({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
      <Check className="w-5 h-5" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 text-green-200 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Main Component
export default function StandaloneBillingPage() {
  // State management
  const [subscription, setSubscription] = useState<Subscription>({
    plan: 'Pro',
    status: 'active',
    nextBilling: '2025-06-28',
    amount: 5.99,
    billingCycle: 'monthly'
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [billingAddress, setBillingAddress] = useState<BillingAddress>({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([
    { id: '1', date: '2024-03-15', amount: 5.99, status: 'paid', invoice: 'INV-001', description: 'Pro Monthly Subscription' },
    { id: '2', date: '2024-02-15', amount: 5.99, status: 'paid', invoice: 'INV-002', description: 'Pro Monthly Subscription' },
    { id: '3', date: '2024-01-15', amount: 5.99, status: 'paid', invoice: 'INV-003', description: 'Pro Monthly Subscription' },
  ]);

  // Modal states
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: ''
  });

  const [editedAddress, setEditedAddress] = useState(billingAddress);

  // Auto-refresh billing data and update next billing
  useEffect(() => {
    const interval = setInterval(() => {
      // Update next billing date in real-time if subscription is active
      if (subscription.status === 'active') {
        const today = new Date();
        const nextBilling = new Date(subscription.nextBilling);
        
        // If next billing date has passed, calculate new one
        if (today >= nextBilling) {
          let newNextBilling;
          if (subscription.billingCycle === 'monthly') {
            newNextBilling = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          } else {
            newNextBilling = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          }
          
          setSubscription(prev => ({
            ...prev,
            nextBilling: newNextBilling.toISOString().split('T')[0]
          }));
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [subscription.status, subscription.nextBilling, subscription.billingCycle]);

  // Show success message helper
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  // Handlers
  const handlePlanChange = async (newPlan: string, cycle: 'monthly' | 'yearly') => {
    setIsLoading(true);
    try {
      // Faster response time
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newAmount = newPlan === 'Pro' ? (cycle === 'yearly' ? 70.00 : 5.99) : 0;
      const today = new Date();
      let nextBilling;
      
      if (cycle === 'monthly') {
        nextBilling = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      } else {
        nextBilling = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      }
      
      setSubscription(prev => ({
        ...prev,
        plan: newPlan,
        billingCycle: cycle,
        amount: newAmount,
        status: 'active', // Reactivate if cancelled
        nextBilling: nextBilling.toISOString().split('T')[0]
      }));
      
      setShowPlanModal(false);
      setError(null);
      showSuccessMessage(`Successfully updated to ${newPlan} ${cycle} plan!`);
    } catch (err) {
      setError('Failed to update subscription plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubscription(prev => ({ ...prev, status: 'cancelled' }));
      setError(null);
      showSuccessMessage('Subscription cancelled successfully. You can reactivate anytime.');
    } catch (err) {
      setError('Failed to cancel subscription. Please contact support.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setShowPaymentModal(false);
      setError(null);
      showSuccessMessage('Payment method updated successfully!');
    } catch (err) {
      setError('Failed to update payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.cardNumber || !newPaymentMethod.expiryMonth || !newPaymentMethod.expiryYear || !newPaymentMethod.cvv || !newPaymentMethod.name) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: 'visa', // Would detect from card number
        last4: newPaymentMethod.cardNumber.slice(-4),
        expiryMonth: newPaymentMethod.expiryMonth,
        expiryYear: newPaymentMethod.expiryYear,
        isDefault: paymentMethods.length === 0
      };
      
      setPaymentMethods(prev => [...prev, newCard]);
      setNewPaymentMethod({ cardNumber: '', expiryMonth: '', expiryYear: '', cvv: '', name: '' });
      setShowAddPaymentModal(false);
      setError(null);
      showSuccessMessage('Payment method added successfully!');
    } catch (err) {
      setError('Failed to add payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setBillingAddress(editedAddress);
      setShowAddressModal(false);
      setError(null);
      showSuccessMessage('Billing address updated successfully!');
    } catch (err) {
      setError('Failed to update billing address. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      setError(null);
      showSuccessMessage('Payment method removed successfully!');
    } catch (err) {
      setError('Failed to delete payment method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a fake download
      const element = document.createElement('a');
      element.href = `data:text/plain;charset=utf-8,Invoice ${invoiceId} - Downloaded successfully`;
      element.download = `invoice-${invoiceId}.pdf`;
      element.click();
      
      setError(null);
      showSuccessMessage(`Invoice ${invoiceId} downloaded successfully!`);
    } catch (err) {
      setError('Failed to download invoice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setError(null);
      showSuccessMessage('Data refreshed successfully!');
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      case 'expired': return 'text-yellow-400';
      case 'paid': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCardIcon = (type: string) => {
    return <CreditCard className="w-8 h-8 text-gray-400" />;
  };

  const getDaysUntilBilling = () => {
    const today = new Date();
    const nextBilling = new Date(subscription.nextBilling);
    const diffTime = nextBilling.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => console.log('Go back')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-gray-400">Manage your subscription and payment details</p>
          </div>
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Success Toast */}
        <SuccessToast
          message={successMessage}
          isVisible={showSuccess}
          onClose={() => setShowSuccess(false)}
        />

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Subscription */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Current Subscription</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2 flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                  Plan
                </h3>
                <p className="text-2xl font-bold text-yellow-400">{subscription.plan}</p>
                <p className="text-sm text-gray-400 capitalize">{subscription.billingCycle} billing</p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Next Billing</h3>
                <p className="text-lg font-semibold">{new Date(subscription.nextBilling).toLocaleDateString()}</p>
                <p className="text-sm text-gray-400">
                  ${subscription.amount.toFixed(2)} • {getDaysUntilBilling() > 0 ? `${getDaysUntilBilling()} days` : 'Today'}
                </p>
              </div>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Status</h3>
                <p className={`text-lg font-semibold capitalize ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </p>
                <p className="text-sm text-gray-400">
                  {subscription.status === 'active' ? 'Pro since Mar 2024' : 
                   subscription.status === 'cancelled' ? 'Expires on billing date' : 'Inactive'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowPlanModal(true)}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {subscription.status === 'cancelled' ? 'Reactivate Subscription' : 'Change Plan'}
              </button>
              {subscription.status === 'active' && (
                <button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              )}
              {subscription.status === 'cancelled' && (
                <div className="text-sm text-yellow-400 px-4 py-2 bg-yellow-900 bg-opacity-20 rounded-lg">
                  ⚠️ Subscription will end on {new Date(subscription.nextBilling).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Payment Methods</h2>
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getCardIcon(method.type)}
                    <div>
                      <p className="font-medium flex items-center">
                        {showCardNumber ? `**** **** **** ${method.last4}` : `**** ${method.last4}`}
                        <button
                          onClick={() => setShowCardNumber(!showCardNumber)}
                          className="ml-2 text-gray-400 hover:text-white"
                        >
                          {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires {method.expiryMonth}/{method.expiryYear}
                        {method.isDefault && <span className="ml-2 text-green-400">Default</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {paymentMethods.length > 1 && (
                      <button
                        onClick={() => handleDeletePaymentMethod(method.id)}
                        disabled={isLoading}
                        className="text-red-400 hover:text-red-300 p-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center bg-gray-700 rounded-lg">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No payment methods added yet</p>
                  <button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Add Your First Payment Method
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Billing Address</h2>
              <button
                onClick={() => {
                  setEditedAddress(billingAddress);
                  setShowAddressModal(true);
                }}
                className="text-blue-400 hover:text-blue-300 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
              <MapPin className="w-6 h-6 text-gray-400 mt-1" />
              <div className="flex-1">
                {billingAddress.name ? (
                  <>
                    <p className="font-medium">{billingAddress.name}</p>
                    <p className="text-gray-300">{billingAddress.street}</p>
                    <p className="text-gray-300">{billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}</p>
                    <p className="text-gray-300">{billingAddress.country}</p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-400 mb-4">No billing address added yet</p>
                    <button
                      onClick={() => {
                        setEditedAddress(billingAddress);
                        setShowAddressModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Add Billing Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Billing History</h2>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{new Date(bill.date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-400">{bill.description}</p>
                      <p className="text-xs text-gray-500">Invoice {bill.invoice}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">${bill.amount}</p>
                      <p className={`text-sm capitalize ${getStatusColor(bill.status)}`}>{bill.status}</p>
                    </div>
                    <button
                      onClick={() => downloadInvoice(bill.invoice)}
                      disabled={isLoading}
                      className="text-blue-400 hover:text-blue-300 p-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modals */}
        
        {/* Plan Change Modal */}
        <Modal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title={subscription.status === 'cancelled' ? 'Reactivate Subscription' : 'Change Subscription Plan'}>
          <div className="space-y-4">
            {subscription.status === 'cancelled' && (
              <div className="p-4 bg-green-900 bg-opacity-20 border border-green-700 rounded-lg">
                <p className="text-green-300 text-sm">
                  ✅ Selecting a plan will reactivate your subscription immediately.
                </p>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div
                onClick={() => handlePlanChange('Pro', 'monthly')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  subscription.plan === 'Pro' && subscription.billingCycle === 'monthly' && subscription.status === 'active'
                    ? 'border-yellow-400 bg-yellow-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Pro Monthly</h3>
                    <p className="text-2xl font-bold">$5.99<span className="text-sm text-gray-400">/month</span></p>
                  </div>
                  {subscription.plan === 'Pro' && subscription.billingCycle === 'monthly' && subscription.status === 'active' && (
                    <Check className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </div>
              
              <div
                onClick={() => handlePlanChange('Pro', 'yearly')}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  subscription.plan === 'Pro' && subscription.billingCycle === 'yearly' && subscription.status === 'active'
                    ? 'border-yellow-400 bg-yellow-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Pro Yearly</h3>
                    <p className="text-2xl font-bold">$70.00<span className="text-sm text-gray-400">/year</span></p>
                    <span className="bg-green-600 text-green-100 px-2 py-1 rounded text-xs font-medium">
                      Save 2%
                    </span>
                  </div>
                  {subscription.plan === 'Pro' && subscription.billingCycle === 'yearly' && subscription.status === 'active' && (
                    <Check className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                <span>Updating subscription...</span>
              </div>
            )}
          </div>
        </Modal>

        {/* Add Payment Method Modal */}
        <Modal isOpen={showAddPaymentModal} onClose={() => setShowAddPaymentModal(false)} title="Add Payment Method">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Cardholder Name *</label>
              <input
                type="text"
                value={newPaymentMethod.name}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Card Number *</label>
              <input
                type="text"
                value={formatCardNumber(newPaymentMethod.cardNumber)}
                onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cardNumber: e.target.value.replace(/\s/g, '') }))}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Month *</label>
                <select
                  value={newPaymentMethod.expiryMonth}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryMonth: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">MM</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year *</label>
                <select
                  value={newPaymentMethod.expiryYear}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, expiryYear: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">YYYY</option>
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={String(2024 + i)}>
                      {2024 + i}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">CVV *</label>
                <input
                  type="text"
                  value={newPaymentMethod.cvv}
                  onChange={(e) => setNewPaymentMethod(prev => ({ ...prev, cvv: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
            <button
              onClick={handleAddPaymentMethod}
              disabled={isLoading || !newPaymentMethod.cardNumber || !newPaymentMethod.expiryMonth || !newPaymentMethod.expiryYear || !newPaymentMethod.cvv || !newPaymentMethod.name}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Payment Method'}
            </button>
          </div>
        </Modal>

        {/* Edit Address Modal */}
        <Modal isOpen={showAddressModal} onClose={() => setShowAddressModal(false)} title="Edit Billing Address">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={editedAddress.name}
                onChange={(e) => setEditedAddress(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Street Address *</label>
              <input
                type="text"
                value={editedAddress.street}
                onChange={(e) => setEditedAddress(prev => ({ ...prev, street: e.target.value }))}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  value={editedAddress.city}
                  onChange={(e) => setEditedAddress(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="New York"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State *</label>
                <input
                  type="text"
                  value={editedAddress.state}
                  onChange={(e) => setEditedAddress(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="NY"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                <input
                  type="text"
                  value={editedAddress.zipCode}
                  onChange={(e) => setEditedAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="10001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <select
                  value={editedAddress.country}
                  onChange={(e) => setEditedAddress(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>Australia</option>
                  <option>Japan</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleUpdateAddress}
              disabled={isLoading || !editedAddress.name || !editedAddress.street || !editedAddress.city || !editedAddress.state || !editedAddress.zipCode}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors"
            >
              {isLoading ? 'Updating...' : 'Update Address'}
            </button>
          </div>
        </Modal>

        {/* Cancel Subscription Dialog */}
        <ConfirmDialog
          isOpen={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={handleCancelSubscription}
          title="Cancel Subscription"
          message="Are you sure you want to cancel your subscription? You'll lose access to all Pro features at the end of your current billing period."
          confirmText="Yes, Cancel"
          confirmStyle="bg-red-600 hover:bg-red-700"
        />
      </div>
    </div>
  );
}