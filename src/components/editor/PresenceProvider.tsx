"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { convex } from '@/lib/convex';

export type PresenceStatus = 'active' | 'typing' | 'idle' | 'away';

export interface CursorCoordinates { x: number; y: number; }
export interface CursorPosition {
  sectionId: Id<'documentSections'>;
  selection: unknown;
  coordinates?: CursorCoordinates;
}

export interface ActiveUser {
  _id: string;
  userId: Id<'users'>;
  documentId: Id<'documents'>;
  status: PresenceStatus;
  lastSeen: number;
  cursorPosition?: CursorPosition;
  user: { _id: Id<'users'>; name?: string; image?: string; role: string; email?: string } | null;
}

interface PresenceContextType {
  activeUsers: ActiveUser[];
  joinSession: () => void;
  leaveSession: () => void;
  updateCursor: (position: CursorPosition) => void;
  updateStatus: (status: Exclude<PresenceStatus, 'away'>) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export function PresenceProvider({ documentId, children }: { documentId: Id<'documents'>; children: React.ReactNode }) {
  const [lastCursor, setLastCursor] = useState<CursorPosition | undefined>(undefined);
  const [lastStatus, setLastStatus] = useState<Exclude<PresenceStatus, 'away'>>('active');
  const [isJoined, setIsJoined] = useState(false);

  const join = useMutation(api.documentSessions.joinDocumentSession);
  const leave = useMutation(api.documentSessions.leaveDocumentSession);
  const presence = useMutation(api.documentSessions.updatePresence);

  const collaborators = useQuery(api.documentSessions.getActiveCollaborators, { documentId });
  const activeUsers = collaborators || [];

  const heartbeatRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const joinSession = useCallback(async () => {
    if (isJoined) return;
    try {
      await join({ documentId });
      setIsJoined(true);
    } catch {}
  }, [documentId, isJoined, join]);

  const leaveSession = useCallback(async () => {
    if (!isJoined) return;
    try {
      await leave({ documentId });
      setIsJoined(false);
    } catch {}
  }, [documentId, isJoined, leave]);

  // Heartbeat every 30s
  useEffect(() => {
    if (!isJoined) return;
    const sendHeartbeat = async () => {
      try {
        await presence({ documentId, status: lastStatus, cursorPosition: lastCursor as any });
      } catch {}
    };
    sendHeartbeat();
    const id = window.setInterval(sendHeartbeat, 30_000);
    heartbeatRef.current = id as unknown as number;
    return () => {
      window.clearInterval(id);
      heartbeatRef.current = null;
    };
  }, [documentId, isJoined, presence, lastStatus, lastCursor]);

  // Autojoin on mount; leave on unmount
  useEffect(() => {
    joinSession();
    return () => {
      void leaveSession();
    };
  }, [joinSession, leaveSession]);

  const updateCursor = useCallback(async (position: CursorPosition) => {
    setLastCursor(position);
    const now = Date.now();
    if (now - lastSentRef.current < 100) return; // throttle to 10/s
    lastSentRef.current = now;
    try {
      await presence({ documentId, status: lastStatus, cursorPosition: position as any });
    } catch {}
  }, [documentId, presence, lastStatus]);

  const updateStatus = useCallback(async (status: Exclude<PresenceStatus, 'away'>) => {
    setLastStatus(status);
    try {
      await presence({ documentId, status, cursorPosition: lastCursor as any });
    } catch {}

    // Debounce typing back to active after 500ms
    if (status === 'typing') {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = window.setTimeout(() => {
        void presence({ documentId, status: 'active', cursorPosition: lastCursor as any });
        setLastStatus('active');
      }, 500) as unknown as number;
    }
  }, [documentId, presence, lastCursor]);

  const value = useMemo<PresenceContextType>(() => ({
    activeUsers,
    joinSession,
    leaveSession,
    updateCursor,
    updateStatus,
  }), [activeUsers, joinSession, leaveSession, updateCursor, updateStatus]);

  return (
    <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>
  );
}

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error('usePresence must be used within PresenceProvider');
  return ctx;
}