'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface PageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
}

export class PageErrorBoundary extends React.Component<PageErrorBoundaryProps, PageErrorBoundaryState> {
  constructor(props: PageErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId()
    };
  }

  private generateErrorId(): string {
    return `page-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): PageErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `page-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with comprehensive context
    console.error('PageErrorBoundary caught:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      pageName: this.props.pageName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // TODO: Send to error monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Placeholder for error monitoring service integration
    // This would typically send to Sentry, LogRocket, or similar
    try {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.log('Error logged to monitoring service:', this.state.errorId);
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
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

      return <PageErrorFallback 
        error={this.state.error} 
        reset={this.reset}
        pageName={this.props.pageName}
        errorId={this.state.errorId}
      />;
    }

    return this.props.children;
  }
}

interface PageErrorFallbackProps {
  error: Error;
  reset: () => void;
  pageName?: string;
  errorId: string;
}

function PageErrorFallback({ error, reset, pageName, errorId }: PageErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleRetry = () => {
    reset();
  };

  const isNetworkError = error.message.includes('network') || 
                        error.message.includes('fetch') || 
                        error.message.includes('timeout');

  const isAuthError = error.message.includes('unauthorized') || 
                     error.message.includes('forbidden') || 
                     error.message.includes('authentication');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            {pageName ? `We encountered an error while loading ${pageName}` : 'We encountered an unexpected error'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details */}
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              {isNetworkError && "It looks like there's a connection issue. Please check your internet connection and try again."}
              {isAuthError && "You may need to sign in again or refresh your session."}
              {!isNetworkError && !isAuthError && "An unexpected error occurred. Our team has been notified."}
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

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleGoBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
            </div>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact support with error ID: {errorId}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
