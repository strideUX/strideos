'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  lastSeenOnline: Date | null;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface OfflineAction {
  id: string;
  action: string;
  timestamp: Date;
  data: any;
  retryCount: number;
  maxRetries: number;
}

interface UseNetworkResilienceOptions {
  enableOfflineQueue?: boolean;
  maxOfflineActions?: number;
  retryIntervalMs?: number;
  onOnline?: () => void;
  onOffline?: () => void;
  onReconnect?: () => void;
}

export function useNetworkResilience(options: UseNetworkResilienceOptions = {}) {
  const {
    enableOfflineQueue = true,
    maxOfflineActions = 50,
    retryIntervalMs = 5000,
    onOnline,
    onOffline,
    onReconnect,
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isReconnecting: false,
    lastSeenOnline: typeof navigator !== 'undefined' && navigator.onLine ? new Date() : null,
  });

  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isProcessingOfflineQueue, setIsProcessingOfflineQueue] = useState(false);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const retryIntervalRef = useRef<NodeJS.Timeout>();
  const wasOfflineRef = useRef(false);

  // Network status detection
  const updateNetworkStatus = useCallback((isOnline: boolean) => {
    setNetworkStatus(prev => {
      const newStatus: NetworkStatus = {
        ...prev,
        isOnline,
        lastSeenOnline: isOnline ? new Date() : prev.lastSeenOnline,
      };

      // Get connection information if available
      if (isOnline && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          newStatus.connectionType = connection.effectiveType || connection.type;
          newStatus.effectiveType = connection.effectiveType;
          newStatus.downlink = connection.downlink;
          newStatus.rtt = connection.rtt;
        }
      }

      return newStatus;
    });
  }, []);

  // Handle online/offline events
  const handleOnline = useCallback(() => {
    updateNetworkStatus(true);
    
    if (wasOfflineRef.current) {
      setNetworkStatus(prev => ({ ...prev, isReconnecting: true }));
      
      // Process offline queue
      if (enableOfflineQueue && offlineActions.length > 0) {
        processOfflineQueue();
      }
      
      // Call reconnect callback
      if (onReconnect) {
        onReconnect();
      }
      
      // Show reconnection toast
      toast.success("Connection Restored");
      toast.info("Syncing any offline changes...");
    }
    
    wasOfflineRef.current = false;
    
    if (onOnline) {
      onOnline();
    }
  }, [updateNetworkStatus, enableOfflineQueue, offlineActions.length, onReconnect, onOnline]);

  const handleOffline = useCallback(() => {
    updateNetworkStatus(false);
    wasOfflineRef.current = true;
    
    // Clear any existing reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Show offline toast
    toast.error("Connection Lost");
    toast.warning("You're currently offline. Some features may be limited.");
    
    if (onOffline) {
      onOffline();
    }
  }, [updateNetworkStatus, onOffline]);

  // Add action to offline queue
  const queueOfflineAction = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    if (!enableOfflineQueue || !networkStatus.isOnline) {
      return;
    }

    const offlineAction: OfflineAction = {
      ...action,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
    };

    setOfflineActions(prev => {
      const newActions = [...prev, offlineAction];
      
      // Limit queue size
      if (newActions.length > maxOfflineActions) {
        return newActions.slice(-maxOfflineActions);
      }
      
      return newActions;
    });

    // Show queued action toast
    toast.info("Action Queued");
    toast.info("This action will be processed when you're back online.");
  }, [enableOfflineQueue, networkStatus.isOnline, maxOfflineActions]);

  // Process offline queue when back online
  const processOfflineQueue = useCallback(async () => {
    if (offlineActions.length === 0 || isProcessingOfflineQueue) {
      return;
    }

    setIsProcessingOfflineQueue(true);
    
    try {
      const actionsToProcess = [...offlineActions];
      
      for (const action of actionsToProcess) {
        try {
          // Process the action (this would typically call the actual API)
          await processOfflineAction(action);
          
          // Remove successful action from queue
          setOfflineActions(prev => prev.filter(a => a.id !== action.id));
          
        } catch (error) {
          console.error(`Failed to process offline action ${action.id}:`, error);
          
          // Increment retry count
          setOfflineActions(prev => 
            prev.map(a => 
              a.id === action.id 
                ? { ...a, retryCount: a.retryCount + 1 }
                : a
            )
          );
          
          // Remove action if max retries exceeded
          if (action.retryCount >= action.maxRetries) {
            setOfflineActions(prev => prev.filter(a => a.id !== action.id));
            
            toast.error(`Failed to process "${action.action}" after multiple attempts.`);
          }
        }
      }
    } finally {
      setIsProcessingOfflineQueue(false);
      setNetworkStatus(prev => ({ ...prev, isReconnecting: false }));
    }
  }, [offlineActions, isProcessingOfflineQueue]);

  // Process individual offline action (placeholder - implement based on your needs)
  const processOfflineAction = async (action: OfflineAction): Promise<void> => {
    // This is a placeholder - implement based on your specific needs
    // Example: call the actual API endpoint with the queued data
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure
    if (Math.random() > 0.1) { // 90% success rate
      return;
    } else {
      throw new Error('Simulated failure');
    }
  };

  // Clear offline queue
  const clearOfflineQueue = useCallback(() => {
    setOfflineActions([]);
    toast.success("Offline Queue Cleared");
    toast.info("All queued actions have been removed.");
  }, []);

  // Get offline queue statistics
  const getOfflineQueueStats = useCallback(() => {
    const totalActions = offlineActions.length;
    const pendingActions = offlineActions.filter(a => a.retryCount < a.maxRetries);
    const failedActions = offlineActions.filter(a => a.retryCount >= a.maxRetries);
    
    return {
      total: totalActions,
      pending: pendingActions.length,
      failed: failedActions.length,
      oldestAction: offlineActions[0]?.timestamp,
      newestAction: offlineActions[offlineActions.length - 1]?.timestamp,
    };
  }, [offlineActions]);

  // Setup network event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial network status
    updateNetworkStatus(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change events (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', () => {
          updateNetworkStatus(navigator.onLine);
        });
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', () => {});
        }
      }
    };
  }, [handleOnline, handleOffline, updateNetworkStatus]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (retryIntervalRef.current) {
        clearTimeout(retryIntervalRef.current);
      }
    };
  }, []);

  return {
    // Network status
    networkStatus,
    isOnline: networkStatus.isOnline,
    isOffline: !networkStatus.isOnline,
    isReconnecting: networkStatus.isReconnecting,
    connectionInfo: {
      type: networkStatus.connectionType,
      effectiveType: networkStatus.effectiveType,
      downlink: networkStatus.downlink,
      rtt: networkStatus.rtt,
    },
    
    // Offline queue management
    offlineActions,
    isProcessingOfflineQueue,
    queueOfflineAction,
    clearOfflineQueue,
    getOfflineQueueStats,
    
    // Utility functions
    processOfflineQueue,
  };
}
