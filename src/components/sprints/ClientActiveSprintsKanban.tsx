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
import { IconGripVertical } from '@tabler/icons-react';
import { toast } from 'sonner';
import { TaskEditDialog } from '@/components/tasks/TaskEditDialog';

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
  const updateTask = useMutation(api.tasks.updateTask);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeTask, setActiveTask] = useState<Doc<'tasks'> | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EnrichedTask | null>(null);

  const sprintIdSet = new Set<string>((activeSprints || []).map((s: any) => s._id as string));
  const filteredTasks: EnrichedTask[] = ((tasks as any[]) || [])
    .filter((t) => t.clientId === clientId && t.sprintId && sprintIdSet.has(t.sprintId as string))
    .map((t) => t as EnrichedTask);

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
          <CardTitle className="flex items-center gap-2">Active Sprints</CardTitle>
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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {STATUS_COLUMNS.map(({ key, label }) => {
          const columnTasks = grouped[key];
          return (
            <Card key={key} className="pt-2 gap-2">
              <CardHeader className="py-3">
                <CardTitle className="text-md font-semibold flex items-center justify-between">
                  <span>{label}</span>
                  <Badge className={`${getCountBadgeClass(key)} border-transparent`}>{columnTasks.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SortableContext items={columnTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                  <ColumnDroppable id={`column:${key}`}>
                    <div className="min-h-[120px] space-y-2">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

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

      <TaskEditDialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen} task={editingTask as any} />
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
    <div ref={setNodeRef} style={style} className={`group relative rounded-md border bg-card p-3 shadow-sm hover:shadow transition ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          data-drag-handle
          className="text-muted-foreground hover:text-foreground mt-0.5"
          aria-label="Drag task"
        >
          <IconGripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            title="Edit task"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTask(task);
            }}
            className="font-medium leading-tight truncate flex items-center gap-2 text-left hover:underline"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-60" />
            <span className="truncate">{task.title}</span>
          </button>
          <div className="text-xs text-muted-foreground truncate">{task.project?.title || 'General'}</div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        {(() => {
          const hours = ((task as any).sizeHours ?? (task as any).estimatedHours);
          if (hours) {
            return <Badge variant="secondary" className="border-transparent">{hours}h</Badge>;
          }
          return null;
        })()}
        {task.sprint?.name && (
          <Badge variant="outline" className="text-[10px]">{task.sprint.name}</Badge>
        )}
      </div>
    </div>
  );
}

function ColumnDroppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} id={id}>
      {children}
    </div>
  );
}


