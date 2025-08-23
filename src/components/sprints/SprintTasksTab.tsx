"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
const sizeHours = (size?: string) => SIZE_TO_HOURS[(size ?? "").toUpperCase()] ?? 0;

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

export function SprintTasksTab({ sprint }: { sprint: SprintData }) {
  const tasks = useQuery(api.tasks.getTasks, sprint?._id ? { sprintId: sprint._id } : "skip");
  const assignTask = useMutation(api.tasks.assignTaskToSprint);

  const handleRemove = async (taskId: string) => {
    try {
      await assignTask({ taskId: taskId as Id<'tasks'>, sprintId: undefined });
      toast.success("Task removed from sprint");
    } catch (error: unknown) {
      const e = error as { message?: string };
      toast.error(e?.message ?? "Failed to remove task");
    }
  };

  if (!tasks) return null;

  const committed = tasks.reduce((sum: number, t: SprintTask) => sum + ((t as any).sizeHours ?? t.estimatedHours ?? sizeHours(t.size)), 0 as number);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{tasks.length} tasks • {committed} committed hours</div>
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
              <TableCell><Badge variant="outline">{task.priority}</Badge></TableCell>
              <TableCell>
                {(() => {
                  const hours = ((task as any).sizeHours ?? task.estimatedHours ?? sizeHours(task.size));
                  return hours ? (
                    <Badge variant="outline">{hours}h</Badge>
                  ) : (
                    <Badge variant="secondary">Unestimated</Badge>
                  );
                })()}
              </TableCell>
              <TableCell>{((task as any).sizeHours ?? task.estimatedHours ?? sizeHours(task.size))}h</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => handleRemove(task._id)}>Remove</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


