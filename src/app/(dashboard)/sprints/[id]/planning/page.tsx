"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SprintFormDialog } from "@/components/sprints/SprintFormDialog";
import CapacityBar from "@/components/sprints/CapacityBar";
import SprintTaskTable, { SprintTaskTableTask } from "@/components/sprints/SprintTaskTable";
import { toast } from "sonner";

export default function SprintPlanningPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();

  const sprint = useQuery(api.sprints.getSprint, params?.id ? { id: params.id as any } : ("skip" as any));
  const backlog = useQuery(
    api.sprints.getDepartmentBacklog,
    sprint ? { departmentId: (sprint as any).departmentId } : ("skip" as any)
  );

  const assignTaskToSprint = useMutation(api.tasks.assignTaskToSprint);

  const [showEdit, setShowEdit] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const targetPct = 80;

  const tasks: SprintTaskTableTask[] = useMemo(() => {
    const grouped = (backlog as any)?.groupedByProject ?? [];
    const out: SprintTaskTableTask[] = [];
    for (const group of grouped) {
      for (const t of group.tasks) {
        out.push({
          _id: t._id,
          title: t.title,
          assigneeName: t.assigneeName,
          estimatedHours: t.hours,
          priority: t.priority,
          projectId: group._id,
          projectName: group.name,
        });
      }
    }
    return out;
  }, [backlog]);

  const committedHours = useMemo(() => {
    const map = new Map(tasks.map((t) => [t._id, t.estimatedHours ?? 0]));
    let sum = 0;
    selectedTaskIds.forEach((id) => (sum += map.get(id) ?? 0));
    return Math.round(sum);
  }, [tasks, selectedTaskIds]);

  const capacityHours = (sprint as any)?.totalCapacity ?? 0;
  const capacityPct = capacityHours > 0 ? (committedHours / capacityHours) * 100 : 0;

  if (!user) return null;

  async function addSelectedToSprint() {
    if (!sprint?._id) return;
    if (selectedTaskIds.size === 0) {
      toast.message("Select tasks to add");
      return;
    }
    try {
      // Assign each selected task. Capacity enforcement occurs server-side.
      const ids = Array.from(selectedTaskIds);
      for (const taskId of ids) {
        await assignTaskToSprint({ taskId: taskId as any, sprintId: sprint._id as any });
      }
      toast.success(`Added ${ids.length} task(s) to sprint`);
      setSelectedTaskIds(new Set());
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add tasks to sprint");
    }
  }

  function onToggleTask(taskId: string) {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function onToggleProject(projectId: string) {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Sprint Planning</h1>
            <p className="text-muted-foreground">Select and manage tasks for this sprint</p>
          </div>
          <Button onClick={() => setShowEdit(true)}>Edit Details</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{sprint?.name}</CardTitle>
            <CardDescription>
              {sprint && new Date(sprint.startDate).toLocaleDateString()} → {sprint && new Date(sprint.endDate).toLocaleDateString()} • Capacity {capacityHours}h
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {/* Sticky capacity meter */}
            <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="text-muted-foreground">
                  {selectedTaskIds.size} selected • {committedHours}h / {capacityHours}h ({Math.round(capacityPct)}%)
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedTaskIds(new Set())}>Clear all</Button>
                  <Button size="sm" onClick={addSelectedToSprint} disabled={selectedTaskIds.size === 0}>Add to sprint</Button>
                </div>
              </div>
              <CapacityBar
                valuePct={capacityPct}
                targetPct={targetPct}
                committedHours={committedHours}
                capacityHours={capacityHours}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Target {targetPct}% • Remaining: {Math.max(0, Math.round(capacityHours * (targetPct / 100) - committedHours))}h
              </div>
            </div>

            {/* Table-based grouped task selector */}
            <div className="mt-4">
              <SprintTaskTable
                tasks={tasks}
                selectedTaskIds={selectedTaskIds}
                onToggleTask={onToggleTask}
                collapsedProjects={collapsedProjects}
                onToggleProject={onToggleProject}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      <SprintFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        sprint={sprint as any}
        initialClientId={(sprint as any)?.clientId as any}
        initialDepartmentId={(sprint as any)?.departmentId as any}
        onSuccess={() => setShowEdit(false)}
      />
    </>
  );
}


