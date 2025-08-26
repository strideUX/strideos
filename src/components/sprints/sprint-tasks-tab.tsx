/**
 * SprintTasksTab - Task management interface for sprint planning and execution
 *
 * @remarks
 * Displays tasks assigned to a specific sprint with project, assignee, priority, and time estimates.
 * Supports removing tasks from sprints and provides committed hours calculations.
 * Integrates with sprint management workflow for capacity planning and task tracking.
 *
 * @example
 * ```tsx
 * <SprintTasksTab sprint={sprintData} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation } from "convex/react";

// 2. Internal imports
import { api } from "@/convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

// 3. Types
const SIZE_TO_HOURS: Record<string, number> = { 
  XS: 4, 
  S: 16, 
  M: 32, 
  L: 48, 
  XL: 64 
};

type SprintTask = {
  _id: Id<'tasks'>;
  title: string;
  priority: string;
  size?: string;
  estimatedHours?: number;
  project?: { title?: string } | null;
  assignee?: { name?: string } | null;
};

interface SprintData {
  _id: Id<'sprints'>;
}

interface SprintTasksTabProps {
  /** Sprint data containing the ID */
  sprint: SprintData;
}

// 4. Component definition
export const SprintTasksTab = memo(function SprintTasksTab({ 
  sprint 
}: SprintTasksTabProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const tasks = useQuery(api.tasks.getTasks, sprint?._id ? { sprintId: sprint._id } : "skip");
  const assignTask = useMutation(api.tasks.assignTaskToSprint);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const sizeHours = useCallback((size?: string): number => {
    return SIZE_TO_HOURS[(size ?? "").toUpperCase()] ?? 0;
  }, []);

  const committed = useMemo(() => {
    if (!tasks) return 0;
    return tasks.reduce((sum: number, t: SprintTask) => 
      sum + ((t as any).sizeHours ?? t.estimatedHours ?? sizeHours(t.size)), 0);
  }, [tasks, sizeHours]);

  const taskCount = useMemo(() => {
    return tasks?.length ?? 0;
  }, [tasks]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleRemove = useCallback(async (taskId: string) => {
    try {
      await assignTask({ 
        taskId: taskId as Id<'tasks'>, 
        sprintId: undefined 
      });
      toast.success("Task removed from sprint");
    } catch (error: unknown) {
      const e = error as { message?: string };
      toast.error(e?.message ?? "Failed to remove task");
    }
  }, [assignTask]);

  const getTaskHours = useCallback((task: SprintTask): number => {
    return (task as any).sizeHours ?? task.estimatedHours ?? sizeHours(task.size);
  }, [sizeHours]);

  const getTaskHoursDisplay = useCallback((task: SprintTask) => {
    const hours = getTaskHours(task);
    return hours ? (
      <Badge variant="outline">{hours}h</Badge>
    ) : (
      <Badge variant="secondary">Unestimated</Badge>
    );
  }, [getTaskHours]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!tasks) return null;

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {taskCount} tasks • {committed} committed hours
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task: SprintTask) => (
            <TableRow key={task._id}>
              <TableCell className="font-medium">{task.title}</TableCell>
              <TableCell>{task.project?.title ?? "—"}</TableCell>
              <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
              <TableCell>
                <Badge variant="outline">{task.priority}</Badge>
              </TableCell>
              <TableCell>
                {getTaskHoursDisplay(task)}
              </TableCell>
              <TableCell>{getTaskHours(task)}h</TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleRemove(task._id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});


