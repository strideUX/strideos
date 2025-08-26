/**
 * ProjectsTable - Data table component for displaying and managing projects
 *
 * @remarks
 * Renders projects in a structured table format with optional client/department grouping.
 * Supports project selection, document viewing, deletion, and displays aggregated task metrics.
 * Integrates with project hooks for data processing and user interaction handling.
 *
 * @example
 * ```tsx
 * <ProjectsTable
 *   projects={projectList}
 *   onProjectSelect={(id) => router.push(`/projects/${id}`)}
 *   onViewDocument={(id) => router.push(`/editor/${id}`)}
 *   onDeleteProject={handleDelete}
 *   userRole="admin"
 *   groupByClientDepartment={true}
 *   hideDescription={false}
 * />
 * ```
 */

// 1. External imports
import React, { Fragment, useMemo, memo, useCallback } from 'react';

// 2. Internal imports
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IconBuilding, IconDots, IconEdit, IconEye, IconUsers, IconFileText } from '@tabler/icons-react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectsTable } from '@/hooks/use-projects-table';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// 3. Types (if not in separate file)
interface Project {
  _id: Id<'projects'>;
  title: string;
  description?: string;
  status: string;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  assigneeIds?: Id<'users'>[];
  dueDate?: number;
  targetDueDate?: number;
  createdAt: number;
  updatedAt: number;
  client?: {
    _id: Id<'clients'>;
    name: string;
    logoStorageId?: Id<'_storage'>;
    logo?: Id<'_storage'>;
    isInternal?: boolean;
  };
  department?: {
    _id: Id<'departments'>;
    name: string;
  };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
  slug?: string; // Added for slug copy
  projectKey?: string; // Added for projectKey copy
}

type ProjectStatus = 'new' | 'planning' | 'ready_for_work' | 'in_progress' | 'client_review' | 'client_approved' | 'complete';

interface ProjectsTableProps {
  /** List of projects to display */
  projects: Project[];
  /** Callback when a project is selected */
  onProjectSelect: (projectId: Id<'projects'>) => void;
  /** Callback when viewing a project document */
  onViewDocument: (projectId: Id<'projects'>) => void;
  /** Callback when deleting a project (admin only) */
  onDeleteProject?: (project: Project) => void;
  /** User role for permission checks */
  userRole: string;
  /** Whether to group projects by client and department */
  groupByClientDepartment?: boolean;
  /** Whether to hide project descriptions */
  hideDescription?: boolean;
}

interface GroupedProject {
  key: string;
  clientName: string;
  clientLogo?: Id<'_storage'>;
  departmentName: string;
  items: Project[];
}

// Utility functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'new':
      return '#e5e7eb'; // gray-200
    case 'planning':
      return '#dbeafe'; // blue-200
    case 'ready_for_work':
      return '#fef3c7'; // amber-200
    case 'in_progress':
      return '#c7d2fe'; // indigo-200
    case 'client_review':
      return '#fecaca'; // red-200
    case 'client_approved':
      return '#bbf7d0'; // green-200
    case 'complete':
      return '#dcfce7'; // emerald-200
    default:
      return '#f3f4f6'; // gray-100
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'new':
      return 'New';
    case 'planning':
      return 'Planning';
    case 'ready_for_work':
      return 'Ready for Work';
    case 'in_progress':
      return 'In Progress';
    case 'client_review':
      return 'Client Review';
    case 'client_approved':
      return 'Client Approved';
    case 'complete':
      return 'Complete';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

// 4. Component definition
export const ProjectsTable = memo(function ProjectsTable({ 
  projects, 
  onProjectSelect, 
  onViewDocument, 
  onDeleteProject, 
  userRole, 
  groupByClientDepartment = false, 
  hideDescription = false 
}: ProjectsTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const {
    groups,
    aggregates,
    columnCount
  } = useProjectsTable({ projects, groupByClientDepartment });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const canDeleteProjects = useMemo(() => {
    return userRole === 'admin' && Boolean(onDeleteProject);
  }, [userRole, onDeleteProject]);

  const statusOrder = useMemo(() => {
    return ['new', 'planning', 'ready_for_work', 'in_progress', 'client_review', 'client_approved', 'complete'];
  }, []);

  const statusOrderIndex = useMemo(() => {
    return new Map(statusOrder.map((s, i) => [s, i] as [string, number]));
  }, [statusOrder]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleProjectSelect = useCallback((projectId: Id<'projects'>) => {
    onProjectSelect(projectId);
  }, [onProjectSelect]);

  const handleViewDocument = useCallback((projectId: Id<'projects'>) => {
    onViewDocument(projectId);
  }, [onViewDocument]);

  const handleDeleteProject = useCallback((project: Project) => {
    if (onDeleteProject) {
      onDeleteProject(project);
    }
  }, [onDeleteProject]);

  const handleSlugCopy = useCallback((slug: string) => {
    navigator.clipboard.writeText(slug);
    toast.success('Project slug copied to clipboard');
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed in this component)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-bold">Project</TableHead>
          {!groupByClientDepartment && (
            <TableHead className="font-bold">Client/Department</TableHead>
          )}
          <TableHead className="font-bold">Status</TableHead>
          <TableHead className="font-bold">Team</TableHead>
          <TableHead className="font-bold">Tasks</TableHead>
          <TableHead className="font-bold">Size (hours)</TableHead>
          <TableHead className="font-bold">Due Date</TableHead>
          <TableHead className="text-right font-bold">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupByClientDepartment && groups.length > 0
          ? groups.map((group) => (
              <Fragment key={`group-frag-${group.key}`}>
                <TableRow key={`group-${group.key}`} className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={columnCount} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <SmallClientLogo storageId={group.clientLogo} clientName={group.clientName} />
                      <span className="font-semibold">{group.clientName}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">{group.departmentName}</span>
                    </div>
                  </TableCell>
                </TableRow>
                {(() => {
                  const sortedItems = [...group.items].sort((a, b) => {
                    const ai = statusOrderIndex.get(a.status) ?? 999;
                    const bi = statusOrderIndex.get(b.status) ?? 999;
                    if (ai !== bi) return ai - bi;
                    return a.title.localeCompare(b.title);
                  });
                  return sortedItems.map((project) => (
                    <ProjectRow
                      key={project._id}
                      project={project}
                      onSelect={handleProjectSelect}
                      onViewDocument={handleViewDocument}
                      onDelete={canDeleteProjects ? handleDeleteProject : undefined}
                      aggregates={aggregates}
                      hideDescription={hideDescription}
                      onSlugCopy={handleSlugCopy}
                    />
                  ));
                })()}
              </Fragment>
            ))
          : projects.map((project) => (
              <ProjectRow
                key={project._id}
                project={project}
                onSelect={handleProjectSelect}
                onViewDocument={handleViewDocument}
                onDelete={canDeleteProjects ? handleDeleteProject : undefined}
                aggregates={aggregates}
                hideDescription={hideDescription}
                onSlugCopy={handleSlugCopy}
              />
            ))}
      </TableBody>
    </Table>
  );
});

