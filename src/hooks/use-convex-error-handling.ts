'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { 
  handleConvexError, 
  createErrorContext, 
  retryOperation, 
  getRetryConfig,
  type AppError,
  type ErrorContext 
} from '@/lib/error-handling';

interface UseConvexErrorHandlingOptions {
  operationName: string;
  maxRetries?: number;
  retryDelayMs?: number;
  onError?: (error: AppError) => void;
  onSuccess?: () => void;
  autoRetry?: boolean;
}

interface ErrorState {
  hasError: boolean;
  error: AppError | null;
  isRetrying: boolean;
  retryCount: number;
}

interface LoadingState {
  isLoading: boolean;
  isRetrying: boolean;
}

export function useConvexErrorHandling<T = any>(
  options: UseConvexErrorHandlingOptions
) {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    isRetrying: false,
    retryCount: 0,
  });
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isRetrying: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0,
    });
    retryCountRef.current = 0;
  }, []);

  const handleError = useCallback((error: unknown, context?: Partial<ErrorContext>) => {
    const errorContext = createErrorContext(options.operationName, context);
    const appError = handleConvexError(error, errorContext);
    
    setErrorState(prev => ({
      hasError: true,
      error: appError,
      isRetrying: false,
      retryCount: prev.retryCount,
    }));

    // Log the error
    console.error(`Error in ${options.operationName}:`, appError);

    // Call custom error handler if provided
    if (options.onError) {
      options.onError(appError);
    }

    // Auto-retry if enabled and error is retryable
    if (options.autoRetry && appError.retryable) {
      const retryConfig = getRetryConfig(appError.code);
      if (retryConfig.maxRetries > 0) {
        scheduleRetry(appError, retryConfig);
      }
    }

    return appError;
  }, [options.operationName, options.autoRetry, options.onError]);

  const scheduleRetry = useCallback((error: AppError, retryConfig: { maxRetries: number; delayMs: number }) => {
    if (retryCountRef.current >= retryConfig.maxRetries) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    setLoadingState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    retryCountRef.current++;

    // Schedule retry with exponential backoff
    const delay = retryConfig.delayMs * Math.pow(2, retryCountRef.current - 1);
    retryTimeoutRef.current = setTimeout(() => {
      // Retry logic will be handled by the calling function
      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
      }));
      setLoadingState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }, delay);
  }, []);

  const retry = useCallback(async (operation: () => Promise<T>) => {
    if (!errorState.error) return;

    const retryConfig = getRetryConfig(errorState.error.code);
    if (retryConfig.maxRetries === 0) return;

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    setLoadingState(prev => ({
      ...prev,
      isRetrying: true,
    }));

    try {
      const result = await retryOperation(
        operation,
        retryConfig.maxRetries,
        retryConfig.delayMs,
        createErrorContext(options.operationName, { action: 'retry' })
      );

      // Success - clear error state
      clearError();
      setLoadingState(prev => ({
        ...prev,
        isRetrying: false,
      }));

      if (options.onSuccess) {
        options.onSuccess();
      }

      return result;
    } catch (retryError) {
      // Retry failed - update error state
      const newError = handleConvexError(retryError, createErrorContext(options.operationName, { action: 'retry_failed' }));
      
      setErrorState(prev => ({
        hasError: true,
        error: newError,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
      }));

      setLoadingState(prev => ({
        ...prev,
        isRetrying: false,
      }));

      throw retryError;
    }
  }, [errorState.error, options.operationName, options.onSuccess, clearError, handleError]);

  const wrapMutation = useCallback(<TArgs extends any[], TReturn>(
    mutation: (...args: TArgs) => Promise<TReturn>
  ) => {
    return async (...args: TArgs): Promise<TReturn> => {
      setLoadingState(prev => ({ ...prev, isLoading: true }));
      
      try {
        const result = await mutation(...args);
        
        // Success - clear any previous errors
        clearError();
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        
        if (options.onSuccess) {
          options.onSuccess();
        }
        
        return result;
      } catch (error) {
        setLoadingState(prev => ({ ...prev, isLoading: false }));
        throw handleError(error);
      }
    };
  }, [clearError, handleError, options.onSuccess]);

  const wrapQuery = useCallback(<TArgs extends any[], TReturn>(
    query: (...args: TArgs) => TReturn
  ) => {
    return (...args: TArgs): TReturn => {
      try {
        return query(...args);
      } catch (error) {
        handleError(error);
        throw error;
      }
    };
  }, [handleError]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  return {
    // State
    error: errorState.error,
    hasError: errorState.hasError,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    isLoading: loadingState.isLoading,
    isRetrying: loadingState.isRetrying,
    
    // Actions
    clearError,
    retry,
    wrapMutation,
    wrapQuery,
    handleError,
    cleanup,
  };
}

// Hook for mutations with error handling
export function useConvexMutationWithErrorHandling<TArgs extends any[], TReturn>(
  mutation: (...args: TArgs) => Promise<TReturn>,
  options: UseConvexErrorHandlingOptions
) {
  const { wrapMutation, ...errorHandling } = useConvexErrorHandling<TReturn>(options);
  
  const wrappedMutation = wrapMutation(mutation);
  
  return {
    mutate: wrappedMutation,
    ...errorHandling,
  };
}

// Hook for queries with error handling
export function useConvexQueryWithErrorHandling<TArgs extends any[], TReturn>(
  query: (...args: TArgs) => TReturn,
  options: UseConvexErrorHandlingOptions
) {
  const { handleError, clearError, ...errorHandling } = useConvexErrorHandling<TReturn>(options);
  
  // For queries, we need to use Convex's useQuery hook
  // This hook provides the error handling utilities but doesn't wrap the query
  return {
    ...errorHandling,
    // Provide error handling utilities
    handleError,
    clearError,
    // The query function should be used with Convex's useQuery hook
    queryFunction: query,
  };
}
