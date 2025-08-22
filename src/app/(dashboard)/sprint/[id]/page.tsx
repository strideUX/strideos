"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-hooks";
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
import { TaskFormDialog } from "@/components/admin/TaskFormDialog";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconGripVertical, IconSearch, IconArrowNarrowUp, IconArrowNarrowDown } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Id as ConvexId, Doc } from "@/convex/_generated/dataModel";

function DroppableArea({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>{children}</div>
  );
}

function useSortableRow(id: string) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  return { attributes, listeners, setNodeRef, style, isDragging };
}

function DragHandleButton(props: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} data-drag-handle aria-label="Drag to reorder" className={(props.className ?? '') + ' text-muted-foreground hover:text-foreground'}>
      <IconGripVertical className="h-4 w-4" />
    </button>
  );
}

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
  const teamOverview = useQuery(api.users.getTeamOverview, sprint ? { departmentId: sprint.departmentId } : 'skip') as any;

  const startSprint = useMutation(api.sprints.startSprint);
  const completeSprint = useMutation(api.sprints.completeSprint);
  const assignTaskToSprint = useMutation(api.tasks.assignTaskToSprint);
  const reorderSprintTasks = useMutation(api.tasks.reorderSprintTasks);
  const reorderProjectTasks = useMutation(api.tasks.reorderProjectTasks);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormTask, setTaskFormTask] = useState<any | null>(null);

  const capacityHours = sprint?.totalCapacity ?? 0;

  // Build two lists: sprint backlog and projects backlog (grouped by project)
  const sprintBacklog = useMemo(() => (
    (inSprintTasks || [])
      .filter((t: any) => t.status !== 'done' && t.status !== 'archived')
      .sort((a: any, b: any) => ((a.sprintOrder ?? 1e9) - (b.sprintOrder ?? 1e9)))
  ), [inSprintTasks]);

  const projectsBacklog = useMemo(() => {
    const groups = new Map<string, { _id: string; name: string; tasks: any[] }>();
    const byProject = backlog?.groupedByProject || [];
    for (const g of byProject) {
      const tasks = (g.tasks || []).filter((t: any) => !t.sprintId && t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (tasks.length === 0) continue;
      // Sort by projectOrder/backlogOrder (already sorted in API, but guard)
      tasks.sort((a: any, b: any) => {
        const ao = (typeof a.projectOrder === 'number' ? a.projectOrder : (typeof a.backlogOrder === 'number' ? a.backlogOrder : 1e9));
        const bo = (typeof b.projectOrder === 'number' ? b.projectOrder : (typeof b.backlogOrder === 'number' ? b.backlogOrder : 1e9));
        return ao - bo;
      });
      groups.set(String(g._id), { _id: String(g._id), name: g.name, tasks });
    }
    return Array.from(groups.values());
  }, [backlog, searchQuery]);

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

  const committedHours = useMemo(() => {
    const list = inSprintTasks ?? [];
    return Math.round(list.reduce((sum: number, t: { estimatedHours?: number }) => sum + (((t as any).sizeHours ?? t.estimatedHours ?? 0) as number), 0));
  }, [inSprintTasks]);
  const pct = capacityHours > 0 ? (committedHours / capacityHours) * 100 : 0;
  const unestimatedTasks = useMemo(() => {
    const list = (backlog?.tasks ?? []) as any[];
    return list.filter((t) => ((t.hours ?? 0) === 0));
  }, [backlog]);

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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);
    if (!over || !sprint?._id) return;

    const activeId = String(active.id) as Id<"tasks">;
    const overId = String(over.id);

    // Two containers: sprint-list and project-<id> lists. Over.id could be droppable container id or row id.
    // Handle reorder within sprint list
    if (overId.startsWith('sprint-row-')) {
      const overTaskId = overId.replace('sprint-row-', '') as any;
      const list = sprintBacklog;
      const oldIndex = list.findIndex((t: any) => String(t._id) === String(activeId));
      const newIndex = list.findIndex((t: any) => String(t._id) === String(overTaskId));
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(list, oldIndex, newIndex).map((t: any) => t._id);
        await reorderSprintTasks({ sprintId: sprint._id, taskIds: newOrder as any });
        toast.success('Sprint order updated');
      }
      return;
    }

    // Dropping onto sprint container from a project backlog (move into sprint)
    if (overId === 'sprint-drop') {
      await assignTaskToSprint({ taskId: activeId as any, sprintId: sprint._id });
      toast.success('Added to sprint');
      return;
    }

    // Reorder within a project backlog group
    if (overId.startsWith('proj-row-')) {
      const [_, projectId, rowTaskId] = overId.split(':');
      const group = projectsBacklog.find(g => String(g._id) === String(projectId));
      if (group) {
        const list = group.tasks;
        const oldIndex = list.findIndex((t: any) => String(t._id) === String(activeId));
        const newIndex = list.findIndex((t: any) => String(t._id) === String(rowTaskId));
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(list, oldIndex, newIndex).map((t: any) => t._id);
          await reorderProjectTasks({ projectId: projectId as any, taskIds: newOrder as any });
          toast.success('Backlog order updated');
        }
      }
      return;
    }
  };

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{sprint?.name}</h1>
              <p className="text-muted-foreground">{sprint && new Date(sprint.startDate).toLocaleDateString()} → {sprint && new Date(sprint.endDate).toLocaleDateString()}</p>
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

        {/* Top Capacity Visualization */}
        <Card>
          <CardContent className="pt-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sprint capacity</div>
              <div className="text-sm font-medium">{committedHours}h of {capacityHours}h ({Math.round(pct)}%)</div>
            </div>
            <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${pct < 80 ? 'bg-emerald-500' : pct <= 95 ? 'bg-amber-500' : 'bg-red-600'}`}
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Compact Team Capacity Row */}
        {Array.isArray(teamOverview?.members) && teamOverview.members.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <div className="flex gap-3 overflow-x-auto">
                {teamOverview.members.map((m: any) => {
                  const total = Math.round(m.totalHours ?? 0);
                  const cap = 80; // assume 2-week sprint baseline per member (40h/week * 2)
                  const pctMember = Math.min(100, Math.round((total / cap) * 100));
                  const color = pctMember < 80 ? 'bg-emerald-500' : (pctMember <= 95 ? 'bg-amber-500' : 'bg-red-600');
                  return (
                    <div key={String(m._id)} className="min-w-[180px] flex-1">
                      <div className="text-sm font-medium truncate">{m.name || m.email}</div>
                      <div className="text-xs text-muted-foreground mb-1">{total}h / {cap}h</div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className={`h-full ${color}`} style={{ width: `${pctMember}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Planning UI with two lists */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Sprint Backlog (In Focus-like) */}
            <Card className="py-1">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Sprint Backlog</CardTitle>
                <CardDescription>Drag to reorder. Drop from right to add.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <DroppableArea id="sprint-drop" className="min-h-[150px]">
                  {sprintBacklog.length === 0 ? (
                    <div className="p-6 text-sm text-muted-foreground">No tasks in sprint. Drag from Projects Backlog →</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Task</TableHead>
                          <TableHead>Assignee</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext items={sprintBacklog.map((t: any) => `sprint-row-${t._id}`)} strategy={verticalListSortingStrategy}>
                          {sprintBacklog.map((t: any) => {
                            const { attributes, listeners, setNodeRef, style } = useSortableRow(`sprint-row-${String(t._id)}`);
                            const h = Math.round((t as any).sizeHours ?? t.estimatedHours ?? 0);
                            return (
                              <TableRow
                                ref={setNodeRef}
                                key={String(t._id)}
                                id={`sprint-row-${String(t._id)}`}
                                style={style}
                                className="cursor-pointer"
                                onClick={(e) => {
                                  const target = e.target as HTMLElement;
                                  if (target.closest('[data-drag-handle]') || target.closest('button')) return;
                                  setTaskFormTask(t);
                                  setIsTaskFormOpen(true);
                                }}
                              >
                                <TableCell className="w-8">
                                  <DragHandleButton {...attributes} {...listeners} />
                                </TableCell>
                                <TableCell className="font-medium">{t.title}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{(t as any).assignee?.name || (t as any).assignee?.email || ''}</TableCell>
                                <TableCell className="text-right text-sm">{h}h</TableCell>
                                <TableCell className="text-right">
                                  <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); await assignTaskToSprint({ taskId: t._id as any, sprintId: undefined }); toast.success('Moved to project backlog'); }}>
                                    <IconArrowNarrowDown className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  )}
                </DroppableArea>
              </CardContent>
            </Card>

            {/* Projects Backlog (grouped like Projects page) */}
            <Card className="py-1">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Projects Backlog</CardTitle>
                <div className="mt-2">
                  <div className="relative">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div>
                  {projectsBacklog.map((g) => (
                    <div key={`proj-${g._id}`} className="border-t first:border-t-0">
                      <div className="px-4 py-2 bg-muted/40 text-sm font-semibold">{g.name}</div>
                      <DroppableArea id={`proj-drop-${g._id}`} className="">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead>Task</TableHead>
                              <TableHead>Assignee</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <SortableContext items={g.tasks.map((t: any) => `proj-row-${g._id}:${t._id}`)} strategy={verticalListSortingStrategy}>
                              {g.tasks.map((t: any) => {
                                const { attributes, listeners, setNodeRef, style } = useSortableRow(`proj-row-${g._id}:${String(t._id)}`);
                                return (
                                  <TableRow
                                    ref={setNodeRef}
                                    key={String(t._id)}
                                    id={`proj-row-${g._id}:${String(t._id)}`}
                                    style={style}
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      const target = e.target as HTMLElement;
                                      if (target.closest('[data-drag-handle]') || target.closest('button')) return;
                                      setTaskFormTask(t);
                                      setIsTaskFormOpen(true);
                                    }}
                                  >
                                    <TableCell className="w-8"><DragHandleButton {...attributes} {...listeners} /></TableCell>
                                    <TableCell className="font-medium">{t.title}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{t.assigneeName || ''}</TableCell>
                                    <TableCell className="text-right">
                                      <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); if (!sprint?._id) return; await assignTaskToSprint({ taskId: t._id as any, sprintId: sprint._id }); toast.success('Added to sprint'); }}>
                                        <IconArrowNarrowUp className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </SortableContext>
                          </TableBody>
                        </Table>
                      </DroppableArea>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Drag overlay, minimal */}
          <DragOverlay>
            {activeTaskId ? (
              <div className="bg-background border rounded px-3 py-2 text-sm shadow">Reordering…</div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Dialog */}
      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={taskFormTask as any}
        onSuccess={() => setIsTaskFormOpen(false)}
      />

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



