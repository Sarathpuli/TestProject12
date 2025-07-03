// PrivacySecurityPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, FileText, Download, Bell } from 'lucide-react';

export const PrivacySecurityPage: React.FC = () => {
  const navigate = useNavigate();

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
            <h1 className="text-3xl font-bold">Privacy & Security</h1>
            <p className="text-gray-400">Manage your privacy settings and security preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Privacy Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-gray-400">Make your profile visible to other users</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Activity Sharing</p>
                    <p className="text-sm text-gray-400">Allow others to see your trading activity</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <Lock className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-400">Enable 2FA for extra security</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-400" />
                  <div>
                    <p className="font-medium">Login Sessions</p>
                    <p className="text-sm text-gray-400">Manage active sessions</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Legal Documents */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Legal & Compliance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Privacy Policy</p>
                    <p className="text-sm text-gray-400">How we handle your data</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Terms of Service</p>
                    <p className="text-sm text-gray-400">Platform usage terms</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <Download className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Download Your Data</p>
                    <p className="text-sm text-gray-400">Export all account data</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium">Data Protection</p>
                    <p className="text-sm text-gray-400">GDPR compliance info</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Data Protection Notice */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-4">Data Protection & Privacy</h3>
            <div className="space-y-3 text-blue-200 text-sm">
              <p>• We use enterprise-grade encryption to protect your data</p>
              <p>• Your financial information is never stored on our servers</p>
              <p>• We comply with GDPR, CCPA, and other privacy regulations</p>
              <p>• You have the right to access, modify, or delete your data at any time</p>
              <p>• We never sell your personal information to third parties</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};