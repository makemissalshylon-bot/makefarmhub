/**
 * Analytics Service (Google Analytics 4)
 * Track user behavior and application performance
 */


const GA_ID = import.meta.env.VITE_GA_ID;

export const analytics = {
  /**
   * Initialize Google Analytics
   */
  init() {
    if (!GA_ID) {
      console.warn('Google Analytics ID not configured');
      return;
    }

    // Load GA script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      send_page_view: false, // Manual page view tracking
    });

    console.log('Google Analytics initialized');
  },

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }
  },

  /**
   * Track custom event
   */
  event(action: string, category: string, label?: string, value?: number) {
    if (window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
      });
    }
  },

  /**
   * Track user signup
   */
  trackSignup(method: string, role: string) {
    this.event('sign_up', 'engagement', `${method}_${role}`);
  },

  /**
   * Track user login
   */
  trackLogin(method: string) {
    this.event('login', 'engagement', method);
  },

  /**
   * Track listing creation
   */
  trackListingCreated(category: string, price: number) {
    this.event('create_listing', 'listings', category, price);
  },

  /**
   * Track order placement
   */
  trackOrderPlaced(orderId: string, value: number, paymentMethod: string) {
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: orderId,
        value,
        currency: 'USD',
        payment_type: paymentMethod,
      });
    }
  },

  /**
   * Track search
   */
  trackSearch(searchTerm: string, category?: string) {
    this.event('search', 'engagement', `${category || 'all'}: ${searchTerm}`);
  },

  /**
   * Track payment method selection
   */
  trackPaymentMethod(method: string, amount: number) {
    this.event('select_payment_method', 'payments', method, amount);
  },

  /**
   * Track message sent
   */
  trackMessage(recipientRole: string) {
    this.event('send_message', 'messaging', recipientRole);
  },

  /**
   * Track profile update
   */
  trackProfileUpdate(field: string) {
    this.event('update_profile', 'profile', field);
  },

  /**
   * Track error
   */
  trackError(errorType: string, errorMessage: string) {
    this.event('error', 'errors', `${errorType}: ${errorMessage}`);
  },

  /**
   * Track performance metric
   */
  trackPerformance(metric: string, value: number) {
    if (window.gtag) {
      window.gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value),
        event_category: 'performance',
      });
    }
  },

  /**
   * Set user properties
   */
  setUserProperties(userId: string, properties: Record<string, any>) {
    if (window.gtag) {
      window.gtag('config', GA_ID, {
        user_id: userId,
        user_properties: properties,
      });
    }
  },

  /**
   * Track Web Vitals
   */
  trackWebVitals() {
    if ('web-vital' in window || window.performance) {
      // Track Core Web Vitals
      if (typeof window.performance.getEntriesByType === 'function') {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.trackPerformance('LCP', lastEntry.renderTime || lastEntry.loadTime || 0);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.trackPerformance('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.trackPerformance('CLS', clsValue * 1000);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      }
    }
  },
};
