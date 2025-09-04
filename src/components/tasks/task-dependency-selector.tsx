/**
 * TaskDependencySelector - Component for selecting and managing task dependencies
 *
 * @remarks
 * Provides a searchable interface for selecting tasks that block or depend on the current task.
 * Filters out completed tasks and the current task itself. Supports multi-selection with
 * visual feedback and status indicators. Integrates with task management workflow.
 *
 * @example
 * ```tsx
 * <TaskDependencySelector
 *   projectId="project123"
 *   currentTaskId="task456"
 *   selectedDependencies={dependencies}
 *   onDependenciesChange={setDependencies}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from "react";
import { useQuery } from "convex/react";

// 2. Internal imports
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
  CommandInput,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// 3. Types
export interface TaskDependencySelectorProps {
  /** Project ID to scope the task selection */
  projectId?: Id<"projects"> | null;
  /** Current task ID to exclude from dependencies */
  currentTaskId?: Id<"tasks"> | null;
  /** Currently selected dependency IDs */
  selectedDependencies?: Id<"tasks">[];
  /** Callback for dependency selection changes */
  onDependenciesChange: (dependencies: Id<"tasks">[]) => void;
}

interface TaskOption {
  id: Id<"tasks">;
  title: string;
  status: string;
}

// 4. Component definition
export const TaskDependencySelector = memo(function TaskDependencySelector({ 
  projectId, 
  currentTaskId, 
  selectedDependencies, 
  onDependenciesChange 
}: TaskDependencySelectorProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const tasks = (useQuery(api.tasks.getTasksByProject as any, projectId ? { projectId } : "skip" as any) ?? []) as any[];

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // Ensure selectedDependencies is always an array
  const safeSelectedDependencies = useMemo(() => {
    return selectedDependencies || [];
  }, [selectedDependencies]);

  const options = useMemo(() => {
    // Same project tasks, excluding current task and completed tasks
    return (tasks || [])
      .filter((t) => !currentTaskId || String(t._id) !== String(currentTaskId))
      .filter((t) => t.status !== "done" && t.status !== "archived")
      .map((t) => ({ 
        id: t._id as Id<"tasks">, 
        title: t.title as string, 
        status: t.status as string 
      }));
  }, [tasks, currentTaskId]);

  const optionById = useMemo(() => {
    const map = new Map<string, TaskOption>();
    for (const opt of options) map.set(String(opt.id), opt);
    return map;
  }, [options]);

  const selectedSet = useMemo(() => {
    return new Set<string>(safeSelectedDependencies.map((id) => String(id)));
  }, [safeSelectedDependencies]);

  const selectedCount = useMemo(() => {
    return safeSelectedDependencies.length;
  }, [safeSelectedDependencies]);

  const hasSelectedDependencies = useMemo(() => {
    return selectedCount > 0;
  }, [selectedCount]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const toggle = useCallback((id: Id<"tasks">) => {
    const asStr = String(id);
    const next = new Set<string>(Array.from(selectedSet));
    if (next.has(asStr)) {
      next.delete(asStr);
    } else {
      next.add(asStr);
    }
    onDependenciesChange(Array.from(next) as unknown as Id<"tasks">[]);
  }, [selectedSet, onDependenciesChange]);

  const clearAll = useCallback(() => {
    onDependenciesChange([]);
  }, [onDependenciesChange]);

  const getStatusBadgeClass = useCallback((status: string): string => {
    if (status === "in_progress") return "bg-blue-100 text-blue-800";
    if (status === "review") return "bg-amber-100 text-amber-800";
    return "bg-slate-100 text-slate-800";
  }, []);

  const formatStatus = useCallback((status: string): string => {
    return status.replace("_", " ");
  }, []);

  const getButtonText = useCallback(() => {
    return hasSelectedDependencies ? `${selectedCount} selected` : "Select dependencies";
  }, [hasSelectedDependencies, selectedCount]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="truncate">
              {getButtonText()}
            </span>
            <span className="text-xs text-muted-foreground">Open</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tasks" />
            <CommandEmpty>No tasks found.</CommandEmpty>
            <CommandList>
              <CommandGroup heading="Tasks">
                {options.map((opt) => (
                  <CommandItem
                    key={String(opt.id)}
                    value={`${String(opt.id)}:${opt.title}`}
                    onSelect={() => toggle(opt.id)}
                    className="cursor-pointer"
                  >
                    <Checkbox 
                      checked={selectedSet.has(String(opt.id))} 
                      className="mr-2" 
                    />
                    <span className="truncate flex-1">{opt.title}</span>
                    <Badge 
                      variant="secondary" 
                      className={cn("ml-2 text-[10px]", getStatusBadgeClass(opt.status))}
                    >
                      {formatStatus(opt.status)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
          <div className="border-t p-2 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {selectedCount} selected
            </div>
            <Button size="sm" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {hasSelectedDependencies && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {safeSelectedDependencies.map((id) => {
            const key = String(id);
            const meta = optionById.get(key);
            return (
              <Badge key={key} variant="outline" className="text-xs flex items-center gap-1.5">
                <span className="truncate max-w-[200px]">
                  {meta?.title ?? key}
                </span>
                {meta && (
                  <Badge
                    variant="secondary"
                    className={cn("text-[10px]", getStatusBadgeClass(meta.status))}
                  >
                    {formatStatus(meta.status)}
                  </Badge>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default TaskDependencySelector;

