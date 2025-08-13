"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SprintKanban } from "@/components/sprints/SprintKanban";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const router = useRouter();
  const inSprintTasks = useQuery(api.tasks.getTasks, sprint ? { sprintId: sprint._id } : "skip");

  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);
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
  const isActive = sprint?.status === "active";
  const [activeTab, setActiveTab] = useState<'work' | 'planning'>('work');

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{sprint?.name}</h1>
              <p className="text-muted-foreground">
                {sprint && new Date(sprint.startDate).toLocaleDateString()} → {sprint && new Date(sprint.endDate).toLocaleDateString()} • Capacity {capacityDays}
              </p>
            </div>
            <div className="pt-1">
              {isActive && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Active</Badge>
              )}
              {sprint?.status === 'review' && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">Review</Badge>
              )}
              {sprint?.status === 'complete' && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>Edit Details</Button>
                          {isPlanning && (
                <Button
                  onClick={async () => {
                    try {
                                             await startSprint({ id: sprint._id });
                       toast.success(`Sprint "${sprint.name}" has been started!`);
                       router.push('/sprints');
                    } catch (e: unknown) {
                      const error = e as { message?: string };
                      if (error?.message && error.message.includes('no tasks')) {
                        toast.error('Cannot start sprint: Please assign at least one task to this sprint first.');
                      } else {
                        toast.error(error?.message ?? 'Failed to start sprint');
                      }
                    }
                  }}
                >
                  Start Sprint
                </Button>
              )}
            {isActive && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button>Complete Sprint</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Complete sprint</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to complete the sprint?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await completeSprint({ id: sprint._id });
                          toast.success("Sprint completed");
                        } catch (e: unknown) {
                          const error = e as { message?: string };
                          toast.error(error?.message ?? "Failed to complete sprint");
                        }
                      }}
                    >
                      Complete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'work' | 'planning')} className="space-y-4">
            <TabsList>
              <TabsTrigger value="work">Work</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>
            <TabsContent value="work">
              {sprint?._id && <SprintKanban sprintId={sprint._id} />}
            </TabsContent>
            <TabsContent value="planning">
              <Card>
                <CardHeader>
                  <CardTitle>Task selection</CardTitle>
                  <CardDescription>Assign or remove tasks from this sprint.</CardDescription>
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
            </TabsContent>
          </Tabs>
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



