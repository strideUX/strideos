'use client';

import { useEffect, useState } from 'react';
import { useYjsProvider } from '@y-sweet/react';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { ConnectionStatusIndicator } from '@/components/collaboration/ConnectionStatusIndicator';

export function NetworkDemo() {
  const provider = useYjsProvider();
  const [status] = useConnectionStatus({ provider });
  const [isOnline, setIsOnline] = useState<boolean>(typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      <ConnectionStatusIndicator status={status} />
      {!isOnline && (
        <span className="text-xs text-muted-foreground">System offline: edits queue locally</span>
      )}
    </div>
  );
}
