'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConnectionStatus, ConnectionState } from './connection-status';
import { useYjsProvider } from '@y-sweet/react';

export function NetworkDemo() {
  const provider = useYjsProvider();
  const [status, setStatus] = useState<ConnectionState>('connecting');
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);
  const [manualDisconnect, setManualDisconnect] = useState(false);

  useEffect(() => {
    const onStatus = (event: { status: ConnectionState }) => {
      setStatus(event.status);
    };

    // y-sweet provider emits 'status' with { status: 'connected' | 'connecting' | 'disconnected' }
    provider.on('status', onStatus as unknown as (...args: unknown[]) => void);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      provider.off('status', onStatus as unknown as (...args: unknown[]) => void);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [provider]);

  const disconnect = () => {
    try {
      // Optional disconnect if available on provider instance
      (provider as unknown as { disconnect?: () => void }).disconnect?.();
      setManualDisconnect(true);
      setStatus('disconnected');
    } catch {
      // no-op
    }
  };

  const reconnect = () => {
    try {
      (provider as unknown as { connect?: () => void }).connect?.();
      setManualDisconnect(false);
      setStatus('connecting');
    } catch {
      // no-op
    }
  };

  return (
    <div className="flex items-center gap-3">
      <ConnectionStatus status={status} isOnline={isOnline} />
      {status !== 'connected' ? (
        <Button type="button" size="sm" variant="outline" onClick={reconnect}>Reconnect</Button>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={disconnect}>Disconnect</Button>
      )}
      {!isOnline && (
        <span className="text-xs text-muted-foreground">System offline: edits queue locally</span>
      )}
      {manualDisconnect && (
        <span className="text-xs text-muted-foreground">Manually disconnected</span>
      )}
    </div>
  );
}
