/**
 * ClientActiveSprintsKanban - Client-scoped kanban board for managing tasks across active sprints
 *
 * @remarks
 * Provides a drag-and-drop interface for managing task status within a specific client's active sprints.
 * Groups tasks by status columns (To Do, In Progress, Review, Done) and allows real-time status updates.
 * Includes sprint overview rows with progress indicators and department filtering capabilities.
 * Integrates with client sprint kanban hooks for data fetching and state management.
 *
 * @example
 * ```tsx
 * <ClientActiveSprintsKanban clientId="client123" />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
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
import { IconClock, IconPencil, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame, IconBuilding, IconSquare, IconLoader, IconEye, IconSquareCheck, IconExternalLink, IconSearch } from '@tabler/icons-react';

// 2. Internal imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskFormDialog } from '@/components/admin/task-form-dialog';
import { useClientSprintKanban, type EnrichedTask } from '@/hooks/use-client-sprint-kanban';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 3. Types (if not in separate file)
interface ClientActiveSprintsKanbanProps {
  /** Client ID to scope the kanban board */
  clientId: Id<'clients'>;
}

interface SprintClientLogoProps {
  /** Storage ID for the client logo */
  storageId?: Id<'_storage'>;
  /** Client name for alt text */
  clientName: string;
}

interface KanbanTaskCardProps {
  /** Task data to display */
  task: EnrichedTask;
  /** Callback when task is opened for editing */
  onOpenTask: (task: EnrichedTask) => void;
}

interface ColumnDroppableProps {
  /** Unique identifier for the droppable column */
  id: string;
  /** Children to render inside the droppable area */
  children: React.ReactNode;
}

// Utility functions
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

