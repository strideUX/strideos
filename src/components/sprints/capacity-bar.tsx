/**
 * CapacityBar - Visual capacity utilization indicator component
 *
 * @remarks
 * Displays capacity utilization as a progress bar with color-coded status indicators.
 * Shows target capacity markers and provides detailed hour breakdowns.
 * Supports over-capacity warnings and visual feedback for different utilization levels.
 *
 * @example
 * ```tsx
 * <CapacityBar
 *   valuePct={85}
 *   targetPct={80}
 *   committedHours={40}
 *   capacityHours={45}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, memo } from 'react';

// 2. Internal imports
// (No internal imports needed)

// 3. Types
export interface CapacityBarProps {
  /** Current capacity utilization percentage */
  valuePct: number;
  /** Target capacity percentage (default: 80) */
  targetPct?: number;
  /** Committed hours for the period */
  committedHours?: number;
  /** Total capacity hours available */
  capacityHours?: number;
}

interface CapacityStatus {
  color: string;
  status: 'over' | 'target' | 'under';
  ring: string;
}

// 4. Component definition
export const CapacityBar = memo(function CapacityBar({ 
  valuePct, 
  targetPct = 80, 
  committedHours, 
  capacityHours 
}: CapacityBarProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const pct = useMemo(() => {
    return Math.max(0, Math.min(valuePct, 150));
  }, [valuePct]);

  const capacityStatus = useMemo(() => {
    if (pct > 100) return { color: 'bg-red-500', status: 'over' as const, ring: 'ring-red-500/30' };
    if (pct >= 80) return { color: 'bg-emerald-500', status: 'target' as const, ring: 'ring-emerald-500/30' };
    return { color: 'bg-amber-500', status: 'under' as const, ring: 'ring-amber-400/30' };
  }, [pct]);

  const formattedCommittedHours = useMemo(() => {
    const h = Math.max(0, Math.round(committedHours ?? 0));
    return `${h}h`;
  }, [committedHours]);

  const formattedCapacityHours = useMemo(() => {
    const h = Math.max(0, Math.round(capacityHours ?? 0));
    return `${h}h`;
  }, [capacityHours]);

  const overCapacityHours = useMemo(() => {
    if (committedHours !== undefined && capacityHours !== undefined && committedHours > capacityHours) {
      const h = Math.max(0, Math.round(committedHours - capacityHours));
      return `${h}h`;
    }
    return null;
  }, [committedHours, capacityHours]);

  const statusTextColor = useMemo(() => {
    switch (capacityStatus.status) {
      case 'over': return 'text-red-600';
      case 'under': return 'text-amber-600';
      default: return 'text-emerald-600';
    }
  }, [capacityStatus.status]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="rounded-md p-2">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">Capacity utilization</span>
        <span className={statusTextColor}>
          {Math.round(valuePct)}%
        </span>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        {/* Fill */}
        <div 
          className={`absolute left-0 top-0 h-full ${capacityStatus.color}`} 
          style={{ width: `${Math.min(pct, 100)}%` }} 
        />
        {/* Target marker */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-emerald-600/80" 
          style={{ left: `${targetPct}%` }} 
        />
      </div>
      {(committedHours !== undefined && capacityHours !== undefined) && (
        <div className="mt-1 text-xs text-muted-foreground">
          {formattedCommittedHours} committed of {formattedCapacityHours} capacity
          {overCapacityHours && (
            <span className="ml-2 text-red-600">Over by {overCapacityHours}</span>
          )}
        </div>
      )}
    </div>
  );
});

export default CapacityBar;


