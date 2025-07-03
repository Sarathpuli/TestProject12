// App-Level Error Boundary and Loading Management
import React, { Component, Suspense } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { RefreshCw, AlertTriangle, Home, ArrowLeft } from 'lucide-react';

// Global Error Fallback Component
interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  resetKey?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary,
  resetKey = 'global'
}) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRefresh = () => {
    resetErrorBoundary();
  };

  const handleHardRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl border border-gray-700">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-4">
              We encountered an unexpected error. This might be due to:
            </p>
            <ul className="text-sm text-gray-500 text-left mb-6 space-y-1">
              <li>• API rate limiting (try waiting a minute)</li>
              <li>• Network connectivity issues</li>
              <li>• Temporary server problems</li>
              <li>• Browser cache conflicts</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Try Again</span>
            </button>

            <button
              onClick={handleHardRefresh}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Hard Refresh</span>
            </button>

            <button
              onClick={handleGoHome}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                Error Details (Development)
              </summary>
              <div className="bg-gray-900 p-3 rounded text-xs text-red-400 overflow-auto max-h-32">
                <pre>{error.message}</pre>
                {error.stack && <pre className="mt-2 text-xs">{error.stack}</pre>}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

// Page-Level Error Boundary
interface PageErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  resetKey?: string;
  onError?: (error: Error) => void;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({
  children,
  fallback = ErrorFallback,
  resetKey,
  onError
}) => {
  const handleError = (error: Error, errorInfo: any) => {
    console.error('Page Error:', error, errorInfo);
    onError?.(error);
    
    // Track errors for debugging
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback}
      onError={handleError}
      resetKey={resetKey}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// Loading Wrapper Component
interface LoadingWrapperProps {
  loading: boolean;
  error?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  minHeight?: string;
}

export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  loading,
  error,
  children,
  fallback,
  onRetry,
  minHeight = "200px"
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight }}>
        {fallback || (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6" style={{ minHeight }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Route Error Boundary for specific routes
interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  routeName: string;
}

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ 
  children, 
  routeName 
}) => {
  const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                {routeName} Page Error
              </h2>
              <p className="text-gray-300 mb-4">
                The {routeName.toLowerCase()} page encountered an error and couldn't load properly.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={resetErrorBoundary}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
                
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="text-sm text-gray-400 cursor-pointer">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-400 overflow-auto max-h-40">
                    <pre>{error.message}</pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={CustomErrorFallback}
      onError={(error, errorInfo) => {
        console.error(`${routeName} Route Error:`, error, errorInfo);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// Suspense Loading Component
export const SuspenseLoading: React.FC<{ message?: string }> = ({ 
  message = "Loading page..." 
}) => (
  <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6"></div>
      <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
      <p className="text-gray-400">Please wait while we load the content</p>
    </div>
  </div>
);

// Component Error Boundary for smaller components
interface ComponentErrorBoundaryProps {
  children: React.ReactNode;
  componentName: string;
  fallback?: React.ReactNode;
}

export const ComponentErrorBoundary: React.FC<ComponentErrorBoundaryProps> = ({
  children,
  componentName,
  fallback
}) => {
  const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ resetErrorBoundary }) => (
    fallback || (
      <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-red-400 font-medium">{componentName} Error</p>
            <p className="text-red-300 text-sm">This component failed to load.</p>
          </div>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={ComponentErrorFallback}
      onError={(error) => {
        console.error(`${componentName} Component Error:`, error);
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
};

// Global Loading Context
interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const value = React.useMemo(() => ({
    isLoading,
    setLoading,
    error,
    setError
  }), [isLoading, error]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Export default error boundary
export default PageErrorBoundary;