'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNetworkResilience } from '@/hooks/use-network-resilience';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  showOfflineQueue?: boolean;
  variant?: 'minimal' | 'detailed' | 'full';
}

export function NetworkStatusIndicator({
  className,
  showDetails = true,
  showOfflineQueue = true,
  variant = 'detailed',
}: NetworkStatusIndicatorProps) {
  const {
    networkStatus,
    isOnline,
    isOffline,
    isReconnecting,
    offlineActions,
    isProcessingOfflineQueue,
    clearOfflineQueue,
    getOfflineQueueStats,
  } = useNetworkResilience();

  const queueStats = getOfflineQueueStats();

  // Don't render if online and no offline actions (minimal mode)
  if (variant === 'minimal' && isOnline && offlineActions.length === 0) {
    return null;
  }

  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />;
    }
    if (isOffline) {
      return <WifiOff className="h-4 w-4 text-destructive" />;
    }
    if (queueStats.pending > 0) {
      return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    }
    return <Wifi className="h-4 w-4 text-green-600" />;
  };

  const getStatusText = () => {
    if (isReconnecting) return 'Reconnecting...';
    if (isOffline) return 'Offline';
    if (queueStats.pending > 0) return `${queueStats.pending} pending`;
    if (queueStats.total > 0) return `${queueStats.total} synced`;
    return 'Online';
  };

  const getStatusColor = () => {
    if (isReconnecting) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (isOffline) return 'bg-destructive/10 text-destructive border-destructive/20';
    if (queueStats.pending > 0) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (queueStats.total > 0) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getConnectionInfo = () => {
    if (!networkStatus.connectionInfo) return null;

    const { type, effectiveType, downlink, rtt } = networkStatus.connectionInfo;
    
    return (
      <div className="text-xs text-muted-foreground space-y-1">
        {type && <div>Type: {type}</div>}
        {effectiveType && <div>Speed: {effectiveType}</div>}
        {downlink && <div>Download: {downlink.toFixed(1)} Mbps</div>}
        {rtt && <div>Latency: {rtt}ms</div>}
      </div>
    );
  };

  if (variant === 'minimal') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center space-x-2', className)}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-2">
              <div className="font-medium">Network Status</div>
              <div>{getStatusText()}</div>
              {getConnectionInfo()}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main status indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <div>
            <div className="text-sm font-medium">Network Status</div>
            <div className="text-xs text-muted-foreground">
              {isOnline ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
        
        <Badge variant="outline" className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>

      {/* Connection details */}
      {showDetails && isOnline && (
        <div className="p-3 rounded-lg border bg-muted/50">
          <div className="text-xs font-medium text-muted-foreground mb-2">
            Connection Details
          </div>
          {getConnectionInfo()}
          {networkStatus.lastSeenOnline && (
            <div className="text-xs text-muted-foreground mt-2">
              Last online: {networkStatus.lastSeenOnline.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* Offline queue status */}
      {showOfflineQueue && offlineActions.length > 0 && (
        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-amber-800">
              Offline Actions ({queueStats.total})
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearOfflineQueue}
              className="h-6 px-2 text-xs text-amber-700 hover:text-amber-800"
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700">Pending:</span>
              <span className="font-medium">{queueStats.pending}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-700">Failed:</span>
              <span className="font-medium">{queueStats.failed}</span>
            </div>
            {queueStats.oldestAction && (
              <div className="text-xs text-amber-600">
                Oldest: {queueStats.oldestAction.toLocaleTimeString()}
              </div>
            )}
          </div>

          {isProcessingOfflineQueue && (
            <div className="flex items-center space-x-2 mt-2 text-xs text-amber-700">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Processing offline actions...</span>
            </div>
          )}
        </div>
      )}

      {/* Offline mode indicator */}
      {isOffline && (
        <div className="p-3 rounded-lg border bg-destructive/10 border-destructive/20">
          <div className="flex items-center space-x-2 mb-2">
            <WifiOff className="h-4 w-4 text-destructive" />
            <div className="text-sm font-medium text-destructive">
              Offline Mode
            </div>
          </div>
          <div className="text-xs text-destructive/80">
            You're currently offline. Some features may be limited.
            {offlineActions.length > 0 && (
              <div className="mt-1">
                {offlineActions.length} action{offlineActions.length !== 1 ? 's' : ''} will be processed when you're back online.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reconnecting indicator */}
      {isReconnecting && (
        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
            <div className="text-sm font-medium text-amber-800">
              Reconnecting...
            </div>
          </div>
          <div className="text-xs text-amber-700 mt-1">
            Attempting to restore your connection and sync any offline changes.
          </div>
        </div>
      )}

      {/* Success indicator */}
      {isOnline && offlineActions.length === 0 && !isReconnecting && (
        <div className="p-3 rounded-lg border bg-green-50 border-green-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-sm font-medium text-green-800">
              All Systems Operational
            </div>
          </div>
          <div className="text-xs text-green-700 mt-1">
            Your connection is stable and all data is synchronized.
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for headers/navbars
export function NetworkStatusBadge() {
  const { isOnline, isReconnecting, offlineActions, getOfflineQueueStats } = useNetworkResilience();
  const queueStats = getOfflineQueueStats();

  if (isOnline && offlineActions.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              'cursor-help',
              isReconnecting && 'bg-amber-100 text-amber-800 border-amber-200',
              !isOnline && 'bg-destructive/10 text-destructive border-destructive/20',
              isOnline && offlineActions.length > 0 && 'bg-amber-100 text-amber-800 border-amber-200'
            )}
          >
            {isReconnecting ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : !isOnline ? (
              <WifiOff className="h-3 w-3 mr-1" />
            ) : (
              <AlertTriangle className="h-3 w-3 mr-1" />
            )}
            {isReconnecting ? 'Reconnecting' : !isOnline ? 'Offline' : queueStats.pending}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2">
            <div className="font-medium">Network Status</div>
            {isReconnecting && <div>Reconnecting to server...</div>}
            {!isOnline && <div>You're currently offline</div>}
            {isOnline && offlineActions.length > 0 && (
              <div>{queueStats.pending} actions pending sync</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
