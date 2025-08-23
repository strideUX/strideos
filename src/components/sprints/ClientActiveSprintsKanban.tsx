'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id, Doc } from '@/convex/_generated/dataModel';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconClock, IconPencil, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame, IconBuilding, IconSquare, IconLoader, IconEye, IconSquareCheck } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { IconSearch } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { TaskFormDialog } from '@/components/admin/TaskFormDialog';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

type EnrichedTask = Doc<'tasks'> & {
  project?: { _id: Id<'projects'>; title: string } | null;
  sprint?: { _id: Id<'sprints'>; name: string } | null;
};

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

function getCountBadgeClass(status: TaskStatus): string {
  switch (status) {
    case 'todo':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'review':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'done':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function ClientActiveSprintsKanban({ clientId }: { clientId: Id<'clients'> }) {
  // All tasks for active sprints for this client
  const activeSprints = useQuery(api.sprints.getSprints, { status: 'active', clientId });
  const tasks = useQuery(api.tasks.getTasks, {}); // we'll filter client-wise below since server filters by fields
  const departments = useQuery(api.departments.listDepartments as any, {} as any) as any[] | undefined;
  const [departmentId, setDepartmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const updateTask = useMutation(api.tasks.updateTask);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  const filteredDepartments = useMemo(() => {
    const list = (departments || []).filter((d: any) => String(d.clientId) === String(clientId));
    return list;
  }, [departments, clientId]);

  const filteredActiveSprints = useMemo(() => {
    const list = (activeSprints || []) as any[];
    if (departmentId === 'all') return list;
    return list.filter((s) => String(s.departmentId) === String(departmentId));
  }, [activeSprints, departmentId]);

  const sprintIdSet = new Set<string>((filteredActiveSprints || []).map((s: any) => s._id as string));
  const filteredTasks: EnrichedTask[] = ((tasks as any[]) || [])
    .filter((t) => t.clientId === clientId && t.sprintId && sprintIdSet.has(t.sprintId as string))
    .filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return String(t.title || '').toLowerCase().includes(q);
    })
    .map((t) => t as EnrichedTask);

  const selectedDeptName = useMemo(() => {
    if (departmentId === 'all') return 'All Active Sprints';
    const d = filteredDepartments.find((d: any) => String(d._id) === String(departmentId));
    return d ? `${d.name} Sprint` : 'All Active Sprints';
  }, [departmentId, filteredDepartments]);

  const grouped = useMemo((): Record<TaskStatus, EnrichedTask[]> => {
    const initial: Record<TaskStatus, EnrichedTask[]> = { todo: [], in_progress: [], review: [], done: [] };
    for (const t of filteredTasks || []) {
      const status = (t.status as TaskStatus) || 'todo';
      if (['todo', 'in_progress', 'review', 'done'].includes(status)) initial[status].push(t);
      else initial['todo'].push(t);
    }
    return initial;
  }, [filteredTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    const found = filteredTasks.find((t) => (t as any)._id === id) || null;
    setActiveTask(found as any);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const overId = String(over.id);
    let targetStatus: TaskStatus | null = null;
    if (overId.startsWith('column:')) targetStatus = overId.split(':')[1] as TaskStatus;
    if (!targetStatus) return;
    try {
      await updateTask({ id: active.id as Id<'tasks'>, status: targetStatus });
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task');
    }
  };

  if (activeSprints === undefined || tasks === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">Active Sprints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">Loading…</div>
        </CardContent>
      </Card>
    );
  }

  if ((activeSprints?.length ?? 0) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">All Sprints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-2xl text-muted-foreground mb-2">⋯⋯</div>
            <div className="text-base font-medium">No active sprints</div>
            <div className="text-sm text-muted-foreground">Start a sprint to see tasks here across all active sprints.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if ((filteredActiveSprints?.length ?? 0) === 0) {
    return (
      <Card className="pt-2">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-md font-semibold">{selectedDeptName}</CardTitle>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-2">
            <div className="col-span-9 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="col-span-3">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Sprints</SelectItem>
                  {(filteredDepartments || []).map((d: any) => (
                    <SelectItem key={String(d._id)} value={String(d._id)}>{d.name} Sprint</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="text-2xl text-muted-foreground mb-2">⋯⋯</div>
            <div className="text-base font-medium">No active sprints</div>
            <div className="text-sm text-muted-foreground">Start a sprint to see tasks here across the selected department.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Card className="pt-2 gap-3 py-3">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-md font-semibold">{selectedDeptName}</CardTitle>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-2">
            <div className="col-span-9 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="col-span-3">
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Sprints</SelectItem>
                  {(filteredDepartments || []).map((d: any) => (
                    <SelectItem key={String(d._id)} value={String(d._id)}>{d.name} Sprint</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
            {STATUS_COLUMNS.map(({ key, label }, index) => {
              const columnTasks = grouped[key];
              const separatorClass = index === 0 ? '' : 'md:border-l border-border/60';
              return (
                <div key={key} className={`px-2 md:px-3 ${separatorClass}`}>
                  <div className="py-2 flex items-center justify-between">
                    <div className="text-md font-semibold inline-flex items-center gap-1.5">
                      <span>{label}</span>
                      {getStatusIcon(key)}
                    </div>
                    <Badge className={`${statusBadgeClass(String(key))} border-transparent`}>{columnTasks.length}</Badge>
                  </div>
                  <SortableContext items={columnTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                    <ColumnDroppable id={`column:${key}`}>
                      <div className="min-h-[120px] space-y-2 pb-2">
                        {columnTasks.length === 0 ? (
                          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">Empty</div>
                        ) : (
                          columnTasks.map((task) => (
                            <KanbanTaskCard
                              key={task._id}
                              task={task}
                              onOpenTask={(t) => {
                                setEditingTask(t);
                                setIsTaskDialogOpen(true);
                              }}
                            />
                          ))
                        )}
                      </div>
                    </ColumnDroppable>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <DragOverlay>
        {activeTask ? (
          <div className="bg-background border rounded-md shadow-lg p-3 w-[260px]">
            <div className="flex-1">
              <div className="font-medium line-clamp-2">{activeTask.title}</div>
              <div className="text-xs text-muted-foreground mt-1">Drag to change status</div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <TaskFormDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        task={editingTask as any}
        projectContext={editingTask ? {
          projectId: (editingTask.projectId as any) ?? '' as any,
          projectTitle: ((editingTask as any).project?.title ?? 'Project') as any,
          clientId: (clientId as any),
          clientName: 'Client' as any,
          departmentId: (editingTask.departmentId as any) ?? '' as any,
          departmentName: ((editingTask as any).department?.name ?? 'Department') as any,
        } : undefined as any}
        onSuccess={() => setIsTaskDialogOpen(false)}
      />
    </DndContext>
  );
}

function KanbanTaskCard({ task, onOpenTask }: { task: EnrichedTask; onOpenTask: (task: EnrichedTask) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const getSizeBadgeClass = (size?: string) => {
    switch ((size || '').toUpperCase()) {
      case 'XS':
        return 'bg-slate-100 text-slate-800';
      case 'S':
        return 'bg-blue-100 text-blue-800';
      case 'M':
        return 'bg-purple-100 text-purple-800';
      case 'L':
        return 'bg-amber-100 text-amber-800';
      case 'XL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onOpenTask(task)}
      className={`group relative rounded-lg bg-white dark:bg-gray-900 p-3 transition-shadow transition-colors border border-gray-200 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-sm ${isDragging ? 'opacity-50' : ''} hover:cursor-move`}
    >
      {/* Left status accent */}
      <div className={`absolute left-3 top-3 bottom-3 w-1.5 rounded-sm ${statusAccentClass(String((task as any).status))}`} />

      {/* Shift content to accommodate accent with a little gap */}
      <div className="pl-4">
      {/* Edit icon (appears on hover) */}
      <button
        type="button"
        title="Edit task"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); onOpenTask(task); }}
        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground"
        aria-label="Edit task"
      >
        <IconPencil className="h-4 w-4" />
      </button>

      {/* Title and project */}
      <div className="min-w-0">
        <div className="leading-tight truncate text-sm font-semibold">
          <span className="truncate block">{task.title}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate mb-2">{task.project?.title || 'General'}</div>
      </div>

      {/* Footer metadata */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconClock className="h-3.5 w-3.5" />
            <span>{(task as any).dueDate ? new Date((task as any).dueDate).toLocaleDateString() : 'Not Set'}</span>
          </div>
          <Badge className={`text-[10px] px-2 py-0 ${statusBadgeClass(String((task as any).status))}`}>{statusLabel(String((task as any).status))}</Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <IconBuilding className="h-3.5 w-3.5" />
            <span className="truncate max-w-[140px]">{((task as any).department?.name) || 'Department'}</span>
          </div>
        </div>
        <div className="flex items-center justify-end flex-1">
          <div className="ml-auto pr-0.5">
            {getPriorityIcon(String((task as any).priority || ''))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function statusLabel(s: string): string {
  switch (s) {
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'review': return 'Review';
    case 'on_hold': return 'On Hold';
    case 'done':
    case 'completed': return 'Completed';
    default: return String(s || 'To Do');
  }
}

function statusBadgeClass(s: string): string {
  switch (s) {
    case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
    case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'done':
    case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    default: return 'bg-muted text-foreground';
  }
}

function statusAccentClass(s: string): string {
  switch (s) {
    case 'todo': return 'bg-gray-300 dark:bg-gray-700';
    case 'in_progress': return 'bg-blue-400 dark:bg-blue-700';
    case 'review': return 'bg-orange-400 dark:bg-orange-700';
    case 'on_hold': return 'bg-yellow-400 dark:bg-yellow-700';
    case 'done':
    case 'completed': return 'bg-green-500 dark:bg-green-700';
    default: return 'bg-gray-300 dark:bg-gray-700';
  }
}

function getPriorityIcon(p: string) {
  switch ((p || '').toLowerCase()) {
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

function getStatusIcon(s: string) {
  switch (s) {
    case 'todo':
      return <IconSquareCheck className="h-4 w-4 text-slate-400" />;
    case 'in_progress':
      return <IconLoader className="h-4 w-4 text-slate-400" />;
    case 'review':
      return <IconEye className="h-4 w-4 text-slate-400" />;
    case 'done':
    case 'completed':
      return <IconSquareCheck className="h-4 w-4 text-slate-400" />;
    default:
      return <IconSquare className="h-4 w-4 text-slate-400" />;
  }
}

function ColumnDroppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} id={id}>
      {children}
    </div>
  );
}


