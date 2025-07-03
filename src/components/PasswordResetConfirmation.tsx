// PasswordResetConfirmation.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react';

export const PasswordResetConfirmation: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Password Reset Email Sent</h1>
        <div className="space-y-4 text-gray-300">
          <p>We've sent a password reset link to your email address.</p>
          <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-4 rounded-lg">
            <Mail className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <p className="text-sm">Check your inbox and follow the instructions to reset your password.</p>
          </div>
          <p className="text-sm text-gray-400">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        </div>
        <button
          onClick={() => navigate('/account')}
          className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Account</span>
        </button>
      </div>
    </div>
  );
};