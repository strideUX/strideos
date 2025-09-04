"use client";

import React, { memo, useEffect, useMemo, useState } from "react";

export type RelativeTimeFormat = "relative" | "absolute" | "both";

export interface RelativeTimeProps {
  timestamp: number;
  className?: string;
  format?: RelativeTimeFormat;
  /** When true, adds a title attribute with the alternate format */
  showTitle?: boolean;
}

export const RelativeTime = memo(function RelativeTime({
  timestamp,
  className = "",
  format = "relative",
  showTitle = true,
}: RelativeTimeProps) {
  const [now, setNow] = useState<number>(Date.now());

  // Keep fresh each minute
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const relative = useMemo(() => {
    try {
      const ts = Number(timestamp);
      const current = Number(now);
      if (!Number.isFinite(ts) || !Number.isFinite(current)) return "";
      const diff = Math.max(0, current - ts);
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
      if (seconds < 60) return "just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (weeks < 4) return `${weeks}w ago`;
      if (months < 12) return `${months}mo ago`;
      return `${years}y ago`;
    } catch {
      return "";
    }
  }, [timestamp, now]);

  const absolute = useMemo(() => {
    try {
      const d = new Date(Number(timestamp));
      if (Number.isNaN(d.getTime())) return "";
      const today = new Date();
      const yday = new Date(today);
      yday.setDate(yday.getDate() - 1);
      const isToday = d.toDateString() === today.toDateString();
      const isYesterday = d.toDateString() === yday.toDateString();
      if (isToday) return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      if (isYesterday)
        return `Yesterday at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "";
    }
  }, [timestamp]);

  if (format === "absolute") {
    return (
      <span className={className} title={showTitle ? relative : undefined}>
        {absolute}
      </span>
    );
  }

  if (format === "both") {
    return (
      <span className={className}>
        <span title={showTitle ? absolute : undefined}>{relative}</span>
        <span className="mx-1 text-muted-foreground">•</span>
        <span title={showTitle ? relative : undefined}>{absolute}</span>
      </span>
    );
  }

  return (
    <span className={className} title={showTitle ? absolute : undefined}>
      {relative || absolute}
    </span>
  );
});

export default RelativeTime;


