/**
 * LiveTimestamp - Live updating timestamp component with relative and absolute formatting
 *
 * @remarks
 * Displays timestamps in various formats with automatic updates. Supports relative
 * time (e.g., "2h ago"), absolute time (e.g., "Yesterday at 3:45 PM"), or both.
 * Updates every minute to keep relative timestamps current.
 *
 * @example
 * ```tsx
 * <LiveTimestamp
 *   timestamp={Date.now() - 3600000}
 *   format="relative"
 *   className="text-sm text-muted-foreground"
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, memo, useState, useEffect } from 'react';

// 2. Internal imports
// (No internal imports needed)

// 3. Types
interface LiveTimestampProps {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Additional CSS classes */
  className?: string;
  /** Display format for the timestamp */
  format?: 'relative' | 'absolute' | 'both';
}

// Helper functions will be defined inside the component to avoid any
// module-evaluation ordering issues in certain bundlers.

// 4. Component definition
export const LiveTimestamp = memo(function LiveTimestamp({ 
  timestamp, 
  className = '', 
  format = 'relative' 
}: LiveTimestampProps) {
  // === 1. HOOKS ===
  const [now, setNow] = useState(Date.now());

  // === 2. MEMOIZED VALUES ===
  const relativeTime = useMemo(() => {
    try {
      const ts = Number(timestamp);
      const currentNow = Number(now);
      if (!Number.isFinite(ts) || !Number.isFinite(currentNow)) return 'just now';
      const diff = currentNow - ts;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);

      if (seconds < 60) return 'just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (weeks < 4) return `${weeks}w ago`;
      if (months < 12) return `${months}mo ago`;
      return `${years}y ago`;
    } catch {
      return 'just now';
    }
  }, [timestamp, now]);

  const absoluteTime = useMemo(() => {
    try {
      const ts = Number(timestamp);
      if (!Number.isFinite(ts)) return '';
      const date = new Date(ts);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const isToday = date.toDateString() === today.toDateString();
      const isYesterday = date.toDateString() === yesterday.toDateString();

      if (isToday) {
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      }
      if (isYesterday) {
        return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      }
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  }, [timestamp]);

  // === 3. EFFECTS ===
  // Update the current time every minute for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // === 4. RENDER ===
  if (format === 'relative') {
    return (
      <span className={className} title={absoluteTime}>
        {relativeTime}
      </span>
    );
  }

  if (format === 'absolute') {
    return (
      <span className={className} title={relativeTime}>
        {absoluteTime}
      </span>
    );
  }

  // format === 'both'
  return (
    <span className={className}>
      <span title={absoluteTime}>{relativeTime}</span>
      <span className="mx-1 text-muted-foreground">•</span>
      <span title={relativeTime}>{absoluteTime}</span>
    </span>
  );
});

export default LiveTimestamp;