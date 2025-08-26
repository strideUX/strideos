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
import React, { useMemo, useCallback, memo, useState, useEffect } from 'react';

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

// 4. Component definition
export const LiveTimestamp = memo(function LiveTimestamp({ 
  timestamp, 
  className = '', 
  format = 'relative' 
}: LiveTimestampProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [now, setNow] = useState(Date.now());

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const relativeTime = useMemo(() => {
    return formatRelativeTime(timestamp, now);
  }, [timestamp, now]);

  const absoluteTime = useMemo(() => {
    return formatAbsoluteTime(timestamp);
  }, [timestamp]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const formatRelativeTime = useCallback((timestamp: number, now: number): string => {
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else if (weeks < 4) {
      return `${weeks}w ago`;
    } else if (months < 12) {
      return `${months}mo ago`;
    } else {
      return `${years}y ago`;
    }
  }, []);

  const formatAbsoluteTime = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // Update the current time every minute for relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
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