// 4. Component definition
export const ClientActiveSprintsKanban = memo(function ClientActiveSprintsKanban({ 
  clientId 
}: ClientActiveSprintsKanbanProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  
  const {
    activeSprints,
    tasks,
    departments,
    grouped,
    departmentId,
    searchQuery,
    activeTask,
    isTaskDialogOpen,
    editingTask,
    selectedDeptName,
    STATUS_COLUMNS,
    handleDragStart,
    handleDragEnd,
    openTaskDialog,
    closeTaskDialog,
    setDepartment,
    setSearch,
    getCountBadgeClass,
  } = useClientSprintKanban({ clientId });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // Build task aggregations per sprint (for sprint rows)
  const tasksBySprintAll = useMemo(() => {
    const map = new Map<string, any[]>();
    const list = ((tasks as any[]) || []).filter((t) => t.clientId === clientId);
    for (const t of list) {
      if (!t.sprintId) continue;
      const key = String(t.sprintId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks, clientId]);

  const progressBySprint = useMemo(() => {
    const map = new Map<string, number>();
    for (const [sprintId, list] of tasksBySprintAll.entries()) {
      const total = list.length;
      const done = list.filter((t: any) => ['done', 'completed'].includes(String(t.status))).length;
      const pct = total ? Math.round((done / total) * 100) : 0;
      map.set(sprintId, pct);
    }
    return map;
  }, [tasksBySprintAll]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSprintClick = useCallback((sprintId: string) => {
    router.push(`/sprint/${sprintId}`);
  }, [router]);

  const handleSprintOpenNewTab = useCallback((e: React.MouseEvent, sprintId: string) => {
    e.stopPropagation();
    window.open(`/sprint/${sprintId}`, '_blank');
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, [setSearch]);

  const handleDepartmentChange = useCallback((value: string) => {
    setDepartment(value);
  }, [setDepartment]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed in this component)

  // === 6. EARLY RETURNS (loading, error states) ===
  // Early return if no active sprints
  if ((activeSprints?.length ?? 0) === 0) {
    return (
      <Card className="pt-2">
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-md font-semibold">{selectedDeptName}</CardTitle>
          </div>
          {/* Sprint rows (openable) above search */}
          <div className="mt-2 mb-2">
            <Table>
              <TableBody>
                {(activeSprints || []).map((sprint: any) => (
                  <TableRow key={`act-${String(sprint._id)}`} className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => handleSprintClick(String(sprint._id))}>
                    <TableCell colSpan={6} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SprintClientLogo storageId={sprint.client?.logo as Id<'_storage'> | undefined} clientName={sprint.client?.name || 'Client'} />
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold">{sprint.name}</span>
                            <span className="text-sm text-muted-foreground ml-0.5">{sprint.client?.name || 'Client'} / {sprint.department?.name || 'Department'}</span>
                            <button
                              className="text-muted-foreground hover:text-foreground inline-flex items-center"
                              onClick={(e) => handleSprintOpenNewTab(e, String(sprint._id))}
                              title="Open sprint in new tab"
                            >
                              <IconExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          </span>
                          <Badge variant="outline">{String(sprint.status || '').replaceAll('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{(tasksBySprintAll.get(String(sprint._id)) || []).length} tasks</span>
                          <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                            <div className="h-2 bg-blue-500" style={{ width: `${progressBySprint.get(String(sprint._id)) ?? 0}%` }} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-2">
            <div className="col-span-9 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={handleSearchChange} className="pl-9" />
            </div>
            <div className="col-span-3">
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Sprints</SelectItem>
                  {(departments || []).map((d: any) => (
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
          {/* Sprint rows above search */}
          <div className="mt-2 mb-2">
            <Table>
              <TableBody>
                {(activeSprints || []).map((sprint: any) => (
                  <TableRow key={`act-${String(sprint._id)}`} className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => handleSprintClick(String(sprint._id))}>
                    <TableCell colSpan={6} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SprintClientLogo storageId={sprint.client?.logo as Id<'_storage'> | undefined} clientName={sprint.client?.name || 'Client'} />
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold">{sprint.name}</span>
                            <span className="text-sm text-muted-foreground ml-0.5">{sprint.client?.name || 'Client'} / {sprint.department?.name || 'Department'}</span>
                            <button
                              className="text-muted-foreground hover:text-foreground inline-flex items-center"
                              onClick={(e) => handleSprintOpenNewTab(e, String(sprint._id))}
                              title="Open sprint in new tab"
                            >
                              <IconExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          </span>
                          <Badge variant="outline">{String(sprint.status || '').replaceAll('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{(tasksBySprintAll.get(String(sprint._id)) || []).length} tasks</span>
                          <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                            <div className="h-2 bg-blue-500" style={{ width: `${progressBySprint.get(String(sprint._id)) ?? 0}%` }} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-2 grid grid-cols-12 gap-2">
            <div className="col-span-9 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search tasks..." value={searchQuery} onChange={handleSearchChange} className="pl-9" />
            </div>
            <div className="col-span-3">
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Sprints</SelectItem>
                  {(departments || []).map((d: any) => (
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
                              onOpenTask={openTaskDialog}
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
        onOpenChange={closeTaskDialog}
        task={editingTask as any}
        projectContext={editingTask ? {
          projectId: (editingTask.projectId as any) ?? '' as any,
          projectTitle: ((editingTask as any).project?.title ?? 'Project') as any,
          clientId: (clientId as any),
          clientName: 'Client' as any,
          departmentId: (editingTask.departmentId as any) ?? '' as any,
          departmentName: ((editingTask as any).department?.name ?? 'Department') as any,
        } : undefined as any}
        onSuccess={closeTaskDialog}
      />
    </DndContext>
  );
});

// Sub-component: SprintClientLogo
const SprintClientLogo = memo(function SprintClientLogo({ 
  storageId, 
  clientName 
}: SprintClientLogoProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? ({ storageId } as any) : 'skip') as string | undefined;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (storageId && logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />;
  }

  // === 7. RENDER (JSX) ===
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
});

// Sub-component: KanbanTaskCard
const KanbanTaskCard = memo(function KanbanTaskCard({ 
  task, 
  onOpenTask 
}: KanbanTaskCardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: task._id });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const style = useMemo(() => {
    return { transform: CSS.Transform.toString(transform), transition };
  }, [transform, transition]);

  const sizeBadgeClass = useMemo(() => {
    switch ((task.size || '').toUpperCase()) {
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
  }, [task.size]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleTaskClick = useCallback(() => {
    onOpenTask(task);
  }, [onOpenTask, task]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onOpenTask(task);
  }, [onOpenTask, task]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleTaskClick}
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
          onPointerDown={handleEditClick}
          onMouseDown={handleEditClick}
          onClick={handleEditClick}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground"
          aria-label="Edit task"
        >
          <IconPencil className="h-4 w-4" />
        </button>

        {/* Title and project */}
        <div className="min-w-0">
          <div className="leading-tight truncate text-sm font-semibold">
            <span className={`truncate block ${['done','completed'].includes(String((task as any).status)) ? 'line-through text-slate-400' : ''}`}>{task.title}</span>
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
});

// Sub-component: ColumnDroppable
const ColumnDroppable = memo(function ColumnDroppable({ 
  id, 
  children 
}: ColumnDroppableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { setNodeRef } = useDroppable({ id });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div ref={setNodeRef} id={id}>
      {children}
    </div>
  );
});