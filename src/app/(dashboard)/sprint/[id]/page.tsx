"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/components/providers/AuthProvider";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CapacityBar from "@/components/sprints/CapacityBar";
import SprintTaskTable, { SprintTaskTableTask } from "@/components/sprints/SprintTaskTable";
import { SprintFormDialog } from "@/components/sprints/SprintFormDialog";
import { toast } from "sonner";

function formatHoursAsDays(hours?: number): string {
  const h = Math.max(0, Math.round((hours ?? 0) * 10) / 10);
  const days = h / 8;
  const roundedHalf = Math.round(days * 2) / 2;
  return `${roundedHalf}${roundedHalf === 1 ? "d" : "d"}`;
}

export default function SprintDetailsPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const sprint = useQuery(api.sprints.getSprint, params?.id ? { id: params.id as Id<"sprints"> } : "skip");

  const backlog = useQuery(
    api.sprints.getDepartmentBacklog,
    sprint ? { departmentId: sprint.departmentId, currentSprintId: sprint._id } : "skip"
  );
  const inSprintTasks = useQuery(api.tasks.getTasks, sprint ? { sprintId: sprint._id } : "skip");

  const startSprint = useMutation(api.sprints.startSprint);
  const assignTaskToSprint = useMutation(api.tasks.assignTaskToSprint);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const capacityHours = sprint?.totalCapacity ?? 0;
  const capacityDays = formatHoursAsDays(capacityHours);

  const backlogTasks: SprintTaskTableTask[] = useMemo(() => {
    const groups = backlog?.groupedByProject ?? [];
    const out: SprintTaskTableTask[] = [];
    for (const g of groups) {
      for (const t of g.tasks) {
        out.push({
          _id: t._id,
          title: t.title,
          assigneeName: t.assigneeName,
          estimatedHours: t.hours,
          priority: t.priority,
          projectId: g._id,
          projectName: g.name,
        });
      }
    }
    return out;
  }, [backlog]);

  async function onToggleTask(taskId: string) {
    if (!sprint?._id) return;
    const willSelect = !selectedTaskIds.has(taskId);
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
    try {
      await assignTaskToSprint({ taskId: taskId as Id<"tasks">, sprintId: willSelect ? sprint._id : undefined });
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message ?? "Failed to update sprint assignment");
    }
  }

  function onToggleProject(projectId: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  const committedHours = useMemo(() => {
    const list = inSprintTasks ?? [];
    return Math.round(list.reduce((sum: number, t: { estimatedHours?: number }) => sum + (t.estimatedHours ?? 0), 0));
  }, [inSprintTasks]);
  const pct = capacityHours > 0 ? (committedHours / capacityHours) * 100 : 0;

  // Initialize selection from tasks already assigned to this sprint so checkboxes reflect persisted state
  useEffect(() => {
    const list = inSprintTasks ?? [];
    const ids = new Set<string>(list.map((t: { _id: string }) => t._id));
    setSelectedTaskIds(ids);
  }, [inSprintTasks]);

  if (!user) return null;

  const isPlanning = sprint?.status === "planning";

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{sprint?.name}</h1>
            <p className="text-muted-foreground">
              {sprint && new Date(sprint.startDate).toLocaleDateString()} → {sprint && new Date(sprint.endDate).toLocaleDateString()} • Capacity {capacityDays}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Details</Button>
            {isPlanning ? (
              <Button
                onClick={async () => {
                  try {
                    await startSprint({ id: sprint._id });
                    toast.success("Sprint started");
                  } catch (e: unknown) {
                    const error = e as { message?: string };
                    toast.error(error?.message ?? "Failed to start sprint");
                  }
                }}
              >
                Start Sprint
              </Button>
            ) : (
              <Badge variant="outline">{String(sprint?.status || "")}</Badge>
            )}
          </div>
        </div>

        {isPlanning ? (
          <Card>
            <CardHeader>
              <CardTitle>Task selection</CardTitle>
              <CardDescription>Select tasks for this sprint. Changes save automatically.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <CapacityBar valuePct={pct} targetPct={80} committedHours={committedHours} capacityHours={capacityHours} />
              </div>
              <SprintTaskTable
                tasks={backlogTasks}
                selectedTaskIds={selectedTaskIds}
                onToggleTask={onToggleTask}
                collapsedProjects={collapsedProjects}
                onToggleProject={onToggleProject}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Tasks in this sprint</CardTitle>
              <CardDescription>Read-only list of assigned tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {inSprintTasks?.length ? (
                inSprintTasks.map((t: { _id: string; title: string; description?: string; assignee?: { name?: string; email?: string }; estimatedHours?: number; priority: string }) => (
                  <div key={t._id} className="grid grid-cols-12 items-center rounded border p-2">
                    <div className="col-span-6">
                      <div className="font-medium text-sm">{t.title}</div>
                      {t.description && <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground truncate">{t.assignee?.name ?? t.assignee?.email ?? "Unassigned"}</div>
                    <div className="col-span-2 text-sm">{formatHoursAsDays(t.estimatedHours ?? 0)}</div>
                    <div className="col-span-1 text-right text-xs uppercase text-muted-foreground">{t.priority}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No tasks assigned.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <SprintFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        sprint={sprint}
        initialClientId={sprint?.clientId}
        initialDepartmentId={sprint?.departmentId}
        onSuccess={() => setEditOpen(false)}
      />
    </>
  );
}



