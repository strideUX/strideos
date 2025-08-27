'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface FormError {
  field?: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  code?: string;
  timestamp: Date;
}

export interface FormErrorState {
  errors: FormError[];
  hasErrors: boolean;
  hasWarnings: boolean;
  hasInfo: boolean;
}

interface FormErrorHandlingProps {
  errors: FormError[];
  onClearErrors?: () => void;
  onRetry?: () => void;
  className?: string;
  showFieldErrors?: boolean;
  showFormSummary?: boolean;
  maxVisibleErrors?: number;
}

export function FormErrorHandling({
  errors,
  onClearErrors,
  onRetry,
  className,
  showFieldErrors = true,
  showFormSummary = true,
  maxVisibleErrors = 5,
}: FormErrorHandlingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  // Group errors by type
  const errorGroups = React.useMemo(() => {
    const groups = {
      errors: errors.filter(e => e.type === 'error' && !dismissedErrors.has(e.field || e.message)),
      warnings: errors.filter(e => e.type === 'warning' && !dismissedErrors.has(e.field || e.message)),
      info: errors.filter(e => e.type === 'info' && !dismissedErrors.has(e.field || e.message)),
    };

    return {
      ...groups,
      hasErrors: groups.errors.length > 0,
      hasWarnings: groups.warnings.length > 0,
      hasInfo: groups.info.length > 0,
    };
  }, [errors, dismissedErrors]);

  // Dismiss individual error
  const dismissError = (error: FormError) => {
    const key = error.field || error.message;
    setDismissedErrors(prev => new Set([...prev, key]));
  };

  // Clear all errors
  const handleClearAll = () => {
    setDismissedErrors(new Set());
    onClearErrors?.();
  };

  // Get visible errors based on expansion state
  const visibleErrors = isExpanded ? errorGroups.errors : errorGroups.errors.slice(0, maxVisibleErrors);
  const hasMoreErrors = errorGroups.errors.length > maxVisibleErrors;

  // Auto-dismiss info messages after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const infoErrors = errors.filter(e => e.type === 'info');
      infoErrors.forEach(error => {
        const key = error.field || error.message;
        setDismissedErrors(prev => new Set([...prev, key]));
      });
    }, 10000);

    return () => clearTimeout(timer);
  }, [errors]);

  if (!errorGroups.hasErrors && !errorGroups.hasWarnings && !errorGroups.hasInfo) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Form-level error summary */}
      {showFormSummary && errorGroups.hasErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Form Submission Failed</AlertTitle>
          <AlertDescription>
            Please correct the following {errorGroups.errors.length} error{errorGroups.errors.length !== 1 ? 's' : ''} and try again.
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2"
              >
                Try Again
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error list */}
      {showFieldErrors && errorGroups.hasErrors && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-destructive">
              Errors ({errorGroups.errors.length})
            </h4>
            <div className="flex items-center space-x-2">
              {hasMoreErrors && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs"
                >
                  {isExpanded ? 'Show Less' : `Show ${errorGroups.errors.length - maxVisibleErrors} More`}
                </Button>
              )}
              {onClearErrors && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {visibleErrors.map((error, index) => (
              <div
                key={`${error.field || 'global'}-${index}`}
                className="flex items-start space-x-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5"
              >
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {error.field && (
                    <p className="text-sm font-medium text-destructive">
                      {error.field}
                    </p>
                  )}
                  <p className="text-sm text-destructive/80">
                    {error.message}
                  </p>
                  {error.code && (
                    <p className="text-xs text-destructive/60 mt-1">
                      Error code: {error.code}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissError(error)}
                  className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {errorGroups.hasWarnings && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-600">
            Warnings ({errorGroups.warnings.length})
          </h4>
          <div className="space-y-2">
            {errorGroups.warnings.map((warning, index) => (
              <div
                key={`warning-${index}`}
                className="flex items-start space-x-2 p-3 rounded-lg border border-amber-200 bg-amber-50"
              >
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {warning.field && (
                    <p className="text-sm font-medium text-amber-800">
                      {warning.field}
                    </p>
                  )}
                  <p className="text-sm text-amber-700">
                    {warning.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissError(warning)}
                  className="h-6 w-6 p-0 text-amber-600/60 hover:text-amber-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info messages */}
      {errorGroups.hasInfo && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-600">
            Information ({errorGroups.info.length})
          </h4>
          <div className="space-y-2">
            {errorGroups.info.map((info, index) => (
              <div
                key={`info-${index}`}
                className="flex items-start space-x-2 p-3 rounded-lg border border-blue-200 bg-blue-50"
              >
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {info.field && (
                    <p className="text-sm font-medium text-blue-800">
                      {info.field}
                    </p>
                  )}
                  <p className="text-sm text-blue-700">
                    {info.message}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissError(info)}
                  className="h-6 w-6 p-0 text-blue-600/60 hover:text-blue-600"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Field-level error display component
interface FieldErrorProps {
  error?: FormError;
  className?: string;
  showIcon?: boolean;
}

export function FieldError({ error, className, showIcon = true }: FieldErrorProps) {
  if (!error) return null;

  return (
    <div className={cn('flex items-center space-x-1 text-sm text-destructive', className)}>
      {showIcon && <AlertTriangle className="h-3 w-3 flex-shrink-0" />}
      <span>{error.message}</span>
    </div>
  );
}

// Form error context for managing errors across components
interface FormErrorContextValue {
  errors: FormError[];
  addError: (error: Omit<FormError, 'timestamp'>) => void;
  addErrors: (errors: Omit<FormError, 'timestamp'>[]) => void;
  clearErrors: () => void;
  clearFieldErrors: (field: string) => void;
  hasFieldError: (field: string) => boolean;
  getFieldErrors: (field: string) => FormError[];
}

const FormErrorContext = React.createContext<FormErrorContextValue | undefined>(undefined);

export function useFormErrors() {
  const context = React.useContext(FormErrorContext);
  if (!context) {
    throw new Error('useFormErrors must be used within a FormErrorProvider');
  }
  return context;
}

interface FormErrorProviderProps {
  children: React.ReactNode;
  initialErrors?: FormError[];
}

export function FormErrorProvider({ children, initialErrors = [] }: FormErrorProviderProps) {
  const [errors, setErrors] = useState<FormError[]>(
    initialErrors.map(error => ({ ...error, timestamp: new Date() }))
  );

  const addError = React.useCallback((error: Omit<FormError, 'timestamp'>) => {
    setErrors(prev => [...prev, { ...error, timestamp: new Date() }]);
  }, []);

  const addErrors = React.useCallback((newErrors: Omit<FormError, 'timestamp'>[]) => {
    setErrors(prev => [...prev, ...newErrors.map(error => ({ ...error, timestamp: new Date() }))]);
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const clearFieldErrors = React.useCallback((field: string) => {
    setErrors(prev => prev.filter(error => error.field !== field));
  }, []);

  const hasFieldError = React.useCallback((field: string) => {
    return errors.some(error => error.field === field);
  }, [errors]);

  const getFieldErrors = React.useCallback((field: string) => {
    return errors.filter(error => error.field === field);
  }, [errors]);

  const value: FormErrorContextValue = {
    errors,
    addError,
    addErrors,
    clearErrors,
    clearFieldErrors,
    hasFieldError,
    getFieldErrors,
  };

  return (
    <FormErrorContext.Provider value={value}>
      {children}
    </FormErrorContext.Provider>
  );
}
