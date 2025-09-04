"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePerformanceMonitoring } from '@/hooks/use-performance-monitoring';
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';

/**
 * PerformanceDashboard - Real-time performance monitoring dashboard
 * 
 * @remarks
 * Displays Core Web Vitals and performance metrics in real-time.
 * Shows performance budget status and recommendations.
 * 
 * @example
 * ```tsx
 * <PerformanceDashboard />
 * ```
 */
export function PerformanceDashboard() {
  const { metrics, getBudgetStatus } = usePerformanceMonitoring();
  const budgetStatus = getBudgetStatus();

  const getMetricColor = (value: number | null, threshold: number, isLowerBetter = true) => {
    if (value === null) return 'bg-muted text-muted-foreground';
    
    const isGood = isLowerBetter ? value <= threshold : value >= threshold;
    const isWarning = isLowerBetter ? value <= threshold * 1.5 : value >= threshold * 0.7;
    
    if (isGood) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (isWarning) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getMetricIcon = (value: number | null, threshold: number, isLowerBetter = true) => {
    if (value === null) return <Clock className="w-4 h-4" />;
    
    const isGood = isLowerBetter ? value <= threshold : value >= threshold;
    const isWarning = isLowerBetter ? value <= threshold * 1.5 : value >= threshold * 0.7;
    
    if (isGood) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (isWarning) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const formatMetric = (value: number | null, unit: string) => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}${unit}`;
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (metrics.fcp && metrics.fcp > 1800) {
      recommendations.push('Optimize First Contentful Paint: Reduce render-blocking resources');
    }
    
    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint: Optimize images and critical resources');
    }
    
    if (metrics.fid && metrics.fid > 100) {
      recommendations.push('Reduce First Input Delay: Optimize JavaScript execution');
    }
    
    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift: Set explicit dimensions for images and elements');
    }
    
    return recommendations.length > 0 ? recommendations : ['All metrics are within performance budget!'];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Real-time monitoring
        </Badge>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getMetricIcon(metrics.fcp, 1800)}
              First Contentful Paint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.fcp, 'ms')}
            </div>
            <Badge 
              className={`mt-2 ${getMetricColor(metrics.fcp, 1800)}`}
            >
              {budgetStatus.fcp === null ? 'Pending' : 
               budgetStatus.fcp ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getMetricIcon(metrics.lcp, 2500)}
              Largest Contentful Paint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.lcp, 'ms')}
            </div>
            <Badge 
              className={`mt-2 ${getMetricColor(metrics.lcp, 2500)}`}
            >
              {budgetStatus.lcp === null ? 'Pending' : 
               budgetStatus.lcp ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getMetricIcon(metrics.fid, 100)}
              First Input Delay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.fid, 'ms')}
            </div>
            <Badge 
              className={`mt-2 ${getMetricColor(metrics.fid, 100)}`}
            >
              {budgetStatus.fid === null ? 'Pending' : 
               budgetStatus.fid ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getMetricIcon(metrics.cls, 0.1, false)}
              Cumulative Layout Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.cls, '')}
            </div>
            <Badge 
              className={`mt-2 ${getMetricColor(metrics.cls, 0.1, false)}`}
            >
              {budgetStatus.cls === null ? 'Pending' : 
               budgetStatus.cls ? 'Good' : 'Needs Improvement'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Time to First Byte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.ttfb, 'ms')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Server response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">First Meaningful Paint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatMetric(metrics.fmp, 'ms')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Content visibility
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {getRecommendations().map((recommendation, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Performance Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(budgetStatus).filter(Boolean).length}
              </div>
              <div className="text-sm text-muted-foreground">Within Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(budgetStatus).filter(v => v === false).length}
              </div>
              <div className="text-sm text-muted-foreground">Needs Improvement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(budgetStatus).filter(v => v === null).length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round((Object.values(budgetStatus).filter(Boolean).length / 
                            Object.values(budgetStatus).filter(v => v !== null).length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
