import { ConvexError } from 'convex/values';

// Error types for consistent error handling
export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  context?: Record<string, any>;
  timestamp: string;
}

export interface ErrorContext {
  operation: string;
  userId?: string;
  projectId?: string;
  documentId?: string;
  action?: string;
  metadata?: Record<string, any>;
}

// Error codes for different types of failures
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_LOST: 'CONNECTION_LOST',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Database errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // File errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;

// User-friendly error messages
export const USER_ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.NETWORK_ERROR]: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
  [ERROR_CODES.TIMEOUT_ERROR]: "The request is taking longer than expected. Please try again.",
  [ERROR_CODES.CONNECTION_LOST]: "Your connection was lost. Please refresh the page and try again.",
  [ERROR_CODES.UNAUTHORIZED]: "You need to sign in to access this feature. Please sign in and try again.",
  [ERROR_CODES.FORBIDDEN]: "You don't have permission to perform this action. Please contact your administrator.",
  [ERROR_CODES.SESSION_EXPIRED]: "Your session has expired. Please sign in again.",
  [ERROR_CODES.VALIDATION_ERROR]: "The information you provided is invalid. Please check your input and try again.",
  [ERROR_CODES.CONSTRAINT_VIOLATION]: "This action cannot be completed due to a system constraint. Please try a different approach.",
  [ERROR_CODES.NOT_FOUND]: "The requested item could not be found. It may have been deleted or moved.",
  [ERROR_CODES.DUPLICATE_ENTRY]: "This item already exists. Please use a different name or identifier.",
  [ERROR_CODES.FILE_TOO_LARGE]: "The file is too large. Please choose a smaller file or contact support for assistance.",
  [ERROR_CODES.INVALID_FILE_TYPE]: "This file type is not supported. Please choose a different file format.",
  [ERROR_CODES.UPLOAD_FAILED]: "The file upload failed. Please try again or contact support if the problem persists.",
  [ERROR_CODES.RATE_LIMITED]: "You've made too many requests. Please wait a moment and try again.",
  [ERROR_CODES.INTERNAL_ERROR]: "Something went wrong on our end. Our team has been notified and is working on a fix.",
  [ERROR_CODES.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again or contact support if the problem persists.",
};

// Error severity levels
export const ERROR_SEVERITY = {
  [ERROR_CODES.NETWORK_ERROR]: 'medium' as const,
  [ERROR_CODES.TIMEOUT_ERROR]: 'medium' as const,
  [ERROR_CODES.CONNECTION_LOST]: 'medium' as const,
  [ERROR_CODES.UNAUTHORIZED]: 'high' as const,
  [ERROR_CODES.FORBIDDEN]: 'high' as const,
  [ERROR_CODES.SESSION_EXPIRED]: 'high' as const,
  [ERROR_CODES.VALIDATION_ERROR]: 'low' as const,
  [ERROR_CODES.CONSTRAINT_VIOLATION]: 'medium' as const,
  [ERROR_CODES.NOT_FOUND]: 'low' as const,
  [ERROR_CODES.DUPLICATE_ENTRY]: 'low' as const,
  [ERROR_CODES.FILE_TOO_LARGE]: 'low' as const,
  [ERROR_CODES.INVALID_FILE_TYPE]: 'low' as const,
  [ERROR_CODES.UPLOAD_FAILED]: 'medium' as const,
  [ERROR_CODES.RATE_LIMITED]: 'medium' as const,
  [ERROR_CODES.INTERNAL_ERROR]: 'critical' as const,
  [ERROR_CODES.UNKNOWN_ERROR]: 'high' as const,
};

// Retry configuration for different error types
export const RETRY_CONFIG = {
  [ERROR_CODES.NETWORK_ERROR]: { maxRetries: 3, delayMs: 1000 },
  [ERROR_CODES.TIMEOUT_ERROR]: { maxRetries: 2, delayMs: 2000 },
  [ERROR_CODES.CONNECTION_LOST]: { maxRetries: 3, delayMs: 1500 },
  [ERROR_CODES.RATE_LIMITED]: { maxRetries: 1, delayMs: 5000 },
  [ERROR_CODES.INTERNAL_ERROR]: { maxRetries: 1, delayMs: 3000 },
  [ERROR_CODES.UNKNOWN_ERROR]: { maxRetries: 2, delayMs: 2000 },
} as const;

