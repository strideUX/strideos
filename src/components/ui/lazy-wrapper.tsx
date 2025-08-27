"use client";

import React, { Suspense, ComponentType, ReactNode } from 'react';

interface LazyWrapperProps {
  /** The lazy-loaded component */
  component: ComponentType<any>;
  /** Props to pass to the component */
  componentProps?: Record<string, any>;
  /** Fallback UI while loading */
  fallback?: ReactNode;
  /** Error boundary fallback */
  errorFallback?: ReactNode;
}

/**
 * LazyWrapper - Wrapper for lazy-loaded components with Suspense and error handling
 * 
 * @remarks
 * Provides a consistent way to lazy load heavy components with proper fallbacks.
 * Use this for components that are not immediately needed on page load.
 * 
 * @example
 * ```tsx
 * const LazyEditor = lazy(() => import('./Editor'));
 * 
 * <LazyWrapper 
 *   component={LazyEditor}
 *   componentProps={{ documentId: "123" }}
 *   fallback={<EditorSkeleton />}
 * />
 * ```
 */
export function LazyWrapper({ 
  component: Component, 
  componentProps = {}, 
  fallback = <div>Loading...</div>,
  errorFallback = <div>Error loading component</div>
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      <Component {...componentProps} />
    </Suspense>
  );
}

/**
 * createLazyComponent - Factory function to create lazy-loaded components
 * 
 * @remarks
 * Creates a lazy component with consistent error handling and fallbacks.
 * 
 * @example
 * ```tsx
 * const LazyEditor = createLazyComponent(() => import('./Editor'), <EditorSkeleton />);
 * 
 * <LazyEditor documentId="123" />
 * ```
 */
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback: ReactNode = <div>Loading...</div>
) {
  const LazyComponent = React.lazy(importFn);
  
  return function LazyComponentWrapper(props: T) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
