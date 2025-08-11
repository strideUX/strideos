"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export interface PersonCapacity {
  userId: string;
  name: string;
  hoursCommitted: number;
  capacityHours: number;
  taskCount: number;
}

export interface CapacityDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalPct: number;
  committedHours: number;
  capacityHours: number;
  people?: PersonCapacity[];
}

export function CapacityDetailsModal({ open, onOpenChange, totalPct, committedHours, capacityHours, people = [] }: CapacityDetailsModalProps) {
  const over = totalPct > 100;
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
              <span className={over ? "text-red-600" : totalPct >= 80 ? "text-emerald-600" : "text-amber-600"}>{Math.round(totalPct)}%</span>
            </div>
            <Progress value={Math.min(totalPct, 100)} className={over ? "[&>div]:bg-red-600" : totalPct >= 80 ? "[&>div]:bg-emerald-600" : "[&>div]:bg-amber-500"} />
            <div className="mt-2 text-xs text-muted-foreground">
              {committedHours}h of {capacityHours}h
              {over && <span className="ml-2 text-red-600">Over by {Math.max(0, committedHours - capacityHours)}h</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Per person</div>
            {people.length === 0 ? (
              <div className="text-sm text-muted-foreground">No per-person data available</div>
            ) : (
              <div className="space-y-3">
                {people.map((p) => {
                  const pct = p.capacityHours > 0 ? Math.round((p.hoursCommitted / p.capacityHours) * 100) : 0;
                  return (
                    <div key={p.userId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-muted-foreground">{p.taskCount} tasks • {p.hoursCommitted}h</div>
                      </div>
                      <Progress value={Math.min(pct, 100)} className={pct > 100 ? "[&>div]:bg-red-600" : pct >= 80 ? "[&>div]:bg-emerald-600" : "[&>div]:bg-amber-500"} />
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
}

export default CapacityDetailsModal;


