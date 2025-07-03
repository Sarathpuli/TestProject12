// Updated App.tsx with all new routes
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StockPage from './pages/StockPage';
import AIResponseDetail from './pages/AIResponseDetail';

// Account Management Pages
import { AccountPage } from './components/AccountPage';
import { SettingsPage } from './components/SettingsPage';
import { PasswordResetConfirmation } from './components/PasswordResetConfirmation';
import { UpgradeProPage } from './components/UpgradeProPage';
import BillingSubscriptionPage from './components/BillingSubscriptionPage';
import { PrivacySecurityPage } from './components/PrivacySecurityPage';
import LearningPage from './components/LearningPage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Routes>
          {/* Main Pages */}
          <Route path="/" element={<HomePage user={user} onPortfolioUpdate={function (): void {
            throw new Error('Function not implemented.');
          } } />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/stock/:symbol" element={<StockPage />} />
          <Route path="/ai-response-detail" element={<AIResponseDetail />} />
          
          
          {/* Account Management Routes */}
          <Route path="/account" element={<AccountPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          
          {/* Password Reset Flow */}
          <Route path="/reset-password-confirmation" element={<PasswordResetConfirmation />} />
          
          {/* Pro Upgrade Flow */}
          <Route path="/upgrade-pro" element={<UpgradeProPage />} />
          <Route path="/billing-subscription" element={<BillingSubscriptionPage />} />
          
          {/* Privacy & Security */}
          <Route path="/privacy-security" element={<PrivacySecurityPage />} />
          
          {/* You can add more routes as needed */}
          <Route path="/learning" element={<LearningPage />} />
          {/* <Route path="/payment-processing" element={<PaymentProcessingPage />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;