import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  updateProfile,
  auth, 
  db, 
  doc, 
  setDoc 
} from '../firebase';
import { 
  UserPlus, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User,
  Phone,
  Globe,
  Chrome,
  Facebook,
  Github,
  AlertCircle,
  CheckCircle,
  Shield,
  Check,
  X
} from 'lucide-react';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

// Comprehensive list of countries
const countries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LV', name: 'Latvia' },
  { code: 'EE', name: 'Estonia' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  { code: 'NP', name: 'Nepal' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'RU', name: 'Russia' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'BY', name: 'Belarus' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'OTHER', name: 'Other' }
];

const SignupPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const navigate = useNavigate();

  // Initialize providers
  const googleProvider = new GoogleAuthProvider();
  const facebookProvider = new FacebookAuthProvider();
  const githubProvider = new GithubAuthProvider();

  // Password requirements
  const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const isPasswordValid = passwordRequirements.every(req => req.met);
  const doPasswordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return false;
    }

    if (firstName.trim().length < 2) {
      setError('First name must be at least 2 characters long');
      return false;
    }

    if (!lastName.trim()) {
      setError('Please enter your last name');
      return false;
    }

    if (lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      return false;
    }

    if (!email) {
      setError('Please enter your email address');
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return false;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return false;
    }

    if (!country) {
      setError('Please select your country');
      return false;
    }

    if (!password) {
      setError('Please create a password');
      return false;
    }

    if (!isPasswordValid) {
      setError('Password does not meet security requirements');
      return false;
    }

    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return false;
    }

    if (!acceptTerms) {
      setError('Please accept the Terms and Conditions');
      return false;
    }

    return true;
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile with name
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });
      
      // Create comprehensive user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        country: country,
        createdAt: new Date(),
        emailVerified: false,
        newsletter: newsletter,
        authProvider: 'email',
        portfolio: [],
        preferences: {
          theme: 'dark',
          notifications: true,
          newsletter: newsletter,
          language: 'en',
          timezone: 'UTC'
        },
        profile: {
          displayName: `${firstName.trim()} ${lastName.trim()}`,
          photoURL: userCredential.user.photoURL || null,
          bio: '',
          location: '',
          website: '',
          occupation: '',
          investmentExperience: ''
        },
        contactInfo: {
          primaryEmail: email.toLowerCase(),
          phoneNumber: phoneNumber.trim(),
          country: country,
          preferredContact: 'email'
        },
        accountSettings: {
          twoFactorEnabled: false,
          loginNotifications: true,
          marketingEmails: newsletter,
          securityAlerts: true
        }
      });
      
      // Send email verification
      await sendEmailVerification(userCredential.user);
      
      setSuccess(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      
      // User-friendly error messages
      if (errorMessage.includes('email-already-in-use')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (errorMessage.includes('weak-password')) {
        setError('Password is too weak. Please choose a stronger password.');
      } else if (errorMessage.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to create account. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleSocialSignup = async (provider: GoogleAuthProvider | FacebookAuthProvider | GithubAuthProvider, providerName: string) => {
    setSocialLoading(providerName);
    setError('');
    
    try {
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        // Extract first and last name from display name
        const displayName = result.user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || 'User';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create comprehensive user document in Firestore for social login
        await setDoc(doc(db, "users", result.user.uid), {
          firstName: firstName,
          lastName: lastName,
          fullName: displayName || 'User',
          email: result.user.email || '',
          phoneNumber: '', // Will be empty for social signup
          country: '', // Will be empty for social signup
          createdAt: new Date(),
          emailVerified: result.user.emailVerified,
          authProvider: providerName.toLowerCase(),
          newsletter: newsletter,
          portfolio: [],
          preferences: {
            theme: 'dark',
            notifications: true,
            newsletter: newsletter,
            language: 'en',
            timezone: 'UTC'
          },
          profile: {
            displayName: displayName || 'User',
            photoURL: result.user.photoURL || null,
            bio: '',
            location: '',
            website: '',
            occupation: '',
            investmentExperience: ''
          },
          contactInfo: {
            primaryEmail: result.user.email || '',
            phoneNumber: '', // Can be updated later in profile
            country: '', // Can be updated later in profile
            preferredContact: 'email'
          },
          accountSettings: {
            twoFactorEnabled: false,
            loginNotifications: true,
            marketingEmails: newsletter,
            securityAlerts: true
          }
        }, { merge: true }); // Use merge to avoid overwriting existing data
        
        setSuccess(true);
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to signup with ${providerName}`;
      
      if (errorMessage.includes('popup-closed-by-user')) {
        setError('Signup cancelled. Please try again.');
      } else if (errorMessage.includes('account-exists-with-different-credential')) {
        setError('An account already exists with this email using a different signup method.');
      } else {
        setError(`Failed to signup with ${providerName}. Please try again.`);
      }
    } finally {
      setSocialLoading(null);
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
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
            <p className="text-gray-400 mt-1">Join thousands of investors</p>
          </div>
          <Link 
            to="/" 
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {/* Social Signup Buttons */}
        <div className="space-y-3 mb-6">
          {socialProviders.map((provider) => {
            const IconComponent = provider.icon;
            return (
              <button
                key={provider.name}
                onClick={() => handleSocialSignup(provider.provider, provider.name)}
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
            <span className="px-4 bg-gray-800 text-gray-400">Or signup with email</span>
          </div>
        </div>
        
        {/* Email Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-5">
          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="First name"
                  disabled={loading || socialLoading !== null}
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Last name"
                  disabled={loading || socialLoading !== null}
                />
              </div>
            </div>
          </div>

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

          {/* Phone Number Input */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your phone number"
                disabled={loading || socialLoading !== null}
              />
            </div>
          </div>

          {/* Country Dropdown */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
              Country
            </label>
            <div className="relative">
              <Globe className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                disabled={loading || socialLoading !== null}
              >
                <option value="">Select your country</option>
                {countries.map((country) => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
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
                placeholder="Create a strong password"
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

            {/* Password Requirements */}
            {password && (
              <div className="mt-3 p-3 bg-gray-700/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-2 flex items-center">
                  <Shield className="w-3 h-3 mr-1" />
                  Password Requirements
                </p>
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {req.met ? (
                        <Check className="w-3 h-3 text-green-400 mr-2" />
                      ) : (
                        <X className="w-3 h-3 text-red-400 mr-2" />
                      )}
                      <span className={req.met ? 'text-green-400' : 'text-gray-400'}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password Input */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-gray-700/50 border text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  confirmPassword && doPasswordsMatch 
                    ? 'border-green-500 focus:ring-green-500' 
                    : confirmPassword && !doPasswordsMatch
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-600 focus:ring-blue-500'
                }`}
                placeholder="Confirm your password"
                disabled={loading || socialLoading !== null}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && !doPasswordsMatch && (
              <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
            )}
            {confirmPassword && doPasswordsMatch && (
              <p className="mt-1 text-xs text-green-400 flex items-center">
                <Check className="w-3 h-3 mr-1" />
                Passwords match
              </p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 mt-0.5"
              />
              <span className="ml-2 text-sm text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-blue-400 hover:text-blue-300 underline">
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-300">
                Send me market updates and investment tips
              </span>
            </label>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || socialLoading !== null || !acceptTerms}
            className="w-full p-3 rounded-xl text-white font-medium flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
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
          <div className="mt-4 p-3 bg-green-900/50 border border-green-700 rounded-xl flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-green-300 text-sm">
              <p className="font-medium">Account created successfully!</p>
              <p className="mt-1">Verification email sent. Please check your inbox and verify your email before logging in.</p>
            </div>
          </div>
        )}
        
        {/* Login Link */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;