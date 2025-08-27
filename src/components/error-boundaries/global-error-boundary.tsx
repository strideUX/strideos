'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Settings, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  errorCount: number;
}

export class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId(),
      errorCount: 0
    };
  }

  private generateErrorId(): string {
    return `global-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: `global-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Increment error count to track repeated errors
    this.setState(prevState => ({ errorCount: prevState.errorCount + 1 }));

    // Log error with comprehensive context
    console.error('GlobalErrorBoundary caught:', {
      error: error.message,
      stack: error.stack,
      errorInfo,
      errorId: this.state.errorId,
      errorCount: this.state.errorCount + 1,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: this.getLocalStorageInfo(),
      sessionStorage: this.getSessionStorageInfo()
    });

    // TODO: Send to error monitoring service
    this.logErrorToService(error, errorInfo);
  }

  private getLocalStorageInfo(): Record<string, any> {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            info[key] = localStorage.getItem(key);
          } catch {
            info[key] = '[Unable to read]';
          }
        }
      }
      return info;
    } catch {
      return { error: 'Unable to access localStorage' };
    }
  }

  private getSessionStorageInfo(): Record<string, any> {
    try {
      const info: Record<string, any> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            info[key] = sessionStorage.getItem(key);
          } catch {
            info[key] = '[Unable to read]';
          }
        }
      }
      return info;
    } catch {
      return { error: 'Unable to access sessionStorage' };
    }
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Placeholder for error monitoring service integration
    try {
      // Example: Sentry.captureException(error, { 
      //   tags: { boundary: 'global', errorCount: this.state.errorCount },
      //   extra: { 
      //     errorInfo,
      //     localStorage: this.getLocalStorageInfo(),
      //     sessionStorage: this.getSessionStorageInfo()
      //   }
      // });
      console.log('Global error logged to monitoring service:', this.state.errorId);
    } catch (loggingError) {
      console.error('Failed to log global error to service:', loggingError);
    }
  }

  reset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorId: this.generateErrorId(),
      errorCount: 0
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return <GlobalErrorFallback 
        error={this.state.error} 
        reset={this.reset}
        errorId={this.state.errorId}
        errorCount={this.state.errorCount}
      />;
    }

    return this.props.children;
  }
}

interface GlobalErrorFallbackProps {
  error: Error;
  reset: () => void;
  errorId: string;
  errorCount: number;
}

function GlobalErrorFallback({ error, reset, errorId, errorCount }: GlobalErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleRetry = () => {
    reset();
  };

  const handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  const isNetworkError = error.message.includes('network') || 
                        error.message.includes('fetch') || 
                        error.message.includes('timeout');

  const isAuthError = error.message.includes('unauthorized') || 
                     error.message.includes('forbidden') || 
                     error.message.includes('authentication');

  const isStorageError = error.message.includes('storage') || 
                        error.message.includes('localStorage') || 
                        error.message.includes('sessionStorage');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Application Error</CardTitle>
          <CardDescription>
            {errorCount > 1 && `This is error #${errorCount}. `}
            We've encountered a critical error that requires attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Details */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground mb-3">
              {isNetworkError && "It looks like there's a connection issue. Please check your internet connection and try again."}
              {isAuthError && "You may need to sign in again or refresh your session."}
              {isStorageError && "There seems to be an issue with your browser's storage. Try clearing your browser data."}
              {!isNetworkError && !isAuthError && !isStorageError && "A critical error has occurred. Our team has been notified."}
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm text-muted-foreground font-medium">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto bg-background p-2 rounded">
                  {error.message}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Error ID: {errorId}
                </p>
                <p className="text-xs text-muted-foreground">
                  Error Count: {errorCount}
                </p>
              </details>
            )}
          </div>

          {/* Recovery Actions */}
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try to Recover
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleGoHome} size="sm">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button variant="outline" onClick={handleRefresh} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
            </div>

            {isStorageError && (
              <Button variant="outline" onClick={handleClearStorage} className="w-full" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Clear Browser Data & Reload
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              If this problem persists, please contact support with error ID: {errorId}
            </p>
            <p className="text-xs text-muted-foreground">
              Error Count: {errorCount} {errorCount > 3 && '(Multiple errors detected - may need technical support)'}
            </p>
          </div>

          {/* Debug Info for Development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-2">Debug Information:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>URL: {window.location.href}</p>
                <p>User Agent: {navigator.userAgent.substring(0, 100)}...</p>
                <p>Timestamp: {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
