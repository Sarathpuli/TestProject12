// AccountPage.tsx - Professional Account Management with Pro Integration
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { 
  ArrowLeft, 
  User, 
  Key, 
  Crown, 
  CreditCard, 
  Shield,
  Camera,
  Save,
  Settings,
  Trash2,
  AlertTriangle,
  Mail,
  UserX,
  LogOut
} from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (() => void) | null;
}

interface UserProfile {
  name: string;
  email: string;
  secondaryEmail: string;
  phone: string;
  timezone: string;
  avatar?: string;
  memberSince: string;
  plan: 'free' | 'pro';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  proSince?: string;
  billingInfo?: {
    lastPayment: string;
    nextBilling: string;
    paymentMethod: string;
  };
}

interface Subscription {
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  nextBilling: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
}

// Timezone mapping based on countries
const countryTimezoneMap: { [key: string]: string } = {
  'United States': 'UTC-5 (Eastern Time)',
  'Canada': 'UTC-5 (Eastern Time)',
  'United Kingdom': 'UTC+0 (Greenwich Mean Time)',
  'Australia': 'UTC+10 (Australian Eastern Time)',
  'Germany': 'UTC+1 (Central European Time)',
  'France': 'UTC+1 (Central European Time)',
  'Japan': 'UTC+9 (Japan Standard Time)',
  'India': 'UTC+5:30 (India Standard Time)',
  'China': 'UTC+8 (China Standard Time)',
  'Brazil': 'UTC-3 (Brasília Time)',
  'Mexico': 'UTC-6 (Central Time)',
  'Other': 'UTC+0 (Greenwich Mean Time)'
};

