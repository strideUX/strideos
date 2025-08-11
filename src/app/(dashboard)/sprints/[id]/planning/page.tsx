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
  const inSprintQuery = useQuery(api.tasks.getTasks, sprint? { sprintId: (sprint as any)._id } : ("skip" as any));

  const assignTaskToSprint = useMutation(api.tasks.assignTaskToSprint);

  const [showEdit, setShowEdit] = useState(false);
  // Adds from backlog
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [collapsedBacklogProjects, setCollapsedBacklogProjects] = useState<Set<string>>(new Set());
  // Removals from current sprint
  const [selectedToRemove, setSelectedToRemove] = useState<Set<string>>(new Set());
  const [collapsedSprintProjects, setCollapsedSprintProjects] = useState<Set<string>>(new Set());
  const targetPct = 80;

  const backlogTasks: SprintTaskTableTask[] = useMemo(() => {
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

  const sprintTasks: SprintTaskTableTask[] = useMemo(() => {
    const list = (inSprintQuery as any) ?? [];
    return list.map((t: any) => ({
      _id: t._id,
      title: t.title,
      assigneeName: t.assignee?.name ?? t.assignee?.email,
      estimatedHours: t.estimatedHours ?? 0,
      priority: t.priority,
      projectId: t.projectId ?? "unknown",
      projectName: t.project?.title ?? "Uncategorized",
    }));
  }, [inSprintQuery]);

  const currentCommittedHours = useMemo(
    () => Math.round(sprintTasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0)),
    [sprintTasks]
  );
  const hoursToAdd = useMemo(() => {
    const map = new Map(backlogTasks.map((t) => [t._id, t.estimatedHours ?? 0]));
    let sum = 0;
    selectedToAdd.forEach((id) => (sum += map.get(id) ?? 0));
    return Math.round(sum);
  }, [backlogTasks, selectedToAdd]);
  const hoursToRemove = useMemo(() => {
    const map = new Map(sprintTasks.map((t) => [t._id, t.estimatedHours ?? 0]));
    let sum = 0;
    selectedToRemove.forEach((id) => (sum += map.get(id) ?? 0));
    return Math.round(sum);
  }, [sprintTasks, selectedToRemove]);

  const finalCommitted = Math.max(0, currentCommittedHours + hoursToAdd - hoursToRemove);
  const capacityHours = (sprint as any)?.totalCapacity ?? 0;
  const capacityPct = capacityHours > 0 ? (finalCommitted / capacityHours) * 100 : 0;

  const hasChanges = selectedToAdd.size > 0 || selectedToRemove.size > 0;

  if (!user) return null;

  async function saveChanges() {
    if (!sprint?._id || !hasChanges) return;
    try {
      const addIds = Array.from(selectedToAdd);
      for (const id of addIds) {
        await assignTaskToSprint({ taskId: id as any, sprintId: sprint._id as any });
      }
      const removeIds = Array.from(selectedToRemove);
      for (const id of removeIds) {
        await assignTaskToSprint({ taskId: id as any, sprintId: undefined });
      }
      toast.success("Sprint updated");
      setSelectedToAdd(new Set());
      setSelectedToRemove(new Set());
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save changes");
    }
  }

  function onToggleAdd(taskId: string) {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }
  function onToggleRemove(taskId: string) {
    setSelectedToRemove((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function onToggleBacklogProject(projectId: string) {
    setCollapsedBacklogProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  }
  function onToggleSprintProject(projectId: string) {
    setCollapsedSprintProjects((prev) => {
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
            <h1 className="text-2xl font-semibold">{sprint?.name}</h1>
            <p className="text-muted-foreground">
              {sprint && new Date(sprint.startDate).toLocaleDateString()} → {sprint && new Date(sprint.endDate).toLocaleDateString()} • Capacity {capacityHours}h
            </p>
          </div>
          <Button onClick={() => setShowEdit(true)}>Edit Details</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Task Selection</CardTitle>
            <CardDescription>Choose tasks to add or remove from this sprint</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {/* Sticky capacity meter */}
            <div className="sticky top-16 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="text-muted-foreground">
                  Pending: +{hoursToAdd}h −{hoursToRemove}h • Final {finalCommitted}h / {capacityHours}h ({Math.round(capacityPct)}%)
                </div>
                <div className="flex items-center gap-2">
                  {sprint?.status === "active" && (
                    <span className="text-amber-600 mr-2">Changing the scope could impact delivery</span>
                  )}
                  <Button size="sm" onClick={saveChanges} disabled={!hasChanges}>Save changes</Button>
                </div>
              </div>
              <CapacityBar
                valuePct={capacityPct}
                targetPct={targetPct}
                committedHours={finalCommitted}
                capacityHours={capacityHours}
              />
              <div className="mt-1 text-xs text-muted-foreground">
                Target {targetPct}% • Remaining: {Math.max(0, Math.round(capacityHours * (targetPct / 100) - finalCommitted))}h
              </div>
            </div>

            {/* In this sprint */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">In this sprint</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedToRemove(new Set())}>Clear all</Button>
              </div>
              <SprintTaskTable
                tasks={sprintTasks}
                selectedTaskIds={selectedToRemove}
                onToggleTask={onToggleRemove}
                collapsedProjects={collapsedSprintProjects}
                onToggleProject={onToggleSprintProject}
              />
            </div>

            {/* Backlog */}
            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">Backlog</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedToAdd(new Set())}>Clear all</Button>
              </div>
              <SprintTaskTable
                tasks={backlogTasks}
                selectedTaskIds={selectedToAdd}
                onToggleTask={onToggleAdd}
                collapsedProjects={collapsedBacklogProjects}
                onToggleProject={onToggleBacklogProject}
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


