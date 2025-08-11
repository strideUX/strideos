"use client";

import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { IconLayoutKanban, IconTable } from "@tabler/icons-react";

export interface ViewToggleProps {
  view: "table" | "kanban";
  onViewChange: (view: "table" | "kanban") => void;
  className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(val) => {
        if (val === "table" || val === "kanban") onViewChange(val);
      }}
      className={className}
      variant="outline"
      size="sm"
    >
      <ToggleGroupItem value="table" aria-label="Table view">
        <IconTable className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Table</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="kanban" aria-label="Kanban view">
        <IconLayoutKanban className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Kanban</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}