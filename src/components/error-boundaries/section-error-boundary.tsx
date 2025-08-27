'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName?: string;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  className?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class SectionErrorBoundary extends React.Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `section-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `section-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with section context
    console.error('SectionErrorBoundary caught:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      sectionName: this.props.sectionName,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    // TODO: Send to error monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Placeholder for error monitoring service integration
    try {
      // Example: Sentry.captureException(error, { 
      //   tags: { boundary: 'section', section: this.props.sectionName },
      //   extra: errorInfo 
      // });
      console.log('Section error logged to monitoring service:', this.state.errorId);
    } catch (loggingError) {
      console.error('Failed to log section error to service:', loggingError);
    }
  }

  reset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return <SectionErrorFallback 
        error={this.state.error} 
        reset={this.reset}
        sectionName={this.props.sectionName}
        errorId={this.state.errorId}
        className={this.props.className}
      />;
    }

    return this.props.children;
  }
}

interface SectionErrorFallbackProps {
  error: Error;
  reset: () => void;
  sectionName?: string;
  errorId: string;
  className?: string;
}

function SectionErrorFallback({ error, reset, sectionName, errorId, className }: SectionErrorFallbackProps) {
  const handleRetry = () => {
    reset();
  };

  const isNetworkError = error.message.includes('network') || 
                        error.message.includes('fetch') || 
                        error.message.includes('timeout');

  const isDataError = error.message.includes('data') || 
                     error.message.includes('query') || 
                     error.message.includes('database');

  return (
    <Card className={`${className || ''}`}>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <CardTitle className="text-lg">
          {sectionName ? `${sectionName} Error` : 'Section Error'}
        </CardTitle>
        <CardDescription>
          {isNetworkError && "Connection issue detected"}
          {isDataError && "Data loading problem"}
          {!isNetworkError && !isDataError && "Something went wrong in this section"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Error Message */}
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm text-muted-foreground">
            {isNetworkError && "Please check your connection and try again."}
            {isDataError && "We're having trouble loading the data for this section."}
            {!isNetworkError && !isDataError && "An error occurred while loading this section."}
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                {error.message}
              </pre>
              <p className="text-xs text-muted-foreground mt-1">
                Error ID: {errorId}
              </p>
            </details>
          )}
        </div>

        {/* Action Button */}
        <Button onClick={handleRetry} className="w-full" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Section
        </Button>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground">
          Error ID: {errorId}
        </p>
      </CardContent>
    </Card>
  );
}
