'use client';

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
import Image from 'next/image';
import { IconGripVertical, IconLayoutKanban } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { TaskEditDialog } from '@/components/tasks/task-edit-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useKanbanBoard } from '@/hooks/use-kanban-board';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

const STATUS_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review', label: 'In Review' },
  { key: 'done', label: 'Done' },
];

// Colored count badges by status
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

// Small client logo display for task cards
function ClientLogo({ storageId, clientName }: { storageId?: Id<'_storage'> | string; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? { storageId: storageId as Id<'_storage'> } : 'skip');

  if (!storageId || !logoUrl) return null;

  return (
    <Image
      src={logoUrl}
      alt={`${clientName} logo`}
      width={16}
      height={16}
      className="h-4 w-4 rounded object-cover"
    />
  );
}

export function ActiveSprintsKanban() {
  const {
    activeSprints,
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    hasActiveSprints,
    activeSprintsWithNoTasks,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setActiveTask,
  } = useKanbanBoard();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const router = useRouter();

  // Empty states
  if (!hasActiveSprints) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLayoutKanban className="h-5 w-5" /> Active Sprints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <IconLayoutKanban className="h-10 w-10 text-muted-foreground mb-3" />
            <div className="text-base font-medium">No active sprints</div>
            <div className="text-sm text-muted-foreground">Start a sprint to see tasks here across all active sprints.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!grouped) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconLayoutKanban className="h-5 w-5" /> Active Sprints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-10">Loading tasks…</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {activeSprintsWithNoTasks.length > 0 && (
        <Card className="mb-4 border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {activeSprintsWithNoTasks.length} active sprint{activeSprintsWithNoTasks.length !== 1 ? 's' : ''} with no tasks:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeSprintsWithNoTasks.map((sprint) => (
                    <Button
                      key={sprint._id}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => router.push(`/sprint/${sprint._id}`)}
                    >
                      {sprint.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map(({ key, label }) => {
            const columnTasks = grouped[key];
            return (
              <Card key={key} className="pt-2 gap-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-md font-semibold flex items-center justify-between">
                    <span>{label}</span>
                    <Badge className={`${getCountBadgeClass(key)} border-transparent`}>
                      {columnTasks.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SortableContext items={columnTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                    <ColumnDroppable id={`column:${key}`}>
                      <div className="min-h-[120px] space-y-2">
                      {columnTasks.length === 0 ? (
                        <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                          <span>Empty</span>
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <KanbanTaskCard
                            key={task._id}
                            task={task}
                            onOpenTask={(t) => openTaskDialog(t)}
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
              <div className="flex items-start gap-2">
                <IconGripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium line-clamp-2">{activeTask.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">Drag to change status</div>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskEditDialog open={isTaskDialogOpen} onOpenChange={closeTaskDialog} task={editingTask as any} />
    </>
  );
}

function KanbanTaskCard({ task, onOpenTask }: { task: EnrichedTask; onOpenTask: (task: EnrichedTask) => void }) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      className={`group relative rounded-md border bg-card p-3 shadow-sm hover:shadow transition ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Client logo top-right */}
      <div className="absolute right-2 top-2">
        <ClientLogo storageId={task.client?.logo} clientName={task.client?.name || 'Client'} />
      </div>

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
          <div className="text-xs text-muted-foreground truncate">
            {task.project?.title || 'General'}
          </div>
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
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (task.sprint?._id) {
                router.push(`/sprint/${task.sprint._id}`);
              }
            }}
            className="text-[10px] px-2 py-0.5 border rounded-md hover:underline"
            title="Open sprint"
          >
            {task.sprint.name}
          </button>
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


