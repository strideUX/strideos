'use client';

import React, { useEffect } from 'react';
import { errorMonitoring, addBreadcrumb, setContext } from '@/lib/error-monitoring';

interface ErrorMonitoringInitializerProps {
  children: React.ReactNode;
}

export function ErrorMonitoringInitializer({ children }: ErrorMonitoringInitializerProps) {
  useEffect(() => {
    // Initialize error monitoring
    errorMonitoring.init({
      service: process.env.NEXT_PUBLIC_ERROR_MONITORING_SERVICE as any || 'none',
      dsn: process.env.NEXT_PUBLIC_ERROR_MONITORING_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      debug: process.env.NODE_ENV === 'development',
      enableBreadcrumbs: true,
      enableUserTracking: true,
      enablePerformanceTracking: true,
      sampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
      maxBreadcrumbs: 100,
      beforeSend: (event) => {
        // Filter out certain errors in production
        if (process.env.NODE_ENV === 'production') {
          // Don't send console errors to monitoring service
          if (event.message.includes('console.error')) {
            return null;
          }
          
          // Don't send network errors for common issues
          if (event.message.includes('Failed to fetch') && event.context.operation === 'api_call') {
            return null;
          }
        }
        
        return event;
      },
      beforeBreadcrumb: (breadcrumb) => {
        // Filter out sensitive information
        if (breadcrumb.data?.password || breadcrumb.data?.token) {
          return null;
        }
        
        return breadcrumb;
      },
    });

    // Set global context
    setContext('app', {
      name: 'strideOS',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      url: typeof window !== 'undefined' ? window.location.origin : undefined,
    });

    // Set user agent tag
    if (typeof window !== 'undefined') {
      setContext('browser', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
      });
    }

    // Add initial breadcrumb
    addBreadcrumb({
      message: 'Application started',
      category: 'app',
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    // Set up global error handlers
    setupGlobalErrorHandlers();

    // Set up performance monitoring
    setupPerformanceMonitoring();

    // Set up unhandled promise rejection handler
    setupUnhandledRejectionHandler();

    // Set up beforeunload handler for cleanup
    setupBeforeUnloadHandler();

  }, []);

  const setupGlobalErrorHandlers = () => {
    if (typeof window === 'undefined') return;

    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Capture error for monitoring
      try {
        const errorMessage = args.map(arg => 
          typeof arg === 'string' ? arg : arg?.message || String(arg)
        ).join(' ');
        
        if (errorMessage && !errorMessage.includes('ErrorBoundary caught:')) {
          addBreadcrumb({
            message: `Console Error: ${errorMessage}`,
            category: 'console',
            level: 'error',
            data: { args: args.map(arg => String(arg)) },
          });
        }
      } catch (e) {
        // Silently fail to avoid infinite loops
      }
    };

    // Override console.warn to capture warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      
      try {
        const warningMessage = args.map(arg => 
          typeof arg === 'string' ? arg : arg?.message || String(arg)
        ).join(' ');
        
        if (warningMessage) {
          addBreadcrumb({
            message: `Console Warning: ${warningMessage}`,
            category: 'console',
            level: 'warning',
            data: { args: args.map(arg => String(arg)) },
          });
        }
      } catch (e) {
        // Silently fail
      }
    };
  };

  const setupPerformanceMonitoring = () => {
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry) {
            addBreadcrumb({
              message: `LCP: ${Math.round(lastEntry.startTime)}ms`,
              category: 'performance',
              level: 'info',
              data: {
                metric: 'LCP',
                value: Math.round(lastEntry.startTime),
                threshold: 2500,
                isSlow: lastEntry.startTime > 2500,
              },
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          if (lastEntry) {
            addBreadcrumb({
              message: `FID: ${Math.round(lastEntry.processingStart - lastEntry.startTime)}ms`,
              category: 'performance',
              level: 'info',
              data: {
                metric: 'FID',
                value: Math.round(lastEntry.processingStart - lastEntry.startTime),
                threshold: 100,
                isSlow: (lastEntry.processingStart - lastEntry.startTime) > 100,
              },
            });
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          
          if (clsValue > 0) {
            addBreadcrumb({
              message: `CLS: ${clsValue.toFixed(3)}`,
              category: 'performance',
              level: 'info',
              data: {
                metric: 'CLS',
                value: clsValue,
                threshold: 0.1,
                isPoor: clsValue > 0.1,
              },
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Failed to setup performance monitoring:', error);
      }
    }

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const duration = entry.duration;
            if (duration > 50) { // 50ms threshold
              addBreadcrumb({
                message: `Long Task: ${Math.round(duration)}ms`,
                category: 'performance',
                level: 'warning',
                data: {
                  metric: 'long-task',
                  duration: Math.round(duration),
                  threshold: 50,
                  startTime: entry.startTime,
                },
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to setup long task monitoring:', error);
      }
    }
  };

  const setupUnhandledRejectionHandler = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      addBreadcrumb({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        category: 'promise',
        level: 'error',
        data: {
          reason: event.reason,
          promise: event.promise,
        },
      });

      // Capture the error
      errorMonitoring.captureException(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          operation: 'unhandled_promise_rejection',
          metadata: {
            reason: event.reason,
            promise: event.promise,
          },
        }
      );
    });
  };

  const setupBeforeUnloadHandler = () => {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      // Flush any pending errors before the page unloads
      errorMonitoring.flush().catch(() => {
        // Silently fail during page unload
      });
    });
  };

  return <>{children}</>;
}
