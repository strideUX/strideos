/**
 * CapacityDetailsModal - Detailed capacity utilization breakdown modal
 *
 * @remarks
 * Displays comprehensive capacity utilization details including total team capacity,
 * individual member breakdowns, and visual progress indicators.
 * Shows over-capacity warnings and per-person task allocations.
 *
 * @example
 * ```tsx
 * <CapacityDetailsModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   totalPct={85}
 *   committedHours={160}
 *   capacityHours={180}
 *   people={teamCapacity}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, memo } from 'react';

// 2. Internal imports
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// 3. Types
export interface PersonCapacity {
  /** User identifier */
  userId: string;
  /** User's display name */
  name: string;
  /** Hours committed to tasks */
  hoursCommitted: number;
  /** Total capacity hours available */
  capacityHours: number;
  /** Number of tasks assigned */
  taskCount: number;
}

export interface CapacityDetailsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal open state changes */
  onOpenChange: (open: boolean) => void;
  /** Total capacity utilization percentage */
  totalPct: number;
  /** Total committed hours across team */
  committedHours: number;
  /** Total capacity hours available */
  capacityHours: number;
  /** Per-person capacity breakdown */
  people?: PersonCapacity[];
}

// 4. Component definition
export const CapacityDetailsModal = memo(function CapacityDetailsModal({ 
  open, 
  onOpenChange, 
  totalPct, 
  committedHours, 
  capacityHours, 
  people = [] 
}: CapacityDetailsModalProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isOverCapacity = useMemo(() => {
    return totalPct > 100;
  }, [totalPct]);

  const totalUtilizationColor = useMemo(() => {
    if (isOverCapacity) return 'text-red-600';
    if (totalPct >= 80) return 'text-emerald-600';
    return 'text-amber-600';
  }, [isOverCapacity, totalPct]);

  const totalProgressColor = useMemo(() => {
    if (isOverCapacity) return '[&>div]:bg-red-600';
    if (totalPct >= 80) return '[&>div]:bg-emerald-600';
    return '[&>div]:bg-amber-500';
  }, [isOverCapacity, totalPct]);

  const overCapacityHours = useMemo(() => {
    if (isOverCapacity) {
      return Math.max(0, committedHours - capacityHours);
    }
    return 0;
  }, [isOverCapacity, committedHours, capacityHours]);

  const hasPeopleData = useMemo(() => {
    return people.length > 0;
  }, [people.length]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Capacity details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Total utilization</span>
              <span className={totalUtilizationColor}>{Math.round(totalPct)}%</span>
            </div>
            <Progress 
              value={Math.min(totalPct, 100)} 
              className={totalProgressColor} 
            />
            <div className="mt-2 text-xs text-muted-foreground">
              {committedHours}h of {capacityHours}h
              {isOverCapacity && (
                <span className="ml-2 text-red-600">Over by {overCapacityHours}h</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Per person</div>
            {!hasPeopleData ? (
              <div className="text-sm text-muted-foreground">No per-person data available</div>
            ) : (
              <div className="space-y-3">
                {people.map((person) => {
                  const personPct = person.capacityHours > 0 
                    ? Math.round((person.hoursCommitted / person.capacityHours) * 100) 
                    : 0;
                  
                  const personProgressColor = personPct > 100 
                    ? '[&>div]:bg-red-600' 
                    : personPct >= 80 
                    ? '[&>div]:bg-emerald-600' 
                    : '[&>div]:bg-amber-500';

                  return (
                    <div key={person.userId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">{person.name}</div>
                        <div className="text-muted-foreground">
                          {person.taskCount} tasks • {person.hoursCommitted}h
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(personPct, 100)} 
                        className={personProgressColor} 
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default CapacityDetailsModal;


