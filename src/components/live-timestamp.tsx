'use client';

import * as React from 'react';

interface LiveTimestampProps {
  timestamp: number;
  className?: string;
  format?: 'relative' | 'absolute' | 'both';
}

export function LiveTimestamp({ 
  timestamp, 
  className = '', 
  format = 'relative' 
}: LiveTimestampProps) {
  const [now, setNow] = React.useState(Date.now());

  // Update the current time every minute for relative timestamps
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const formatRelativeTime = (timestamp: number, now: number) => {
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
  };

  const formatAbsoluteTime = (timestamp: number) => {
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
  };

  const relativeTime = formatRelativeTime(timestamp, now);
  const absoluteTime = formatAbsoluteTime(timestamp);

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
      {relativeTime} ({absoluteTime})
    </span>
  );
}