import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID || 'G-XXXXXXXXXX';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window === 'undefined') return;
  
  // Don't initialize if already done
  if ((window as any).gtag) return;

  // Create script element
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
};

// Track events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track user properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('set', 'user_properties', properties);
};

// Track e-commerce events
export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    items: items,
  });
};

export const trackAddToCart = (item: any) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'add_to_cart', {
    currency: 'USD',
    value: item.price,
    items: [item],
  });
};

export const trackViewItem = (item: any) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'view_item', {
    currency: 'USD',
    value: item.price,
    items: [item],
  });
};

// Search tracking
export const trackSearch = (searchTerm: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'search', {
    search_term: searchTerm,
  });
};

// Login tracking
export const trackLogin = (method: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'login', {
    method: method,
  });
};

// Sign up tracking
export const trackSignUp = (method: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'sign_up', {
    method: method,
  });
};

// React component for automatic page view tracking
export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

// Custom hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackViewItem,
    trackSearch,
    trackLogin,
    trackSignUp,
    setUserProperties,
  };
};
