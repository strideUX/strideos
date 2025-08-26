"use client";

import React from "react";

export interface capacity-barProps {
  valuePct: number;
  targetPct?: number;
  committedHours?: number;
  capacityHours?: number;
}

function getCapacityStatus(pct: number): { color: string; status: "over" | "target" | "under"; ring: string } {
  if (pct > 100) return { color: "bg-red-500", status: "over", ring: "ring-red-500/30" };
  if (pct >= 80) return { color: "bg-emerald-500", status: "target", ring: "" };
  return { color: "bg-amber-500", status: "under", ring: "ring-amber-400/30" };
}

function formatHours(hours?: number): string {
  const h = Math.max(0, Math.round((hours ?? 0)));
  return `${h}h`;
}

export function CapacityBar({ valuePct, targetPct = 80, committedHours, capacityHours }: capacity-barProps) {
  const pct = Math.max(0, Math.min(valuePct, 150));
  const { color, status } = getCapacityStatus(valuePct);

  return (
    <div className="rounded-md p-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">Capacity utilization</span>
        <span className={status === "over" ? "text-red-600" : status === "under" ? "text-amber-600" : "text-emerald-600"}>
          {Math.round(valuePct)}%
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        {/* Fill */}
        <div className={`absolute left-0 top-0 h-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        {/* Target marker */}
        <div className="absolute top-0 h-full w-0.5 bg-emerald-600/80" style={{ left: `${targetPct}%` }} />
      </div>
      {(committedHours !== undefined && capacityHours !== undefined) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {formatHours(committedHours)} committed of {formatHours(capacityHours)} capacity
          {status === "over" && (
            <span className="ml-2 text-red-600">Over by {formatHours(Math.max(0, committedHours - capacityHours))}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default capacity-bar;


