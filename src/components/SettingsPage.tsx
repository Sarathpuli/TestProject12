// SettingsPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Smartphone,
  Mail,
  MessageSquare,
  Database,
  Lock,
  Eye,
  Globe
} from 'lucide-react';

interface NotificationToggleProps {
  enabled: boolean;
  onToggle: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({ 
  enabled, 
  onToggle, 
  icon: Icon, 
  title, 
  description 
}) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-700 rounded-lg transition-colors">
    <div className="flex items-center space-x-3">
      <Icon className="w-5 h-5 text-gray-400" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved theme preference
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    priceAlerts: true,
    newsDigest: false,
    marketUpdates: true,
  });

  const [privacy, setPrivacy] = useState({
    shareActivity: false,
    publicProfile: false,
    dataCollection: true,
  });

  const [currency, setCurrency] = useState('USD');
  const [market, setMarket] = useState('US');

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
      document.body.className = 'bg-gray-900 text-white';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'bg-white text-gray-900';
    }
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-6">
          {/* Appearance Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Moon className="w-5 h-5 mr-2" />
              Appearance
            </h2>
            
            <div className="flex items-center justify-between p-4 hover:bg-gray-700 rounded-lg transition-colors">
              <div className="flex items-center space-x-3">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-gray-400">
                    {isDark ? 'Dark mode' : 'Light mode'} - Choose your preferred theme
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  isDark ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </h2>
            
            <div className="space-y-2">
              <NotificationToggle
                enabled={notifications.email}
                onToggle={() => toggleNotification('email')}
                icon={Mail}
                title="Email Notifications"
                description="Receive updates via email"
              />
              <NotificationToggle
                enabled={notifications.push}
                onToggle={() => toggleNotification('push')}
                icon={Smartphone}
                title="Push Notifications"
                description="Get notifications on your device"
              />
              <NotificationToggle
                enabled={notifications.sms}
                onToggle={() => toggleNotification('sms')}
                icon={MessageSquare}
                title="SMS Alerts"
                description="Important alerts via text message"
              />
              <NotificationToggle
                enabled={notifications.priceAlerts}
                onToggle={() => toggleNotification('priceAlerts')}
                icon={Bell}
                title="Price Alerts"
                description="Get notified of significant price changes"
              />
              <NotificationToggle
                enabled={notifications.newsDigest}
                onToggle={() => toggleNotification('newsDigest')}
                icon={Globe}
                title="Daily News Digest"
                description="Daily summary of market news"
              />
              <NotificationToggle
                enabled={notifications.marketUpdates}
                onToggle={() => toggleNotification('marketUpdates')}
                icon={Bell}
                title="Market Updates"
                description="Real-time market opening/closing updates"
              />
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Privacy & Security
            </h2>
            
            <div className="space-y-2">
              <NotificationToggle
                enabled={privacy.shareActivity}
                onToggle={() => togglePrivacy('shareActivity')}
                icon={Eye}
                title="Share Activity"
                description="Allow others to see your trading activity"
              />
              <NotificationToggle
                enabled={privacy.publicProfile}
                onToggle={() => togglePrivacy('publicProfile')}
                icon={Globe}
                title="Public Profile"
                description="Make your profile visible to other users"
              />
              <NotificationToggle
                enabled={privacy.dataCollection}
                onToggle={() => togglePrivacy('dataCollection')}
                icon={Database}
                title="Analytics & Improvement"
                description="Help improve our service with anonymous usage data"
              />
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors flex items-center">
                <Lock className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                </div>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors flex items-center mt-2">
                <Database className="w-5 h-5 mr-3 text-gray-400" />
                <div>
                  <p className="font-medium">Download Your Data</p>
                  <p className="text-sm text-gray-400">Export your account data and activity</p>
                </div>
              </button>
            </div>
          </div>

          {/* App Preferences */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">App Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Market</label>
                <select 
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="US">US Markets</option>
                  <option value="EU">European Markets</option>
                  <option value="ASIA">Asian Markets</option>
                  <option value="ALL">All Markets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Advanced</h2>
            
            <div className="space-y-3">
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <p className="font-medium">API Configuration</p>
                <p className="text-sm text-gray-400">Manage your API keys and data sources</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <p className="font-medium">Export Settings</p>
                <p className="text-sm text-gray-400">Backup your settings and preferences</p>
              </button>
              <button className="w-full text-left p-3 hover:bg-gray-700 rounded-lg transition-colors">
                <p className="font-medium">Reset to Defaults</p>
                <p className="text-sm text-gray-400">Restore all settings to default values</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;