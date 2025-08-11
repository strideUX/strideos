"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { TaskKanbanView, TaskKanbanTask } from "@/components/tasks/TaskKanbanView";
import { useState } from "react";

const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
const sizeHours = (size?: string) => SIZE_TO_HOURS[(size ?? "").toUpperCase()] ?? 0;

export function SprintTasksTab({ sprint }: { sprint: any }) {
  const tasks = useQuery(api.tasks.getTasks, sprint?._id ? { sprintId: sprint._id as any } : ("skip" as any));
  const assignTask = useMutation(api.tasks.assignTaskToSprint);
  const updateTask = useMutation(api.tasks.updateTask);

  const [view, setView] = useState<'table' | 'kanban'>(() => {
    if (typeof window === 'undefined') return 'table';
    return (localStorage.getItem('sprintTasks:view') as 'table' | 'kanban') || 'table';
  });
  const handleViewChange = (next: 'table' | 'kanban') => {
    setView(next);
    if (typeof window !== 'undefined') localStorage.setItem('sprintTasks:view', next);
  };

  const handleRemove = async (taskId: string) => {
    try {
      await assignTask({ taskId: taskId as any, sprintId: undefined });
      toast.success("Task removed from sprint");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove task");
    }
  };

  if (!tasks) return null;

  const committed = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? sizeHours(t.size)), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{tasks.length} tasks • {committed} committed hours</div>
        <ViewToggle view={view} onViewChange={handleViewChange} />
      </div>

      {view === 'kanban' ? (
        <Card>
          <CardContent className="p-3">
            <TaskKanbanView
              tasks={tasks as unknown as TaskKanbanTask[]}
              onTaskUpdate={async (taskId, updates) => {
                try {
                  await updateTask({ id: taskId, ...(updates as any) });
                } catch (e: any) {
                  toast.error(e?.message ?? 'Failed to update task');
                }
              }}
              isLoading={!tasks}
              showProjectName
            />
          </CardContent>
        </Card>
      ) : (
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
            {tasks.map((task) => (
              <TableRow key={task._id}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{task.project?.title ?? "—"}</TableCell>
                <TableCell>{task.assignee?.name ?? "Unassigned"}</TableCell>
                <TableCell><Badge variant="outline">{task.priority}</Badge></TableCell>
                <TableCell><Badge variant="outline">{task.size ?? "—"}</Badge></TableCell>
                <TableCell>{task.estimatedHours ?? sizeHours(task.size)}h</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleRemove(task._id)}>Remove</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}


