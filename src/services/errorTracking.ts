/**
 * Error Tracking Service (Sentry)
 * Centralized error monitoring and reporting
 */

import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const ENV = import.meta.env.MODE;

export const errorTracking = {
  /**
   * Initialize Sentry
   */
  init() {
    if (!SENTRY_DSN) {
      console.warn('Sentry DSN not configured');
      return;
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: ENV,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Performance Monitoring
      tracesSampleRate: ENV === 'production' ? 0.1 : 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter errors
      beforeSend(event, hint) {
        // Don't send errors in development
        if (ENV === 'development') {
          console.error('Sentry would capture:', event, hint);
          return null;
        }

        // Filter out network errors from ad blockers
        if (event.exception?.values?.[0]?.value?.includes('blocked')) {
          return null;
        }

        return event;
      },
    });
  },

  /**
   * Log error
   */
  logError(error: Error, context?: Record<string, any>) {
    if (SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    } else {
      console.error('Error:', error, context);
    }
  },

  /**
   * Log message
   */
  logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    if (SENTRY_DSN) {
      Sentry.captureMessage(message, {
        level,
        contexts: { custom: context },
      });
    } else {
      console[level === 'warning' ? 'warn' : level === 'error' ? 'error' : 'log'](message, context);
    }
  },

  /**
   * Set user context
   */
  setUser(user: { id: string; email?: string; name?: string }) {
    if (SENTRY_DSN) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    }
  },

  /**
   * Clear user context
   */
  clearUser() {
    if (SENTRY_DSN) {
      Sentry.setUser(null);
    }
  },

  /**
   * Add breadcrumb
   */
  addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    if (SENTRY_DSN) {
      Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
      });
    }
  },

  /**
   * Start span for performance monitoring
   */
  startSpan(name: string, op: string, callback: () => void) {
    if (SENTRY_DSN) {
      return Sentry.startSpan({ name, op }, callback);
    }
    callback();
  },
};