// Main error handler function
export function handleConvexError(
  error: unknown, 
  context: ErrorContext
): AppError {
  const timestamp = new Date().toISOString();
  
  // Handle Convex-specific errors
  if (error instanceof ConvexError) {
    const convexData = error.data as any;
    
    // Map Convex error codes to our error system
    if (convexData?.code) {
      const errorCode = mapConvexErrorCode(convexData.code);
      return {
        code: errorCode,
        message: error.message,
        userMessage: USER_ERROR_MESSAGES[errorCode] || USER_ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
        severity: ERROR_SEVERITY[errorCode] || 'medium',
        retryable: isRetryable(errorCode),
        context: {
          ...context,
          convexCode: convexData.code,
          convexData,
        },
        timestamp,
      };
    }
  }
  
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      code: ERROR_CODES.NETWORK_ERROR,
      message: error.message,
      userMessage: USER_ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR],
      severity: ERROR_SEVERITY[ERROR_CODES.NETWORK_ERROR],
      retryable: true,
      context,
      timestamp,
    };
  }
  
  // Handle timeout errors
  if (error instanceof Error && error.name === 'TimeoutError') {
    return {
      code: ERROR_CODES.TIMEOUT_ERROR,
      message: error.message,
      userMessage: USER_ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR],
      severity: ERROR_SEVERITY[ERROR_CODES.TIMEOUT_ERROR],
      retryable: true,
      context,
      timestamp,
    };
  }
  
  // Handle authentication errors
  if (error instanceof Error && error.message.includes('unauthorized')) {
    return {
      code: ERROR_CODES.UNAUTHORIZED,
      message: error.message,
      userMessage: USER_ERROR_MESSAGES[ERROR_CODES.UNAUTHORIZED],
      severity: ERROR_SEVERITY[ERROR_CODES.UNAUTHORIZED],
      retryable: false,
      context,
      timestamp,
    };
  }
  
  // Default error handling
  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : String(error),
    userMessage: USER_ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    severity: ERROR_SEVERITY[ERROR_CODES.UNKNOWN_ERROR],
    retryable: false,
    context,
    timestamp,
  };
}

// Map Convex error codes to our error system
function mapConvexErrorCode(convexCode: string): string {
  const codeMap: Record<string, string> = {
    'UNAUTHORIZED': ERROR_CODES.UNAUTHORIZED,
    'FORBIDDEN': ERROR_CODES.FORBIDDEN,
    'VALIDATION_ERROR': ERROR_CODES.VALIDATION_ERROR,
    'NOT_FOUND': ERROR_CODES.NOT_FOUND,
    'DUPLICATE_ENTRY': ERROR_CODES.DUPLICATE_ENTRY,
    'RATE_LIMITED': ERROR_CODES.RATE_LIMITED,
    'INTERNAL_ERROR': ERROR_CODES.INTERNAL_ERROR,
  };
  
  return codeMap[convexCode] || ERROR_CODES.UNKNOWN_ERROR;
}

// Check if an error is retryable
function isRetryable(errorCode: string): boolean {
  return RETRY_CONFIG[errorCode as keyof typeof RETRY_CONFIG] !== undefined;
}

// Get retry configuration for an error
export function getRetryConfig(errorCode: string) {
  return RETRY_CONFIG[errorCode as keyof typeof RETRY_CONFIG] || { maxRetries: 0, delayMs: 0 };
}

// Retry function with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  delayMs: number,
  context: ErrorContext
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Log retry attempt
      console.warn(`Retry attempt ${attempt}/${maxRetries} failed for ${context.operation}:`, error);
      
      // Wait before retrying with exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All retries failed, throw the last error
  throw lastError;
}

// Error logging utility
export function logError(error: AppError, additionalContext?: Record<string, any>) {
  const logData = {
    ...error,
    additionalContext,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', logData);
  }
  
  // TODO: Send to error monitoring service
  // Example: Sentry.captureException(new Error(error.message), { 
  //   tags: { code: error.code, severity: error.severity },
  //   extra: logData 
  // });
  
  // Log to analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'error', {
      error_code: error.code,
      error_severity: error.severity,
      error_operation: error.context?.operation,
    });
  }
}

// Create a user-friendly error message
export function createUserErrorMessage(error: AppError, fallback?: string): string {
  if (error.userMessage) {
    return error.userMessage;
  }
  
  if (fallback) {
    return fallback;
  }
  
  return USER_ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

// Error context builder
export function createErrorContext(
  operation: string,
  options?: Partial<ErrorContext>
): ErrorContext {
  return {
    operation,
    timestamp: new Date().toISOString(),
    ...options,
  };
}
