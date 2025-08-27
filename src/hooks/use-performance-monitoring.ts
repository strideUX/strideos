"use client";

import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fmp: number | null; // First Meaningful Paint
}

interface PerformanceObserver {
  observe: (entry: any) => void;
  disconnect: () => void;
}

/**
 * usePerformanceMonitoring - Hook for monitoring Core Web Vitals and performance metrics
 * 
 * @remarks
 * Provides real-time performance monitoring for:
 * - Core Web Vitals (FCP, LCP, FID, CLS)
 * - Additional metrics (TTFB, FMP)
 * - Custom performance marks and measures
 * 
 * @example
 * ```tsx
 * const { metrics, markPerformance, measurePerformance } = usePerformanceMonitoring();
 * 
 * // Mark a performance point
 * markPerformance('component-mount');
 * 
 * // Measure between two points
 * measurePerformance('component-render', 'component-mount', 'component-ready');
 * ```
 */
export function usePerformanceMonitoring() {
  const metricsRef = useRef<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null,
  });

  const observersRef = useRef<PerformanceObserver[]>([]);

  // Mark a performance point
  const markPerformance = useCallback((name: string) => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }, []);

  // Measure performance between two marks
  const measurePerformance = useCallback((name: string, startMark: string, endMark: string) => {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        const measure = performance.measure(name, startMark, endMark);
        console.log(`Performance measure "${name}":`, measure.duration.toFixed(2), 'ms');
        return measure.duration;
      } catch (error) {
        console.warn(`Failed to measure performance "${name}":`, error);
        return null;
      }
    }
    return null;
  }, []);

  // Get current performance metrics
  const getMetrics = useCallback((): PerformanceMetrics => {
    return { ...metricsRef.current };
  }, []);

  // Report metrics to analytics (placeholder for production implementation)
  const reportMetrics = useCallback((metrics: PerformanceMetrics) => {
    // In production, send to your analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', metrics);
    }
    
    // Example: Send to analytics service
    // analytics.track('performance_metrics', metrics);
  }, []);

  // Setup performance observers
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    // First Contentful Paint
    try {
      const fcpObserver = new (window as any).PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metricsRef.current.fcp = lastEntry.startTime;
          reportMetrics(metricsRef.current);
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observers.push(fcpObserver);
    } catch (error) {
      console.warn('FCP observer failed:', error);
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new (window as any).PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metricsRef.current.lcp = lastEntry.startTime;
          reportMetrics(metricsRef.current);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer failed:', error);
    }

    // First Input Delay
    try {
      const fidObserver = new (window as any).PerformanceObserver((list: any) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          metricsRef.current.fid = entry.processingStart - entry.startTime;
          reportMetrics(metricsRef.current);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      observers.push(fidObserver);
    } catch (error) {
      console.warn('FID observer failed:', error);
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new (window as any).PerformanceObserver((list: any) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        metricsRef.current.cls = clsValue;
        reportMetrics(metricsRef.current);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer failed:', error);
    }

    // Store observers for cleanup
    observersRef.current = observers;

    // Get TTFB from navigation timing
    if ('navigation' in performance) {
      const navigation = (performance as any).navigation;
      if (navigation.timing) {
        const timing = navigation.timing;
        metricsRef.current.ttfb = timing.responseStart - timing.requestStart;
      }
    }

    // Get FMP (approximation using paint timing)
    const paintEntries = performance.getEntriesByType('paint');
    const fmpEntry = paintEntries.find(entry => entry.name === 'first-paint');
    if (fmpEntry) {
      metricsRef.current.fmp = fmpEntry.startTime;
    }

    // Cleanup function
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Failed to disconnect observer:', error);
        }
      });
    };
  }, [reportMetrics]);

  // Get performance budget status
  const getBudgetStatus = useCallback(() => {
    const metrics = metricsRef.current;
    const budget = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100,  // 100ms
      cls: 0.1,  // 0.1
    };

    return {
      fcp: metrics.fcp ? metrics.fcp <= budget.fcp : null,
      lcp: metrics.lcp ? metrics.lcp <= budget.lcp : null,
      fid: metrics.fid ? metrics.fid <= budget.fid : null,
      cls: metrics.cls ? metrics.cls <= budget.cls : null,
    };
  }, []);

  return {
    metrics: getMetrics(),
    markPerformance,
    measurePerformance,
    getBudgetStatus,
    reportMetrics,
  };
}

/**
 * usePageLoadPerformance - Hook for monitoring page load performance
 */
export function usePageLoadPerformance() {
  const { markPerformance, measurePerformance } = usePerformanceMonitoring();

  useEffect(() => {
    // Mark page load start
    markPerformance('page-load-start');

    // Mark when page becomes interactive
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        markPerformance('dom-content-loaded');
      });
    } else {
      markPerformance('dom-content-loaded');
    }

    // Mark when page is fully loaded
    if (document.readyState === 'complete') {
      markPerformance('page-load-complete');
    } else {
      window.addEventListener('load', () => {
        markPerformance('page-load-complete');
        measurePerformance('total-page-load', 'page-load-start', 'page-load-complete');
      });
    }
  }, [markPerformance, measurePerformance]);
}