// States/Provinces mapping based on countries
const countryStatesMap: { [key: string]: string[] } = {
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 
    'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 
    'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 
    'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 
    'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ],
  'Canada': [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'Australia': [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 
    'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
  ],
  'Germany': [
    'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 
    'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 
    'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
  ],
  'France': [
    'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 
    'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine', 
    'Occitania', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
  ]
};

// Deactivation Confirmation Modal
const DeactivationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  hasActiveBilling: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading, hasActiveBilling }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-xl font-semibold text-white">Deactivate Account</h3>
          </div>
          
          <div className="space-y-4 mb-6">
            <p className="text-gray-300">
              You will be logged out of the system immediately after deactivation.
            </p>
            
            {hasActiveBilling && (
              <div className="p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
                <p className="text-yellow-200 text-sm">
                  ⚠️ You have an active billing cycle. It will be paused until you reactivate your account.
                </p>
              </div>
            )}
            
            <div className="p-3 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
              <p className="text-blue-200 text-sm">
                📧 A confirmation email will be sent to you. Your account will be automatically reactivated when you log in again.
              </p>
            </div>
            
            <p className="text-sm text-gray-400">
              This action is reversible - simply log in again to reactivate your account.
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Deactivate & Logout'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AccountPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [deactivationLoading, setDeactivationLoading] = useState(false);
  
  // Subscription state - temporarily hardcoded for demo
  const [subscription] = useState<Subscription | null>({
    plan: 'Pro', // Change to 'Free' to test free plan behavior
    status: 'active',
    nextBilling: '2024-04-15',
    amount: 29.99,
    billingCycle: 'monthly'
  });
  const [subscriptionLoading] = useState(false);

  const [formData, setFormData] = useState({
    secondaryEmail: '',
    phone: '',
    timezone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  // Auto-populate timezone when country changes
  useEffect(() => {
    if (formData.address.country && countryTimezoneMap[formData.address.country]) {
      setFormData(prev => ({
        ...prev,
        timezone: countryTimezoneMap[formData.address.country]
      }));
    }
  }, [formData.address.country]);

  // Determine if user has active pro plan
  const hasActivePro = subscription && subscription.plan === 'Pro' && subscription.status === 'active';
  const hasActiveBilling = subscription && ['active', 'past_due'].includes(subscription.status);

  // Get actual user data from Firebase auth
  const user: UserProfile = {
    name: auth.currentUser?.displayName || 'User',
    email: auth.currentUser?.email || '',
    secondaryEmail: '',
    phone: '',
    timezone: '',
    memberSince: 'January 2024',
    plan: hasActivePro ? 'pro' : 'free',
    proSince: hasActivePro ? 'March 2024' : undefined,
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    billingInfo: hasActivePro && subscription ? {
      lastPayment: '2024-03-15',
      nextBilling: subscription.nextBilling,
      paymentMethod: '**** **** **** 4242'
    } : undefined
  };

  // Reset state when country changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, state: '' }
    }));
  }, [formData.address.country]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Phone is mandatory
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }

    // Timezone is mandatory
    if (!formData.timezone.trim()) {
      errors.timezone = 'Timezone is required';
    }

    // Address fields are mandatory
    if (!formData.address.street.trim()) {
      errors['address.street'] = 'Street address is required';
    }
    if (!formData.address.city.trim()) {
      errors['address.city'] = 'City is required';
    }
    if (!formData.address.state.trim()) {
      errors['address.state'] = 'State/Province is required';
    }
    if (!formData.address.zipCode.trim()) {
      errors['address.zipCode'] = 'ZIP/Postal code is required';
    }
    if (!formData.address.country.trim()) {
      errors['address.country'] = 'Country is required';
    }

    // Secondary email validation (optional but if provided, must be valid)
    if (formData.secondaryEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondaryEmail)) {
      errors.secondaryEmail = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setPhotoUploading(true);
    
    try {
      // Create a preview URL for now (in production, you'd upload to storage)
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      
      // In production, you would upload to your storage service here
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user document with the new avatar URL
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          avatar: previewUrl // In production, this would be the actual storage URL
        });
      }
      
      console.log('Photo uploaded successfully');
      alert('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Error uploading photo. Please try again.');
      setAvatarPreview(null);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          secondaryEmail: formData.secondaryEmail,
          phone: formData.phone,
          timezone: formData.timezone,
          address: formData.address
        });
      }
      console.log('Profile updated successfully');
      alert('Profile updated successfully!');
      setIsEditing(false);
      setValidationErrors({});
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert('Password reset email sent! Please check your inbox.');
      navigate('/reset-password-confirmation');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      alert('Error sending password reset email. Please try again.');
    }
  };

  const handleUpgrade = () => {
    navigate('/upgrade-pro');
  };

  const handleBilling = () => {
    navigate('/billing-subscription');
  };

  const handlePrivacySecurity = () => {
    navigate('/privacy-security');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const sendDeactivationEmail = async (userEmail: string) => {
    try {
      // In a real application, this would call your backend API to send the email
      // For now, we'll simulate it
      console.log(`Sending deactivation email to ${userEmail}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Email content would be:
      // Subject: Account Deactivated - TechInvestorAI
      // Body: Your account has been deactivated. It will be automatically activated once you login with your credentials.
      
      console.log('Deactivation email sent successfully');
    } catch (error) {
      console.error('Error sending deactivation email:', error);
      throw error;
    }
  };

  const handleDeactivateAccount = async () => {
    if (!auth.currentUser) return;
    
    setDeactivationLoading(true);
    
    try {
      // Update user document to mark as deactivated
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        accountStatus: 'deactivated',
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: 'user'
      });

      // Pause subscription if active (would integrate with actual billing service)
      if (hasActiveBilling && subscription) {
        // In a real app, this would call your billing service
        console.log('Pausing subscription for deactivated account');
        // await BillingService.updateSubscription(auth.currentUser.uid, {
        //   status: 'paused',
        //   pausedAt: new Date().toISOString()
        // });
      }

      // Send deactivation email
      await sendDeactivationEmail(user.email);

      // Close modal
      setShowDeactivationModal(false);

      // Show success message
      alert('Account deactivated successfully. You will now be logged out.');

      // Sign out user
      await signOut(auth);
      
      // Navigate to login page
      navigate('/login');
      
    } catch (error) {
      console.error('Error deactivating account:', error);
      alert('Error deactivating account. Please try again.');
    } finally {
      setDeactivationLoading(false);
    }
  };

  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile', icon: User, action: null },
    { id: 'billing', label: 'Billing', icon: CreditCard, action: handleBilling },
    { id: 'security', label: 'Security', icon: Shield, action: handlePrivacySecurity },
    { id: 'preferences', label: 'Preferences', icon: Settings, action: handleSettings }
  ];

  const handleTabClick = (tab: TabItem) => {
    if (tab.action) {
      tab.action();
    } else {
      setActiveTab(tab.id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Account Settings</h1>
              <p className="text-gray-400">Manage your profile and account preferences</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {subscriptionLoading ? (
              <div className="px-3 py-1 text-sm rounded-full bg-gray-700 text-gray-300">
                Loading...
              </div>
            ) : (
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                hasActivePro 
                  ? 'bg-yellow-900 text-yellow-400 border border-yellow-700' 
                  : 'bg-gray-700 text-gray-300 border border-gray-600'
              }`}>
                {hasActivePro ? '👑 Pro Member' : '🆓 Free Plan'}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id && !tab.action
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Information */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-semibold">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium px-4 py-2 bg-blue-900 bg-opacity-30 rounded-lg transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
              
              {/* Profile Photo Section */}
              <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    {avatarPreview || user.avatar ? (
                      <img 
                        src={avatarPreview || user.avatar} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center border-4 border-gray-600">
                        <User className="w-10 h-10 text-white" />
                      </div>
                    )}
                    
                    {isEditing && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 p-2 rounded-full transition-colors disabled:opacity-50"
                      >
                        {photoUploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  
                  {isEditing && (
                    <div className="text-center">
                      <p className="text-xs text-gray-400">
                        Click camera to upload photo
                      </p>
                      <p className="text-xs text-gray-500">
                        Max 5MB, JPG/PNG only
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Primary Email</label>
                      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{user.email}</span>
                        <span className="text-xs bg-green-800 text-green-300 px-2 py-1 rounded">Verified</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">This is your login email and cannot be changed</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Secondary Email
                        <span className="text-gray-500 text-xs ml-1">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        value={formData.secondaryEmail}
                        onChange={(e) => handleInputChange('secondaryEmail', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.secondaryEmail ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="secondary@example.com"
                      />
                      {validationErrors.secondaryEmail && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.secondaryEmail}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Phone Number <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.phone ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                      {validationErrors.phone && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Timezone <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          validationErrors.timezone ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select timezone</option>
                        <option value="UTC-5 (Eastern Time)">UTC-5 (Eastern Time)</option>
                        <option value="UTC-6 (Central Time)">UTC-6 (Central Time)</option>
                        <option value="UTC-7 (Mountain Time)">UTC-7 (Mountain Time)</option>
                        <option value="UTC-8 (Pacific Time)">UTC-8 (Pacific Time)</option>
                        <option value="UTC+0 (Greenwich Mean Time)">UTC+0 (Greenwich Mean Time)</option>
                        <option value="UTC+1 (Central European Time)">UTC+1 (Central European Time)</option>
                        <option value="UTC+9 (Japan Standard Time)">UTC+9 (Japan Standard Time)</option>
                        <option value="UTC+5:30 (India Standard Time)">UTC+5:30 (India Standard Time)</option>
                        <option value="UTC+8 (China Standard Time)">UTC+8 (China Standard Time)</option>
                        <option value="UTC-3 (Brasília Time)">UTC-3 (Brasília Time)</option>
                        <option value="UTC+10 (Australian Eastern Time)">UTC+10 (Australian Eastern Time)</option>
                      </select>
                      {validationErrors.timezone && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors.timezone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {isEditing && (
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium mb-4">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Street Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          validationErrors['address.street'] ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your street address"
                      />
                      {validationErrors['address.street'] && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors['address.street']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        City <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          validationErrors['address.city'] ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your city"
                      />
                      {validationErrors['address.city'] && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors['address.city']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        State/Province <span className="text-red-400">*</span>
                      </label>
                      {formData.address.country && countryStatesMap[formData.address.country] ? (
                        <select
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            validationErrors['address.state'] ? 'border-red-500' : 'border-gray-600'
                          }`}
                        >
                          <option value="">Select state/province</option>
                          {countryStatesMap[formData.address.country].map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            validationErrors['address.state'] ? 'border-red-500' : 'border-gray-600'
                          }`}
                          placeholder="Enter your state/province"
                        />
                      )}
                      {validationErrors['address.state'] && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors['address.state']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        ZIP/Postal Code <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.address.zipCode}
                        onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          validationErrors['address.zipCode'] ? 'border-red-500' : 'border-gray-600'
                        }`}
                        placeholder="Enter your ZIP/postal code"
                      />
                      {validationErrors['address.zipCode'] && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors['address.zipCode']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Country <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={formData.address.country}
                        onChange={(e) => handleInputChange('address.country', e.target.value)}
                        className={`w-full px-3 py-2 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          validationErrors['address.country'] ? 'border-red-500' : 'border-gray-600'
                        }`}
                      >
                        <option value="">Select country</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Japan">Japan</option>
                        <option value="India">India</option>
                        <option value="China">China</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Other">Other</option>
                      </select>
                      {validationErrors['address.country'] && (
                        <p className="text-red-400 text-xs mt-1">{validationErrors['address.country']}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setValidationErrors({});
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Changes</span>
                  </button>
                </div>
              )}
            </div>

            {/* Account Actions */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handlePasswordReset}
                  className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <Key className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                    <div className="text-left">
                      <p className="font-medium">Reset Password</p>
                      <p className="text-sm text-gray-400">Send reset email to primary address</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-white" />
                </button>

                {/* Only show upgrade button if user doesn't have active pro */}
                {!hasActivePro && (
                  <button 
                    onClick={handleUpgrade}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-900 to-yellow-800 hover:from-yellow-800 hover:to-yellow-700 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center">
                      <Crown className="w-5 h-5 mr-3 text-yellow-400" />
                      <div className="text-left">
                        <p className="font-medium text-yellow-400">Upgrade to Pro</p>
                        <p className="text-sm text-yellow-300">Unlock premium features</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 rotate-180 text-yellow-400" />
                  </button>
                )}

                <button 
                  onClick={handleBilling}
                  className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                    <div className="text-left">
                      <p className="font-medium">Billing & Subscription</p>
                      <p className="text-sm text-gray-400">Manage payments and billing</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-white" />
                </button>

                <button 
                  onClick={handlePrivacySecurity}
                  className="flex items-center justify-between p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group"
                >
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 mr-3 text-gray-400 group-hover:text-white" />
                    <div className="text-left">
                      <p className="font-medium">Privacy & Security</p>
                      <p className="text-sm text-gray-400">Legal and security settings</p>
                    </div>
                  </div>
                  <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400 group-hover:text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-red-900 bg-opacity-20 border border-red-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
          <p className="text-red-300 mb-4">These actions require careful consideration.</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowDeactivationModal(true)}
              className="w-full flex items-center justify-between p-4 bg-orange-900 bg-opacity-30 hover:bg-orange-900 hover:bg-opacity-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center">
                <UserX className="w-5 h-5 mr-3 text-orange-400" />
                <div className="text-left">
                  <p className="font-medium text-orange-400">Deactivate Account</p>
                  <p className="text-sm text-orange-300">Temporarily deactivate your account (reversible)</p>
                </div>
              </div>
              <LogOut className="w-5 h-5 text-orange-400" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-red-900 bg-opacity-30 hover:bg-red-900 hover:bg-opacity-50 rounded-lg transition-colors group">
              <div className="flex items-center">
                <Trash2 className="w-5 h-5 mr-3 text-red-400" />
                <div className="text-left">
                  <p className="font-medium text-red-400">Delete Account</p>
                  <p className="text-sm text-red-300">Permanently delete your account and all data</p>
                </div>
              </div>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Deactivation Modal */}
        <DeactivationModal
          isOpen={showDeactivationModal}
          onClose={() => setShowDeactivationModal(false)}
          onConfirm={handleDeactivateAccount}
          isLoading={deactivationLoading}
          hasActiveBilling={!!hasActiveBilling}
        />
      </div>
    </div>
  );
};

export default AccountPage;