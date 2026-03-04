/**
 * Crash Protection Service
 * Prevents app crashes and handles errors gracefully
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  type: 'error' | 'unhandledRejection' | 'componentError' | 'networkError' | 'syntaxError';
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  recovered: boolean;
}

class CrashProtectionService {
  private errorLogs: ErrorLog[] = [];
  private isInitialized: boolean = false;
  private recoveryAttempts: Map<string, number> = new Map();
  private maxRecoveryAttempts: number = 3;

  /**
   * Initialize crash protection - call this at app startup
   */
  init(): void {
    if (this.isInitialized) return;

    this.setupGlobalErrorHandler();
    this.setupUnhandledRejectionHandler();
    this.setupNetworkErrorHandler();
    this.loadErrorLogs();
    this.isInitialized = true;

  }

  /**
   * Global error handler for uncaught exceptions
   */
  private setupGlobalErrorHandler(): void {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('🚨 Global Error Caught:', message);

      const errorLog = this.createErrorLog({
        type: 'error',
        message: String(message),
        stack: error?.stack,
      });

      this.handleError(errorLog);

      // Prevent default error handling (page crash)
      return true;
    };
  }

  /**
   * Handler for unhandled promise rejections
   */
  private setupUnhandledRejectionHandler(): void {
    window.onunhandledrejection = (event) => {
      console.error('🚨 Unhandled Promise Rejection:', event.reason);

      const errorLog = this.createErrorLog({
        type: 'unhandledRejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });

      this.handleError(errorLog);

      // Prevent default handling
      event.preventDefault();
    };
  }

  /**
   * Handler for network errors
   */
  private setupNetworkErrorHandler(): void {
    window.addEventListener('offline', () => {
      console.warn('📡 Network offline - app will continue in offline mode');
      this.showNotification('You are offline. Some features may be limited.', 'warning');
    });

    window.addEventListener('online', () => {
      this.showNotification('Connection restored!', 'success');
    });
  }

  /**
   * Create error log entry
   */
  private createErrorLog(data: Partial<ErrorLog>): ErrorLog {
    return {
      id: this.generateId(),
      timestamp: new Date(),
      type: data.type || 'error',
      message: data.message || 'Unknown error',
      stack: data.stack,
      componentStack: data.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      recovered: false,
    };
  }

  /**
   * Handle error and attempt recovery
   */
  private handleError(errorLog: ErrorLog): void {
    // Save error log
    this.saveErrorLog(errorLog);

    // Attempt recovery
    const recovered = this.attemptRecovery(errorLog);
    errorLog.recovered = recovered;

    // Show user-friendly notification
    if (!recovered) {
      this.showNotification(
        'Something went wrong, but your data is safe. Try refreshing the page.',
        'error'
      );
    }
  }

  /**
   * Attempt to recover from error
   */
  private attemptRecovery(errorLog: ErrorLog): boolean {
    const errorKey = errorLog.message.substring(0, 50);
    const attempts = this.recoveryAttempts.get(errorKey) || 0;

    if (attempts >= this.maxRecoveryAttempts) {
      console.warn('Max recovery attempts reached for:', errorKey);
      return false;
    }

    this.recoveryAttempts.set(errorKey, attempts + 1);

    // Recovery strategies based on error type
    switch (errorLog.type) {
      case 'networkError':
        return this.recoverFromNetworkError();
      case 'syntaxError':
        return false; // Can't recover from syntax errors
      default:
        return this.recoverFromGenericError();
    }
  }

  /**
   * Recover from network error
   */
  private recoverFromNetworkError(): boolean {
    // Check if we're online
    if (navigator.onLine) {
      return true;
    }
    return false;
  }

  /**
   * Recover from generic error
   */
  private recoverFromGenericError(): boolean {
    // Clear any corrupted state
    try {
      // Don't clear critical data, just temporary state
      sessionStorage.removeItem('temp_state');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save error log to storage
   */
  private saveErrorLog(errorLog: ErrorLog): void {
    this.errorLogs.push(errorLog);

    // Keep only last 100 errors
    if (this.errorLogs.length > 100) {
      this.errorLogs = this.errorLogs.slice(-100);
    }

    try {
      localStorage.setItem('crash_logs', JSON.stringify(this.errorLogs));
    } catch (e) {
      console.warn('Failed to save error log');
    }
  }

  /**
   * Load error logs from storage
   */
  private loadErrorLogs(): void {
    try {
      const stored = localStorage.getItem('crash_logs');
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load error logs');
    }
  }

  /**
   * Show notification to user
   */
  private showNotification(message: string, type: 'success' | 'warning' | 'error'): void {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `crash-protection-toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : '✕'}</span>
      <span class="toast-message">${message}</span>
    `;

    // Add styles if not already added
    this.ensureToastStyles();

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }

  /**
   * Ensure toast styles are added
   */
  private ensureToastStyles(): void {
    if (document.getElementById('crash-protection-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'crash-protection-styles';
    styles.textContent = `
      .crash-protection-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 999999;
        animation: toast-slide-in 0.3s ease;
      }
      .toast-success { background: #10b981; color: white; }
      .toast-warning { background: #f59e0b; color: white; }
      .toast-error { background: #ef4444; color: white; }
      .toast-icon { font-size: 18px; }
      .toast-fade-out { opacity: 0; transition: opacity 0.3s ease; }
      @keyframes toast-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * Get error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Clear error logs
   */
  clearErrorLogs(): void {
    this.errorLogs = [];
    localStorage.removeItem('crash_logs');
  }

  /**
   * Export error logs
   */
  exportErrorLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Safe function wrapper - wraps any function to prevent crashes
   */
  safeCall<T>(fn: () => T, fallback: T, errorMessage?: string): T {
    try {
      return fn();
    } catch (error) {
      console.error(errorMessage || 'Safe call error:', error);
      this.handleError(this.createErrorLog({
        type: 'error',
        message: errorMessage || (error as Error).message,
        stack: (error as Error).stack,
      }));
      return fallback;
    }
  }

  /**
   * Safe async function wrapper
   */
  async safeCallAsync<T>(fn: () => Promise<T>, fallback: T, errorMessage?: string): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(errorMessage || 'Safe async call error:', error);
      this.handleError(this.createErrorLog({
        type: 'error',
        message: errorMessage || (error as Error).message,
        stack: (error as Error).stack,
      }));
      return fallback;
    }
  }

  /**
   * Safe JSON parse
   */
  safeJSONParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  }

  /**
   * Safe localStorage get
   */
  safeStorageGet<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return fallback;
      return JSON.parse(item);
    } catch {
      return fallback;
    }
  }

  /**
   * Safe localStorage set
   */
  safeStorageSet(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      console.warn('Failed to save to localStorage:', key);
      return false;
    }
  }

  /**
   * Check if app is healthy
   */
  isHealthy(): boolean {
    const recentErrors = this.errorLogs.filter(
      log => new Date().getTime() - new Date(log.timestamp).getTime() < 60000
    );
    return recentErrors.length < 5;
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    healthy: boolean;
    recentErrors: number;
    totalErrors: number;
    lastError?: ErrorLog;
  } {
    const recentErrors = this.errorLogs.filter(
      log => new Date().getTime() - new Date(log.timestamp).getTime() < 60000
    );

    return {
      healthy: recentErrors.length < 5,
      recentErrors: recentErrors.length,
      totalErrors: this.errorLogs.length,
      lastError: this.errorLogs[this.errorLogs.length - 1],
    };
  }
}

export const crashProtectionService = new CrashProtectionService();

// Auto-initialize
if (typeof window !== 'undefined') {
  crashProtectionService.init();
}

export default crashProtectionService;
