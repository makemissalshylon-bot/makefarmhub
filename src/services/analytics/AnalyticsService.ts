/**
 * AnalyticsService - Performance monitoring, error tracking, and user analytics
 */

// Event types
export type AnalyticsEventType = 
  | 'page_view'
  | 'search'
  | 'listing_view'
  | 'listing_create'
  | 'order_create'
  | 'order_complete'
  | 'message_send'
  | 'user_signup'
  | 'user_login'
  | 'error'
  | 'performance'
  | 'click'
  | 'scroll'
  | 'conversion';

// Analytics event
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  page?: string;
}

// Performance metric
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count';
  timestamp: number;
  page?: string;
}

// Error event
export interface ErrorEvent {
  message: string;
  stack?: string;
  type: 'error' | 'unhandledrejection' | 'network' | 'api';
  timestamp: number;
  page?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// User properties
export interface UserProperties {
  userId?: string;
  role?: string;
  location?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private errorQueue: ErrorEvent[] = [];
  private metricsQueue: PerformanceMetric[] = [];
  private isInitialized: boolean = false;
  private flushInterval: number | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.detectUserAgent();
  }

  /**
   * Initialize analytics
   */
  init(userId?: string): void {
    if (this.isInitialized) return;

    this.userId = userId || null;
    this.isInitialized = true;

    // Setup global error handlers
    this.setupErrorHandlers();

    // Setup performance observer
    this.setupPerformanceObserver();

    // Start flush interval
    this.flushInterval = window.setInterval(() => this.flush(), 30000);

    // Track initial page view
    this.trackPageView();

  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect user agent info
   */
  private detectUserAgent(): void {
    const ua = navigator.userAgent;

    // Device type
    if (/Mobile|Android|iPhone|iPad/.test(ua)) {
      this.userProperties.deviceType = /iPad|Tablet/.test(ua) ? 'tablet' : 'mobile';
    } else {
      this.userProperties.deviceType = 'desktop';
    }

    // Browser
    if (ua.includes('Chrome')) this.userProperties.browser = 'Chrome';
    else if (ua.includes('Firefox')) this.userProperties.browser = 'Firefox';
    else if (ua.includes('Safari')) this.userProperties.browser = 'Safari';
    else if (ua.includes('Edge')) this.userProperties.browser = 'Edge';
    else this.userProperties.browser = 'Other';

    // OS
    if (ua.includes('Windows')) this.userProperties.os = 'Windows';
    else if (ua.includes('Mac')) this.userProperties.os = 'macOS';
    else if (ua.includes('Linux')) this.userProperties.os = 'Linux';
    else if (ua.includes('Android')) this.userProperties.os = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone')) this.userProperties.os = 'iOS';
    else this.userProperties.os = 'Other';
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        type: 'error',
        timestamp: Date.now(),
        page: window.location.pathname,
        userId: this.userId || undefined,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        type: 'unhandledrejection',
        timestamp: Date.now(),
        page: window.location.pathname,
        userId: this.userId || undefined,
      });
    });
  }

  /**
   * Setup performance observer
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    // Observe navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.trackMetric('page_load', navEntry.loadEventEnd - navEntry.startTime, 'ms');
            this.trackMetric('dom_interactive', navEntry.domInteractive - navEntry.startTime, 'ms');
            this.trackMetric('dom_complete', navEntry.domComplete - navEntry.startTime, 'ms');
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      // Observer not supported
    }

    // Observe largest contentful paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackMetric('lcp', lastEntry.startTime, 'ms');
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Observer not supported
    }

    // Observe first input delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          this.trackMetric('fid', fidEntry.processingStart - fidEntry.startTime, 'ms');
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Observer not supported
    }

    // Observe cumulative layout shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.trackMetric('cls', clsValue, 'count');
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Observer not supported
    }
  }

  /**
   * Set user ID
   */
  setUser(userId: string, properties?: Partial<UserProperties>): void {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, ...properties, userId };
  }

  /**
   * Clear user
   */
  clearUser(): void {
    this.userId = null;
    this.userProperties = {};
    this.detectUserAgent();
  }

  /**
   * Track an event
   */
  track(type: AnalyticsEventType, name: string, properties?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      type,
      name,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId || undefined,
      page: window.location.pathname,
    };

    this.eventQueue.push(event);

    // Flush if queue is large
    if (this.eventQueue.length >= 20) {
      this.flush();
    }
  }

  /**
   * Track page view
   */
  trackPageView(page?: string): void {
    this.track('page_view', 'Page View', {
      page: page || window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    });
  }

  /**
   * Track search
   */
  trackSearch(query: string, resultCount: number, filters?: Record<string, unknown>): void {
    this.track('search', 'Search', {
      query,
      resultCount,
      filters,
    });
  }

  /**
   * Track listing view
   */
  trackListingView(listingId: string, listingTitle: string, category: string): void {
    this.track('listing_view', 'Listing View', {
      listingId,
      listingTitle,
      category,
    });
  }

  /**
   * Track conversion
   */
  trackConversion(type: string, value?: number, metadata?: Record<string, unknown>): void {
    this.track('conversion', type, {
      value,
      ...metadata,
    });
  }

  /**
   * Track error
   */
  trackError(error: ErrorEvent): void {
    this.errorQueue.push(error);
    console.error('[Analytics] Error:', error.message);

    // Flush errors immediately
    if (this.errorQueue.length >= 5) {
      this.flush();
    }
  }

  /**
   * Track performance metric
   */
  trackMetric(name: string, value: number, unit: PerformanceMetric['unit']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      page: window.location.pathname,
    };

    this.metricsQueue.push(metric);
  }

  /**
   * Track click
   */
  trackClick(elementId: string, elementType: string, metadata?: Record<string, unknown>): void {
    this.track('click', 'Click', {
      elementId,
      elementType,
      ...metadata,
    });
  }

  /**
   * Flush queued events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0 && this.errorQueue.length === 0 && this.metricsQueue.length === 0) {
      return;
    }

    const payload = {
      events: [...this.eventQueue],
      errors: [...this.errorQueue],
      metrics: [...this.metricsQueue],
      session: {
        id: this.sessionId,
        user: this.userProperties,
      },
    };

    // Clear queues
    this.eventQueue = [];
    this.errorQueue = [];
    this.metricsQueue = [];

    // In production, send to analytics server
    // For now, just log

    // Example: Send to server
    // try {
    //   await fetch('/api/analytics', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(payload),
    //   });
    // } catch (error) {
    //   console.error('[Analytics] Failed to send:', error);
    // }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get queued events count
   */
  getQueueSize(): number {
    return this.eventQueue.length + this.errorQueue.length + this.metricsQueue.length;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
    this.isInitialized = false;
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

export default analytics;