// Sub-component: ProjectRow
interface ProjectRowProps {
  project: Project;
  onSelect: (projectId: Id<'projects'>) => void;
  onViewDocument: (projectId: Id<'projects'>) => void;
  onDelete?: (project: Project) => void;
  aggregates: any;
  hideDescription: boolean;
  onSlugCopy: (slug: string) => void;
}

const ProjectRow = memo(function ProjectRow({
  project,
  onSelect,
  onViewDocument,
  onDelete,
  aggregates,
  hideDescription,
  onSlugCopy
}: ProjectRowProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No additional hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const projectAggregate = useMemo(() => {
    return aggregates?.[project._id] || { totalTasks: 0, totalHours: 0 };
  }, [aggregates, project._id]);

  const totalHours = useMemo(() => {
    return projectAggregate?.totalHours || 0;
  }, [projectAggregate]);

  const taskCount = useMemo(() => {
    return projectAggregate?.taskCount || 0;
  }, [projectAggregate]);

  const statusColor = useMemo(() => {
    return getStatusColor(project.status);
  }, [project.status]);

  const statusLabel = useMemo(() => {
    return getStatusLabel(project.status);
  }, [project.status]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSelect = useCallback(() => {
    onSelect(project._id);
  }, [onSelect, project._id]);

  const handleViewDocument = useCallback(() => {
    onViewDocument(project._id);
  }, [onViewDocument, project._id]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(project);
    }
  }, [onDelete, project]);

  const handleSlugCopy = useCallback(() => {
    if (project.slug) {
      onSlugCopy(project.slug);
    }
  }, [project.slug, onSlugCopy]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <TableRow key={project._id} className="hover:bg-muted/50">
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium cursor-pointer hover:text-primary" onClick={handleSelect}>
            {project.title}
          </div>
          {!hideDescription && project.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </div>
          )}
          {project.slug && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-2 py-1 rounded">
                {project.slug}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={handleSlugCopy}
              >
                Copy
              </Button>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <SmallClientLogo 
            storageId={project.client?.logoStorageId} 
            clientName={project.client?.name || 'Unknown'} 
          />
          <div className="text-sm">
            <div className="font-medium">{project.client?.name}</div>
            <div className="text-muted-foreground">{project.department?.name}</div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" style={{ backgroundColor: statusColor }}>
          {statusLabel}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex -space-x-2">
          {(project.assigneeIds || []).slice(0, 3).map((assigneeId, index) => (
            <Avatar key={assigneeId} className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs">
                {String(assigneeId).slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
          {(project.assigneeIds || []).length > 3 && (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
              +{(project.assigneeIds || []).length - 3}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm">{taskCount}</span>
      </TableCell>
      <TableCell>
        <span className="text-sm">{totalHours}h</span>
      </TableCell>
      <TableCell>
        {project.dueDate ? (
          <span className="text-sm">{new Date(project.dueDate).toLocaleDateString()}</span>
        ) : (
          <span className="text-sm text-muted-foreground">No due date</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <IconDots className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSelect}>
              <IconEye className="mr-2 h-4 w-4" />
              View Project
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewDocument}>
              <IconFileText className="mr-2 h-4 w-4" />
              View Document
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

// Sub-component: SmallClientLogo
interface SmallClientLogoProps {
  storageId?: Id<'_storage'>;
  clientName: string;
}

const SmallClientLogo = memo(function SmallClientLogo({ storageId, clientName }: SmallClientLogoProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // @ts-ignore simplify convex/react generics here to avoid deep instantiation
  const logoUrl = (useQuery as any)(api.clients.getLogoUrl as any, storageId ? ({ storageId } as any) : 'skip') as string | undefined;

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No memoized values needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  if (storageId && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />
    );
  }
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
});
