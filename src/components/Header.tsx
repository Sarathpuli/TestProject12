import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { auth, signOut } from '../firebase';
import { ArrowLeft, LogIn, LogOut, Moon, Sun, UserPlus } from 'lucide-react';

interface HeaderProps {
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const [darkMode, setDarkMode] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    document.body.classList.toggle('bg-gray-900', newMode);
    document.body.classList.toggle('bg-white', !newMode);
  };

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-700">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <ArrowLeft className="w-6 h-6 text-white transform rotate-45" />
          </div>
          <h1 className="text-2xl font-bold">TechInvestorAI</h1>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <Link to="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors">
          Home
        </Link>
        
        <button 
          onClick={toggleTheme}
          className="relative inline-flex items-center cursor-pointer w-11 h-6 rounded-full bg-gray-700"
        >
          <span className="sr-only">Toggle theme</span>
          <div className={`absolute top-0.5 left-0.5 transform transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'} bg-white border rounded-full h-5 w-5 flex items-center justify-center`}>
            {darkMode ? <Moon className="w-3 h-3 text-gray-800" /> : <Sun className="w-3 h-3 text-yellow-500" />}
          </div>
        </button>
        
        {user ? (
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded flex items-center space-x-1 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        ) : (
          <>
            <Link 
              to="/login" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center space-x-1 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>
            <Link 
              to="/signup" 
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center space-x-1 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;