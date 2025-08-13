'use client';

import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConnectionState = 'connected' | 'connecting' | 'disconnected';

interface ConnectionStatusProps {
  status: ConnectionState;
  isOnline?: boolean;
  className?: string;
}

export function ConnectionStatus({ status, isOnline = true, className }: ConnectionStatusProps) {
  const config: Record<ConnectionState, { Icon: React.ComponentType<{ className?: string }>; color: string; message: string }> = {
    connected: { Icon: Wifi, color: 'text-green-500', message: 'Connected' },
    connecting: { Icon: Loader2, color: 'text-yellow-500', message: 'Connecting…' },
    disconnected: { Icon: WifiOff, color: 'text-red-500', message: 'Offline' },
  };

  const { Icon, color, message } = config[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', color, status === 'connecting' ? 'animate-spin' : undefined)} />
      <span className="text-sm">{message}</span>
      {status === 'disconnected' && (
        <span className="text-xs text-muted-foreground">Changes will sync when reconnected</span>
      )}
      {!isOnline && (
        <span className="text-xs text-muted-foreground">(browser offline)</span>
      )}
    </div>
  );
}
