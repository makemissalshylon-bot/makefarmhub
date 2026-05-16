/**
 * Error State Components
 * Provides user-friendly error displays with recovery actions
 */

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  showHome?: boolean;
  showBack?: boolean;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  error,
  onRetry,
  showHome = true,
  showBack = false,
  variant = 'error',
}: ErrorStateProps) {
  const navigate = useNavigate();

  const colors = {
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  const bgColors = {
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
  };

  return (
    <div className={`${bgColors[variant]} rounded-lg p-8 text-center max-w-md mx-auto`}>
      <AlertTriangle className={`w-16 h-16 ${colors[variant]} mx-auto mb-4`} />
      <h3 className="text-xl font-semibold mb-2 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
      
      {error && process.env.NODE_ENV === 'development' && (
        <details className="text-left mb-4 text-sm">
          <summary className="cursor-pointer text-gray-500 dark:text-gray-400">
            Error Details
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs">
            {typeof error === 'string' ? error : error.message}
            {typeof error === 'object' && error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}

      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        {showHome && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        )}
      </div>
    </div>
  );
}

// Specific error states
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Problem"
      message="Unable to connect to the server. Check your internet connection and try again."
      variant="warning"
      onRetry={onRetry}
    />
  );
}

export function NotFoundError() {
  return (
    <ErrorState
      title="Page Not Found"
      message="The page you're looking for doesn't exist or has been moved."
      variant="info"
      showHome
      showBack
    />
  );
}

export function UnauthorizedError() {
  const navigate = useNavigate();
  
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to view this page. Please log in."
      variant="warning"
      onRetry={() => navigate('/login')}
      showHome
    />
  );
}

export function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Failed to Load Data"
      message="We couldn't load the data you requested. This might be a temporary issue."
      variant="error"
      onRetry={onRetry}
      showHome
    />
  );
}
