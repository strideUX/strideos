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
import { IconGripVertical } from '@tabler/icons-react';
import { TaskEditDialog } from '@/components/tasks/task-edit-dialog';
import { useSprintKanban, type EnrichedTask } from '@/hooks/use-sprint-kanban';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';









function ClientLogo({ storageId, clientName }: { storageId?: Id<'_storage'> | string; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? { storageId: storageId as Id<'_storage'> } : 'skip');
  if (!storageId || !logoUrl) return null;
  return <Image src={logoUrl} alt={`${clientName} logo`} width={16} height={16} className="h-4 w-4 rounded object-cover" />;
}

export function SprintKanban({ sprintId }: { sprintId: Id<'sprints'> }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  
  const {
    grouped,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    STATUS_COLUMNS,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    getCountBadgeClass,
  } = useSprintKanban({ sprintId });

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
                            onOpenTask={openTaskDialog}
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
              <div className="flex-1">
                <div className="font-medium line-clamp-2">{activeTask.title}</div>
                <div className="text-xs text-muted-foreground mt-1">Drag to change status</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      <TaskEditDialog open={isTaskDialogOpen} onOpenChange={closeTaskDialog} task={editingTask as any} />
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
            {(task as any).slug && (
              <span className="text-[10px] px-1 py-0.5 rounded border font-mono">
                {(task as any).slug}
              </span>
            )}
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
        {(task as any).slug && (
          <button
            type="button"
            className="text-xs text-muted-foreground hover:underline ml-auto"
            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((task as any).slug as string); }}
            title="Copy task slug"
          >
            Copy
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


