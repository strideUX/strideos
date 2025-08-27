// Error monitoring service integration
// This module provides a unified interface for error tracking services like Sentry, LogRocket, etc.

export interface ErrorEvent {
  id: string;
  message: string;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
  session?: {
    id: string;
    startTime: Date;
  };
  breadcrumbs: Breadcrumb[];
  tags: Record<string, string>;
  extra: Record<string, any>;
}

export interface ErrorContext {
  operation: string;
  component?: string;
  page?: string;
  action?: string;
  userId?: string;
  projectId?: string;
  documentId?: string;
  metadata?: Record<string, any>;
}

export interface Breadcrumb {
  message: string;
  category: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  timestamp: Date;
  data?: Record<string, any>;
}

export interface ErrorMonitoringConfig {
  service: 'sentry' | 'logrocket' | 'custom' | 'none';
  dsn?: string;
  environment: string;
  release?: string;
  debug?: boolean;
  enableBreadcrumbs?: boolean;
  enableUserTracking?: boolean;
  enablePerformanceTracking?: boolean;
  sampleRate?: number;
  maxBreadcrumbs?: number;
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
  beforeBreadcrumb?: (breadcrumb: Breadcrumb) => Breadcrumb | null;
}

export interface ErrorMonitoringService {
  init(config: ErrorMonitoringConfig): void;
  captureException(error: Error, context?: Partial<ErrorContext>): string;
  captureMessage(message: string, context?: Partial<ErrorContext>): string;
  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void;
  setUser(user: { id: string; email?: string; name?: string }): void;
  setTag(key: string, value: string): void;
  setExtra(key: string, value: any): void;
  setContext(name: string, context: Record<string, any>): void;
  flush(): Promise<boolean>;
}

// Default configuration
const DEFAULT_CONFIG: ErrorMonitoringConfig = {
  service: 'none',
  environment: process.env.NODE_ENV || 'development',
  enableBreadcrumbs: true,
  enableUserTracking: true,
  enablePerformanceTracking: false,
  sampleRate: 1.0,
  maxBreadcrumbs: 100,
};

class ErrorMonitoringManager implements ErrorMonitoringService {
  private config: ErrorMonitoringConfig = DEFAULT_CONFIG;
  private service: ErrorMonitoringService | null = null;
  private breadcrumbs: Breadcrumb[] = [];
  private user: { id: string; email?: string; name?: string } | null = null;
  private tags: Record<string, string> = {};
  private extra: Record<string, any> = {};
  private context: Record<string, any> = {};

  init(config: ErrorMonitoringConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (this.config.service === 'none') {
      return;
    }

    try {
      switch (this.config.service) {
        case 'sentry':
          this.service = this.initSentry();
          break;
        case 'logrocket':
          this.service = this.initLogRocket();
          break;
        case 'custom':
          this.service = this.initCustomService();
          break;
        default:
          console.warn(`Unknown error monitoring service: ${this.config.service}`);
      }
    } catch (error) {
      console.error('Failed to initialize error monitoring service:', error);
    }
  }

  private initSentry(): ErrorMonitoringService {
    // Placeholder for Sentry integration
    // In a real implementation, you would import and initialize Sentry here
    return {
      init: () => {},
      captureException: () => 'sentry-event-id',
      captureMessage: () => 'sentry-event-id',
      addBreadcrumb: () => {},
      setUser: () => {},
      setTag: () => {},
      setExtra: () => {},
      setContext: () => {},
      flush: async () => true,
    };
  }

  private initLogRocket(): ErrorMonitoringService {
    // Placeholder for LogRocket integration
    return {
      init: () => {},
      captureException: () => 'logrocket-event-id',
      captureMessage: () => 'logrocket-event-id',
      addBreadcrumb: () => {},
      setUser: () => {},
      setTag: () => {},
      setExtra: () => {},
      setContext: () => {},
      flush: async () => true,
    };
  }

  private initCustomService(): ErrorMonitoringService {
    // Placeholder for custom error monitoring service
    return {
      init: () => {},
      captureException: () => 'custom-event-id',
      captureMessage: () => 'custom-event-id',
      addBreadcrumb: () => {},
      setUser: () => {},
      setTag: () => {},
      setExtra: () => {},
      setContext: () => {},
      flush: async () => true,
    };
  }

  captureException(error: Error, context?: Partial<ErrorContext>): string {
    const event: ErrorEvent = {
      id: this.generateEventId(),
      message: error.message,
      error,
      context: this.buildContext(context),
      severity: this.determineSeverity(error),
      timestamp: new Date(),
      user: this.user || undefined,
      session: this.getSessionInfo(),
      breadcrumbs: [...this.breadcrumbs],
      tags: { ...this.tags },
      extra: { ...this.extra },
    };

    // Apply beforeSend filter if configured
    if (this.config.beforeSend) {
      const filteredEvent = this.config.beforeSend(event);
      if (!filteredEvent) {
        return 'filtered';
      }
    }

    // Log to console in development
    if (this.config.debug || this.config.environment === 'development') {
      console.error('Error Monitoring Event:', event);
    }

    // Send to service if available
    if (this.service) {
      try {
        return this.service.captureException(error, context);
      } catch (serviceError) {
        console.error('Failed to send error to monitoring service:', serviceError);
      }
    }

    // Fallback to local storage for offline scenarios
    this.storeErrorLocally(event);

    return event.id;
  }

  captureMessage(message: string, context?: Partial<ErrorContext>): string {
    const error = new Error(message);
    return this.captureException(error, context);
  }

  addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: new Date(),
    };

    // Apply beforeBreadcrumb filter if configured
    if (this.config.beforeBreadcrumb) {
      const filteredBreadcrumb = this.config.beforeBreadcrumb(fullBreadcrumb);
      if (!filteredBreadcrumb) {
        return;
      }
    }

    // Add to local breadcrumbs
    this.breadcrumbs.push(fullBreadcrumb);
    
    // Limit breadcrumb count
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs!) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs!);
    }

    // Send to service if available
    if (this.service) {
      try {
        this.service.addBreadcrumb(fullBreadcrumb);
      } catch (error) {
        console.error('Failed to add breadcrumb to monitoring service:', error);
      }
    }
  }

  setUser(user: { id: string; email?: string; name?: string }): void {
    this.user = user;
    
    if (this.service) {
      try {
        this.service.setUser(user);
      } catch (error) {
        console.error('Failed to set user in monitoring service:', error);
      }
    }
  }

  setTag(key: string, value: string): void {
    this.tags[key] = value;
    
    if (this.service) {
      try {
        this.service.setTag(key, value);
      } catch (error) {
        console.error('Failed to set tag in monitoring service:', error);
      }
    }
  }

  setExtra(key: string, value: any): void {
    this.extra[key] = value;
    
    if (this.service) {
      try {
        this.service.setExtra(key, value);
      } catch (error) {
        console.error('Failed to set extra in monitoring service:', error);
      }
    }
  }

  setContext(name: string, context: Record<string, any>): void {
    this.context[name] = context;
    
    if (this.service) {
      try {
        this.service.setContext(name, context);
      } catch (error) {
        console.error('Failed to set context in monitoring service:', error);
      }
    }
  }

  async flush(): Promise<boolean> {
    if (this.service) {
      try {
        return await this.service.flush();
      } catch (error) {
        console.error('Failed to flush monitoring service:', error);
        return false;
      }
    }
    return true;
  }

  private generateEventId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private buildContext(context?: Partial<ErrorContext>): ErrorContext {
    return {
      operation: 'unknown',
      ...this.context,
      ...context,
    };
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    // Simple severity determination based on error properties
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      return 'medium';
    }
    if (error.name === 'ValidationError' || error.message.includes('validation')) {
      return 'low';
    }
    if (error.name === 'AuthenticationError' || error.message.includes('auth')) {
      return 'high';
    }
    if (error.name === 'InternalError' || error.message.includes('internal')) {
      return 'critical';
    }
    return 'medium';
  }

  private getSessionInfo() {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('error-monitoring-session');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('error-monitoring-session', sessionId);
    }

    const startTime = sessionStorage.getItem('error-monitoring-session-start');
    if (!startTime) {
      const now = new Date().toISOString();
      sessionStorage.setItem('error-monitoring-session-start', now);
    }

    return {
      id: sessionId,
      startTime: startTime ? new Date(startTime) : new Date(),
    };
  }

  private storeErrorLocally(event: ErrorEvent): void {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('error-monitoring-queue') || '[]');
      storedErrors.push(event);
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50);
      }
      
      localStorage.setItem('error-monitoring-queue', JSON.stringify(storedErrors));
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  // Utility methods
  getStoredErrors(): ErrorEvent[] {
    try {
      return JSON.parse(localStorage.getItem('error-monitoring-queue') || '[]');
    } catch {
      return [];
    }
  }

  clearStoredErrors(): void {
    localStorage.removeItem('error-monitoring-queue');
  }

  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  getTags(): Record<string, string> {
    return { ...this.tags };
  }

  getExtra(): Record<string, any> {
    return { ...this.extra };
  }
}

// Export singleton instance
export const errorMonitoring = new ErrorMonitoringManager();

// Export types and utilities
export type { ErrorEvent, ErrorContext, Breadcrumb, ErrorMonitoringConfig, ErrorMonitoringService };

// Convenience functions
export function captureException(error: Error, context?: Partial<ErrorContext>): string {
  return errorMonitoring.captureException(error, context);
}

export function captureMessage(message: string, context?: Partial<ErrorContext>): string {
  return errorMonitoring.captureMessage(message, context);
}

export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  errorMonitoring.addBreadcrumb(breadcrumb);
}

export function setUser(user: { id: string; email?: string; name?: string }): void {
  errorMonitoring.setUser(user);
}

export function setTag(key: string, value: string): void {
  errorMonitoring.setTag(key, value);
}

export function setExtra(key: string, value: any): void {
  errorMonitoring.setExtra(key, value);
}

export function setContext(name: string, context: Record<string, any>): void {
  errorMonitoring.setContext(name, context);
}

// Performance monitoring integration
export function startPerformanceSpan(name: string, operation: string): PerformanceSpan {
  return new PerformanceSpan(name, operation);
}

class PerformanceSpan {
  private name: string;
  private operation: string;
  private startTime: number;
  private tags: Record<string, string> = {};

  constructor(name: string, operation: string) {
    this.name = name;
    this.operation = operation;
    this.startTime = performance.now();
  }

  setTag(key: string, value: string): this {
    this.tags[key] = value;
    return this;
  }

  finish(): void {
    const duration = performance.now() - this.startTime;
    
    // Add performance breadcrumb
    addBreadcrumb({
      message: `Performance: ${this.name}`,
      category: 'performance',
      level: 'info',
      data: {
        operation: this.operation,
        duration: Math.round(duration),
        tags: this.tags,
      },
    });

    // Log slow operations
    if (duration > 1000) {
      addBreadcrumb({
        message: `Slow operation detected: ${this.name}`,
        category: 'performance',
        level: 'warning',
        data: {
          operation: this.operation,
          duration: Math.round(duration),
          threshold: 1000,
        },
      });
    }
  }
}
