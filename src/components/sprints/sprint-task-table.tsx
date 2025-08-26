/**
 * SprintTaskTable - Task selection and management table for sprint planning
 *
 * @remarks
 * Displays tasks grouped by project with search, selection, and collapsible project sections.
 * Supports task selection for sprint planning with priority indicators and time estimates.
 * Integrates with sprint management workflow for capacity planning.
 *
 * @example
 * ```tsx
 * <SprintTaskTable
 *   tasks={sprintTasks}
 *   selectedTaskIds={selectedIds}
 *   onToggleTask={handleTaskToggle}
 *   collapsedProjects={collapsed}
 *   onToggleProject={handleProjectToggle}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useState, useCallback, memo } from 'react';

// 2. Internal imports
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { IconClock } from '@tabler/icons-react';
import { toast } from 'sonner';

// 3. Types
export interface SprintTaskTableTask {
  /** Task identifier */
  _id: string;
  /** Task title */
  title: string;
  /** Assignee name */
  assigneeName?: string;
  /** Estimated hours for the task */
  estimatedHours?: number;
  /** Task priority level */
  priority?: 'urgent' | 'high' | 'medium' | 'low';
  /** Project identifier */
  projectId: string;
  /** Project name */
  projectName: string;
  /** Whether task is blocked by dependencies */
  isBlocked?: boolean;
  /** Task slug/identifier */
  slug?: string;
}

export interface SprintTaskTableProps {
  /** List of tasks to display */
  tasks: SprintTaskTableTask[];
  /** Set of selected task IDs */
  selectedTaskIds: Set<string>;
  /** Callback when task selection changes */
  onToggleTask: (taskId: string) => void;
  /** Set of collapsed project IDs */
  collapsedProjects: Set<string>;
  /** Callback when project collapse state changes */
  onToggleProject: (projectId: string) => void;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  tasks: SprintTaskTableTask[];
  totalHours: number;
}

// 4. Component definition
export const SprintTaskTable = memo(function SprintTaskTable({ 
  tasks, 
  selectedTaskIds, 
  onToggleTask, 
  collapsedProjects, 
  onToggleProject 
}: SprintTaskTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const [search, setSearch] = useState<string>('');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredTasks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) => 
      task.title.toLowerCase().includes(term) || 
      task.projectName.toLowerCase().includes(term)
    );
  }, [search, tasks]);

  const groupedProjects = useMemo(() => {
    const map = new Map<string, ProjectGroup>();
    
    for (const task of filteredTasks) {
      const key = task.projectId;
      if (!map.has(key)) {
        map.set(key, { 
          projectId: key, 
          projectName: task.projectName, 
          tasks: [], 
          totalHours: 0 
        });
      }
      
      const entry = map.get(key)!;
      entry.tasks.push(task);
      entry.totalHours += task.estimatedHours ?? 0;
    }
    
    return Array.from(map.values()).sort((a, b) => 
      a.projectName.localeCompare(b.projectName)
    );
  }, [filteredTasks]);

  const selectedCount = useMemo(() => {
    return selectedTaskIds.size;
  }, [selectedTaskIds]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }, []);

  const handleProjectToggle = useCallback((projectId: string) => {
    onToggleProject(projectId);
  }, [onToggleProject]);

  const handleTaskToggle = useCallback((taskId: string) => {
    onToggleTask(taskId);
  }, [onToggleTask]);

  const handleSlugCopy = useCallback(async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy ID');
    }
  }, []);

  const formatHoursAsDays = useCallback((hours?: number): string => {
    const h = Math.max(0, Math.round((hours ?? 0) * 10) / 10);
    const d = h / 8;
    const roundedHalf = Math.round(d * 2) / 2;
    return `${roundedHalf}d`;
  }, []);

  const getPriorityBadgeVariant = useCallback((priority?: string): string => {
    switch (priority) {
      case 'urgent':
        return 'border-red-500/50 text-red-700';
      case 'high':
        return 'border-amber-500/50 text-amber-700';
      case 'medium':
        return 'border-emerald-500/50 text-emerald-700';
      case 'low':
        return 'border-slate-300 text-slate-600';
      default:
        return 'border-slate-300 text-slate-600';
    }
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="space-y-3 text-[0.95rem]">
      <div className="flex items-center justify-between gap-3">
        <Input 
          placeholder="Search tasks or projects" 
          value={search} 
          onChange={handleSearchChange} 
          className="h-9" 
        />
        <div className="text-sm text-muted-foreground">
          {selectedCount} selected
        </div>
      </div>

      <div className="divide-y rounded-md border bg-background">
        {groupedProjects.map((group) => {
          const isCollapsed = collapsedProjects.has(group.projectId);
          
          return (
            <div key={group.projectId}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50"
                onClick={() => handleProjectToggle(group.projectId)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{group.projectName}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.tasks.length} tasks • {formatHoursAsDays(group.totalHours)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isCollapsed ? 'Show' : 'Hide'}
                </span>
              </button>

              {!isCollapsed && (
                <div className="divide-y">
                  {group.tasks.map((task) => {
                    const isSelected = selectedTaskIds.has(task._id);
                    
                    return (
                      <div
                        key={task._id}
                        className={`grid grid-cols-12 items-center px-3 py-2 hover:bg-muted/50 ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                        onClick={() => handleTaskToggle(task._id)}
                        role="button"
                      >
                        <div className="col-span-6 flex items-center gap-2">
                          {task.isBlocked && (
                            <IconClock 
                              className="h-4 w-4 text-blue-400" 
                              title="Waiting on dependencies" 
                            />
                          )}
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleTaskToggle(task._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="truncate">{task.title}</span>
                          {task.slug && (
                            <button
                              type="button"
                              className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                              onClick={(e) => handleSlugCopy(task.slug!, e)}
                              title="Click to copy task ID"
                            >
                              {task.slug}
                            </button>
                          )}
                        </div>
                        <div className="col-span-3 text-sm text-muted-foreground truncate">
                          {task.assigneeName ?? 'Unassigned'}
                        </div>
                        <div className="col-span-2 text-sm">
                          {formatHoursAsDays(task.estimatedHours ?? 0)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Badge 
                            variant="outline" 
                            className={getPriorityBadgeVariant(task.priority)}
                          >
                            {task.priority?.toUpperCase() ?? ''}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default SprintTaskTable;


