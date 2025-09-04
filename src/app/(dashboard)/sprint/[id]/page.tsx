"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapacityBar } from "@/components/sprints/capacity-bar";
import { SprintTaskTable } from "@/components/sprints/sprint-task-table";
import { SprintFormDialog } from "@/components/sprints/sprint-form-dialog";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SprintKanban } from "@/components/sprints/sprint-kanban";
import { TaskFormDialog } from "@/components/admin/task-form-dialog";
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
import { IconGripVertical, IconSearch, IconArrowNarrowUp, IconArrowNarrowDown, IconArrowsDiff, IconFlame } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Id as ConvexId, Doc } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function DroppableArea({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={className}>{children}</div>
  );
}

function SortableSprintRow({ task, onOpen, onRemove }: { task: any; onOpen: () => void; onRemove: () => void | Promise<void> }) {
  const rowId = `sprint-row-${String(task._id)}`;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rowId });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  const sizeMap: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
  const hours = Math.round((task as any).sizeHours ?? task.estimatedHours ?? (task.size ? sizeMap[String(task.size).toUpperCase()] : 0));
  return (
    <TableRow
      ref={setNodeRef}
      id={rowId}
      style={style}
      className="cursor-pointer"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle]') || target.closest('button')) return;
        onOpen();
      }}
    >
      <TableCell className="w-8">
        <DragHandleButton {...attributes} {...listeners} />
      </TableCell>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell>
        <Badge className={statusBadgeClass(String(task.status))}>{statusLabel(String(task.status))}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={(task as any).assignee?.image} />
            <AvatarFallback className="text-xs">{(task as any).assignee?.name?.[0]?.toUpperCase() || (task as any).assignee?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-sm">{(task as any).assignee?.name || (task as any).assignee?.email || 'Assigned'}</span>
        </div>
      </TableCell>
      <TableCell className="text-center"><div className="flex items-center justify-center">{getPriorityIcon(String(task.priority))}</div></TableCell>
      <TableCell className="text-sm">{hours}h</TableCell>
      <TableCell className="text-right text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-slate-400">No due date</span>}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); await onRemove(); }}>
          <IconArrowNarrowDown className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function SortableProjectRow({ projectId, task, onOpen, onAdd }: { projectId: string; task: any; onOpen: () => void; onAdd: () => void | Promise<void> }) {
  const rowId = `proj-row-${projectId}:${String(task._id)}`;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: rowId });
  const style = { transform: CSS.Transform.toString(transform), transition } as React.CSSProperties;
  const sizeMap: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
  const hours = Math.round((task as any).hours ?? (task.size ? sizeMap[String(task.size).toUpperCase()] : (task as any).estimatedHours ?? 0));
  return (
    <TableRow
      ref={setNodeRef}
      id={rowId}
      style={style}
      className="cursor-pointer"
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('[data-drag-handle]') || target.closest('button')) return;
        onOpen();
      }}
    >
      <TableCell className="w-8"><DragHandleButton {...attributes} {...listeners} /></TableCell>
      <TableCell className="font-medium">{task.title}</TableCell>
      <TableCell>
        <Badge className={statusBadgeClass(String(task.status))}>{statusLabel(String(task.status))}</Badge>
      </TableCell>
      <TableCell>
        {task.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={task.assignee?.image} />
              <AvatarFallback className="text-xs">{task.assignee?.name?.[0]?.toUpperCase() || task.assignee?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{task.assignee?.name || task.assignee?.email}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-center"><div className="flex items-center justify-center">{getPriorityIcon(String(task.priority))}</div></TableCell>
      <TableCell className="text-sm">{hours}h</TableCell>
      <TableCell className="text-right text-sm">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="text-slate-400">No due date</span>}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" variant="ghost" onClick={async (e) => { e.stopPropagation(); await onAdd(); }}>
          <IconArrowNarrowUp className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
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

// Helpers for status/priority styling consistent with Projects
function statusLabel(s: string): string {
  switch (s) {
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'review': return 'Review';
    case 'done': return 'Completed';
    default: return String(s ?? '');
  }
}

function statusBadgeClass(s: string): string {
  switch (s) {
    case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    case 'done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    default: return 'bg-muted text-foreground';
  }
}

function getPriorityIcon(p: string) {
  switch (p) {
    case 'low':
      return <IconArrowNarrowDown className="h-4 w-4 text-blue-500" aria-label="Low priority" title="Low" />;
    case 'medium':
      return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Medium priority" title="Medium" />;
    case 'high':
      return <IconArrowNarrowUp className="h-4 w-4 text-orange-500" aria-label="High priority" title="High" />;
    case 'urgent':
      return <IconFlame className="h-4 w-4 text-red-600" aria-label="Urgent priority" title="Urgent" />;
    default:
      return <IconArrowsDiff className="h-4 w-4 text-gray-400" aria-label="Priority" title={String(p)} />;
  }
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
  const teamCapacity = useQuery(api.sprints.getSprintTeamCapacity, sprint ? { sprintId: sprint._id } : 'skip') as any;

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

        {/* Planning with DnD: single Sprint Backlog card (header + capacity + team + list) */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-4">
            <Card className="gap-3 py-3">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base">Sprint Overview</CardTitle>
                <CardDescription>Plan the sprint by adding tasks and managing capacity</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {/* Capacity Bar (larger) */}
                <div className="mb-3 pb-3 border-b border-muted/40">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="text-md font-bold text-muted-foreground">Capacity</div>
                    <div className="text-xs font-medium">{committedHours}h of {capacityHours}h ({Math.round(pct)}%)</div>
                  </div>
                  <div className="h-5 mb-5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${pct < 80 ? 'bg-emerald-500' : pct <= 95 ? 'bg-amber-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                    />
                  </div>
                  {/* Team capacity strip */}
                  {Array.isArray(teamCapacity?.members) && teamCapacity.members.length > 0 && (
                    <div className="flex px-1 gap-4 overflow-x-auto py-2">
                      {teamCapacity.members.map((m: any) => {
                        const total = Math.round(m.committedHours ?? 0);
                        const cap = Math.round(m.capacityHours ?? 80);
                        const pctMember = cap > 0 ? Math.min(100, Math.round((total / cap) * 100)) : 0;
                        const color = pctMember < 80 ? 'bg-emerald-500' : (pctMember <= 95 ? 'bg-amber-500' : 'bg-red-600');
                        const initials = (m.name || m.email || 'U').split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase();
                        return (
                          <div key={String(m._id)} className="min-w-[220px]">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={m.image} />
                                <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="text-sm font-medium truncate">{m.name || m.email}</div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">{total}h / {cap}h</div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-1">
                              <div className={`h-full ${color}`} style={{ width: `${pctMember}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sprint Backlog list (droppable) */}
                <div className="pt-1">
                  <DroppableArea id="sprint-drop" className="min-h-[150px]">
                    {sprintBacklog.length === 0 ? (
                      <div className="p-6 text-sm text-muted-foreground">No tasks in sprint. Drag from Projects Backlog →</div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="font-bold">Task</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="font-bold">Assignee</TableHead>
                            <TableHead className="font-bold text-center">Priority</TableHead>
                            <TableHead className="font-bold">Size (hours)</TableHead>
                            <TableHead className="font-bold text-right">Due</TableHead>
                            <TableHead className="font-bold text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <SortableContext items={sprintBacklog.map((t: any) => `sprint-row-${t._id}`)} strategy={verticalListSortingStrategy}>
                            {sprintBacklog.map((t: any) => (
                              <SortableSprintRow
                                key={String(t._id)}
                                task={t}
                                onOpen={() => { setTaskFormTask(t); setIsTaskFormOpen(true); }}
                                onRemove={async () => { await assignTaskToSprint({ taskId: t._id as any, sprintId: undefined }); toast.success('Moved to project backlog'); }}
                              />
                            ))}
                          </SortableContext>
                        </TableBody>
                      </Table>
                    )}
                  </DroppableArea>
                </div>
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
                              <TableHead className="font-bold">Task</TableHead>
                              <TableHead className="font-bold">Status</TableHead>
                              <TableHead className="font-bold">Assignee</TableHead>
                              <TableHead className="font-bold text-center">Priority</TableHead>
                              <TableHead className="font-bold">Size (hours)</TableHead>
                              <TableHead className="font-bold text-right">Due</TableHead>
                              <TableHead className="font-bold text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <SortableContext items={g.tasks.map((t: any) => `proj-row-${g._id}:${t._id}`)} strategy={verticalListSortingStrategy}>
                              {g.tasks.map((t: any) => (
                                <SortableProjectRow
                                  key={String(t._id)}
                                  projectId={String(g._id)}
                                  task={t}
                                  onOpen={() => { setTaskFormTask(t); setIsTaskFormOpen(true); }}
                                  onAdd={async () => { if (!sprint?._id) return; await assignTaskToSprint({ taskId: t._id as any, sprintId: sprint._id }); toast.success('Added to sprint'); }}
                                />
                              ))}
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



