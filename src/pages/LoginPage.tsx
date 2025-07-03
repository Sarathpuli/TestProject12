import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  auth 
} from '../firebase';
import { 
  LogIn, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  Chrome,
  Facebook,
  Github,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Initialize providers
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const githubProvider = new GithubAuthProvider();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }
      
      setSuccess(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to log in';
      
      // User-friendly error messages
      if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email. Please sign up first.');
      } else if (errorMessage.includes('wrong-password')) {
        setError('Incorrect password. Please try again.');
      } else if (errorMessage.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else if (errorMessage.includes('user-disabled')) {
        setError('This account has been disabled. Please contact support.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: GoogleAuthProvider | FacebookAuthProvider | GithubAuthProvider, providerName: string) => {
    setSocialLoading(providerName);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to login with ${providerName}`;
      
      if (errorMessage.includes('popup-closed-by-user')) {
        setError('Login cancelled. Please try again.');
      } else if (errorMessage.includes('account-exists-with-different-credential')) {
        setError('An account already exists with this email using a different login method.');
      } else {
        setError(`Failed to login with ${providerName}. Please try again.`);
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      
      if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email address.');
      } else {
        setError('Failed to send reset email. Please try again.');
      }
    }
  };

  const socialProviders = [
    {
      name: 'Google',
      provider: googleProvider,
      icon: Chrome,
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-white'
    },
    {
      name: 'Facebook',
      provider: facebookProvider,
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      name: 'GitHub',
      provider: githubProvider,
      icon: Github,
      color: 'bg-gray-700 hover:bg-gray-800',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
            <p className="text-gray-400 mt-1">Sign in to your account</p>
          </div>
          <Link 
            to="/" 
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          {socialProviders.map((provider) => {
            const IconComponent = provider.icon;
            return (
              <button
                key={provider.name}
                onClick={() => handleSocialLogin(provider.provider, provider.name)}
                disabled={socialLoading !== null || loading}
                className={`w-full p-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-all ${provider.color} ${provider.textColor} disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02]`}
              >
                {socialLoading === provider.name ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <IconComponent className="w-5 h-5" />
                    <span>Continue with {provider.name}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-800 text-gray-400">Or continue with email</span>
          </div>
        </div>
        
        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={loading || socialLoading !== null}
              />
            </div>
          </div>
          
          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={loading || socialLoading !== null}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-300">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Forgot password?
            </button>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || socialLoading !== null}
            className="w-full p-3 rounded-xl text-white font-medium flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-xl flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-xl flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300 text-sm">Login successful! Redirecting...</p>
          </div>
        )}

        {resetEmailSent && (
          <div className="mt-4 p-3 bg-blue-900/50 border border-blue-700 rounded-xl flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-sm">Password reset email sent! Check your inbox.</p>
          </div>
        )}
        
        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create Account
          </Link>
        </p>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;