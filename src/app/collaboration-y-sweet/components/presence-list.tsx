'use client';

import { useEffect, useState } from 'react';
import { useYjsProvider } from '@y-sweet/react';
import { cn } from '@/lib/utils';

interface PresenceUser {
  name?: string;
  color?: string;
}

export function PresenceList({ className }: { className?: string }) {
  const provider = useYjsProvider();
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const awareness = (provider as unknown as { awareness?: { getStates: () => Map<number, unknown>; on: (event: string, cb: () => void) => void; off: (event: string, cb: () => void) => void } }).awareness;
    if (!awareness) return;

    const readStates = () => {
      const states = awareness.getStates();
      const next: PresenceUser[] = [];
      states.forEach((state) => {
        const s = state as { user?: PresenceUser };
        if (s && s.user) next.push(s.user);
      });
      setUsers(next);
    };

    readStates();
    const onChange = () => readStates();
    awareness.on('change', onChange);

    return () => {
      awareness.off('change', onChange);
    };
  }, [provider]);

  if (!users.length) {
    return <div className={cn('text-xs text-muted-foreground', className)}>No active users</div>;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {users.map((u, idx) => (
        <div key={`${u.name}-${idx}`} className="flex items-center gap-1 text-xs">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: u.color || '#6B7280' }} />
          <span className="text-muted-foreground">{u.name || 'Anonymous'}</span>
        </div>
      ))}
    </div>
  );
}
