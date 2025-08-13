"use client";

import { useMemo } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { ActiveUser } from './PresenceProvider';

interface CursorOverlayProps {
  users: ActiveUser[];
}

export function CursorOverlay({ users }: CursorOverlayProps) {
  const cursors = useMemo(() => users.filter(u => !!u.cursorPosition?.coordinates), [users]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {cursors.map(({ user, userId, cursorPosition }) => {
        const coords = cursorPosition!.coordinates!;
        return (
          <div
            key={userId}
            className="absolute"
            style={{ transform: `translate(${coords.x}px, ${coords.y}px)` }}
          >
            <div className="flex items-center gap-1">
              <div className="w-2 h-4 bg-emerald-500 rounded-sm shadow" />
              <div className="px-1.5 py-0.5 bg-emerald-500/90 text-white text-xs rounded">
                {user?.name || 'User'}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}