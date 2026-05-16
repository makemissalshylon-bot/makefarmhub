/**
 * Performance Monitoring Utilities
 * Track and measure app performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();

  /**
   * Start measuring
   */
  start(name: string): void {
    this.marks.set(name, performance.now());
  }

  /**
   * End measuring and record
   */
  end(name: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    this.record(name, duration, metadata);
    return duration;
  }

  /**
   * Record metric
   */
  record(name: string, value: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      metadata,
    });

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Measure function execution
   */
  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name, { error: true });
      throw error;
    }
  }

  /**
   * Get metrics
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  /**
   * Get average for metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }

  /**
   * Report summary
   */
  report(): void {
    const names = [...new Set(this.metrics.map(m => m.name))];
    console.group('Performance Report');
    names.forEach(name => {
      const avg = this.getAverage(name);
      const count = this.getMetrics(name).length;
      console.log(`${name}: ${avg.toFixed(2)}ms avg (${count} samples)`);
    });
    console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * Web Vitals tracking
 */

export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    perfMonitor.record('LCP', lastEntry.startTime);
  });
  
  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      const fid = (entry as any).processingStart - entry.startTime;
      perfMonitor.record('FID', fid);
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach(entry => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        perfMonitor.record('CLS', clsValue);
      }
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
}

/**
 * Component render tracker
 */

export function useRenderCount(componentName: string): void {
  if (process.env.NODE_ENV === 'development') {
    const renderCount = React.useRef(0);
    renderCount.current++;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  }
}

/**
 * Debounce helper
 */

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle helper
 */

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure component mount time
 */

export function useMountTime(componentName: string): void {
  React.useEffect(() => {
    perfMonitor.start(`mount:${componentName}`);
    return () => {
      perfMonitor.end(`mount:${componentName}`);
    };
  }, [componentName]);
}

// Auto-track web vitals on load
if (typeof window !== 'undefined') {
  trackWebVitals();
}

// Import React for hooks
import * as React from 'react';
