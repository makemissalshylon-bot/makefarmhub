import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showErrorDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 5;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showErrorDetails: false,
      retryCount: 0,
    };
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    // Reset retry count if error was cleared
    if (prevState.hasError && !this.state.hasError) {
      this.setState({ retryCount: 0 });
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Save error to localStorage for debugging
    this.saveErrorToStorage(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    console.error('🚨 Error Boundary Caught Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry, LogRocket, etc.
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  }

  private saveErrorToStorage(error: Error, errorInfo: ErrorInfo): void {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      const existingLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingLogs.push(errorLog);

      // Keep only last 50 errors
      const trimmedLogs = existingLogs.slice(-50);
      localStorage.setItem('error_logs', JSON.stringify(trimmedLogs));
    } catch (e) {
      console.warn('Failed to save error to storage');
    }
  }

  private handleRetry = (): void => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleRefreshPage = (): void => {
    window.location.reload();
  };

  private toggleErrorDetails = (): void => {
    this.setState(prevState => ({
      showErrorDetails: !prevState.showErrorDetails,
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>

            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              Don't worry, your data is safe. The app encountered an unexpected error.
            </p>

            <div className="error-actions">
              {this.state.retryCount < this.maxRetries && (
                <button className="error-btn primary" onClick={this.handleRetry}>
                  <RefreshCw size={18} />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </button>
              )}

              <button className="error-btn secondary" onClick={this.handleRefreshPage}>
                <RefreshCw size={18} />
                Refresh Page
              </button>

              <button className="error-btn secondary" onClick={this.handleGoHome}>
                <Home size={18} />
                Go to Home
              </button>
            </div>

            {this.props.showDetails !== false && (
              <div className="error-details-section">
                <button
                  className="error-details-toggle"
                  onClick={this.toggleErrorDetails}
                >
                  {this.state.showErrorDetails ? (
                    <>
                      <ChevronUp size={16} />
                      Hide Technical Details
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Show Technical Details
                    </>
                  )}
                </button>

                {this.state.showErrorDetails && (
                  <div className="error-details">
                    <div className="error-detail-item">
                      <strong>Error:</strong>
                      <code>{this.state.error?.message}</code>
                    </div>
                    {this.state.error?.stack && (
                      <div className="error-detail-item">
                        <strong>Stack Trace:</strong>
                        <pre>{this.state.error.stack}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <p className="error-support">
              If this problem persists, please contact support at{' '}
              <a href="mailto:missal@makefarmhub.com">missal@makefarmhub.com</a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
