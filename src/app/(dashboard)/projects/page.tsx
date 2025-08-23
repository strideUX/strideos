
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/lib/auth-hooks';
import { ProjectFilters } from '@/components/projects/ProjectFilters';
import { TaskEditDialog, EditableTask } from '@/components/tasks/TaskEditDialog';
import { TaskFormDialog } from '@/components/admin/TaskFormDialog';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { IconBuilding, IconFileDescription, IconPlus, IconFolder, IconAlertTriangle, IconClock, IconPlayerPlay, IconExternalLink, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame, IconSquareCheck, IconHandStop } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ProjectFormDialog } from '@/components/projects/ProjectFormDialog';

type ProjectStatus = 'new' | 'planning' | 'ready_for_work' | 'in_progress' | 'client_review' | 'client_approved' | 'complete';

interface Project {
  _id: Id<'projects'>;
  title: string;
  description?: string;
  status: ProjectStatus;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  targetDueDate?: number;
  createdAt: number;
  updatedAt: number;
  documentId: Id<'documents'>;
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'>; isInternal?: boolean };
  department?: { _id: Id<'departments'>; name: string };
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<EditableTask | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormTask, setTaskFormTask] = useState<any | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createContext, setCreateContext] = useState<{ projectId: Id<'projects'>; clientId: Id<'clients'>; departmentId: Id<'departments'>; projectTitle: string; clientName: string; departmentName: string } | null>(null);

  const projects = useQuery(api.projects.listProjects, { limit: 500 });
  const tasks = useQuery(api.tasks.getTasks, {});

  const transformedProjects: Project[] = useMemo(() => (projects?.map(project => ({
    _id: project._id,
    title: project.title,
    description: project.description,
    status: project.status as ProjectStatus,
    clientId: project.clientId,
    departmentId: project.departmentId,
    projectManagerId: project.projectManagerId,
    targetDueDate: project.targetDueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    documentId: project.documentId,
    client: project.client ? { _id: project.client._id, name: project.client.name, logo: project.client.logo, isInternal: project.client.isInternal } : undefined,
    department: project.department ? { _id: project.department._id, name: project.department.name } : undefined,
  })) || []), [projects]);

  const filteredProjects = useMemo(() => transformedProjects
    .filter(project => searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(project => project.client?.isInternal !== true)
    .sort((a, b) => {
      const aDue = a.targetDueDate ?? Number.POSITIVE_INFINITY;
      const bDue = b.targetDueDate ?? Number.POSITIVE_INFINITY;
      if (aDue !== bDue) return aDue - bDue;
      return a.title.localeCompare(b.title);
    }), [transformedProjects, searchTerm]);

  const tasksByProject = useMemo(() => {
    const map = new Map<string, any[]>();
    (tasks || []).forEach((t: any) => {
      if (!t.projectId) return;
      if (!map.has(String(t.projectId))) map.set(String(t.projectId), []);
      map.get(String(t.projectId))!.push(t);
    });
    return map;
  }, [tasks]);

  const getStatusLabel = (status: ProjectStatus) => ({
    new: 'New',
    planning: 'Planning',
    ready_for_work: 'Ready for Work',
    in_progress: 'In Progress',
    client_review: 'Client Review',
    client_approved: 'Client Approved',
    complete: 'Complete',
  }[status]);

  const getProgress = (status: ProjectStatus) => ({
    new: 0,
    planning: 20,
    ready_for_work: 40,
    in_progress: 60,
    client_review: 80,
    client_approved: 90,
    complete: 100,
  }[status]);

  // Table helpers to emulate My Work styles
  const statusLabel = (s: string): string => {
    switch (s) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'review': return 'Review';
      case 'on_hold': return 'On Hold';
      case 'done':
      case 'completed': return 'Completed';
      default: return String(s);
    }
  };

  const statusBadgeClass = (s: string): string => {
    switch (s) {
      case 'todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'review': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'done':
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default: return 'bg-muted text-foreground';
    }
  };

  const getPriorityIcon = (p: string) => {
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
  };

  // KPI metrics
  const totalProjects = transformedProjects.length;
  const inProgressProjects = transformedProjects.filter(p => p.status === 'in_progress').length;
  const atRiskProjects = transformedProjects.filter(p => p.status === 'client_review' || (p.targetDueDate && p.targetDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000 && p.status !== 'complete')).length;
  const lateProjects = transformedProjects.filter(p => p.targetDueDate && p.targetDueDate < Date.now() && p.status !== 'complete').length;

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Client Projects</h1>
            <p className="text-slate-600 dark:text-slate-300">Project tasks by project</p>
          </div>
          <div>
            <button
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:opacity-90"
              onClick={() => setIsProjectFormOpen(true)}
            >
              <IconPlus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <div className="text-xs font-medium">Total Projects</div>
              <IconFolder className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{totalProjects}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <div className="text-xs font-medium">In Progress</div>
              <IconPlayerPlay className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{inProgressProjects}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <div className="text-xs font-medium">At Risk</div>
              <IconAlertTriangle className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{atRiskProjects}</div>
            </CardContent>
          </Card>
          <Card className="gap-3 py-3">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2">
              <div className="text-xs font-medium">Late</div>
              <IconClock className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0 pb-2">
              <div className="text-4xl font-bold leading-none">{lateProjects}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <ProjectFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold">Project</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Assignee</TableHead>
                  <TableHead className="font-bold">Priority</TableHead>
                  <TableHead className="font-bold">Size (hours)</TableHead>
                  <TableHead className="font-bold text-right">Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <React.Fragment key={`proj-${project._id}`}>
                    <TableRow key={`proj-${project._id}`} className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => {
                      router.push(`/projects/${project._id}/details`);
                    }}>
                      <TableCell colSpan={6} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <ProjectClientLogo storageId={project.client?.logo as Id<'_storage'> | undefined} clientName={project.client?.name || 'Client'} />
                            <span className="font-semibold inline-flex items-center gap-1">{project.title}
                            <button
                              className="text-muted-foreground hover:text-foreground inline-flex items-center ml-0.5"
                              onClick={(e) => { e.stopPropagation(); window.open(`/projects/${project._id}/details`, '_blank'); }}
                              title="Open project in new tab"
                            >
                              <IconExternalLink className="w-3 h-3 ml-1" />
                            </button>
                            </span>
                            {(((project as any).slug) || (project as any).projectKey) && (
                              <span className="font-mono text-[9px] leading-3 text-muted-foreground px-1 py-0.5 rounded border bg-background">
                                {(project as any).slug || (project as any).projectKey}
                              </span>
                            )}
                            <Badge variant="outline">{getStatusLabel(project.status)}</Badge>
                            <span className="text-xs text-muted-foreground">{(tasksByProject.get(String(project._id)) || []).length} tasks</span>
                            <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                              <div className="h-2 bg-blue-500" style={{ width: `${getProgress(project.status)}%` }} />
                            </div>
                          </div>
                          <div className="text-sm font-semibold">
                            {project.targetDueDate ? new Date(project.targetDueDate).toLocaleDateString() : '—'}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    {(tasksByProject.get(String(project._id)) || [])
                      .slice()
                      .sort((a: any, b: any) => {
                        const order = (s: string) => {
                          switch (s) {
                            case 'todo': return 0;
                            case 'in_progress': return 1;
                            case 'review': return 2;
                            case 'done':
                            case 'completed': return 3;
                            default: return 99;
                          }
                        };
                        const diff = order(String(a.status)) - order(String(b.status));
                        if (diff !== 0) return diff;
                        return String(a.title).localeCompare(String(b.title));
                      })
                      .map((t: any) => (
                      <TableRow key={t._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => {
                        setTaskFormTask(t);
                        setIsTaskFormOpen(true);
                      }}>
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2">
                            <IconSquareCheck className="w-4 h-4 text-slate-400" />
                            <span className={`font-medium ${['done','completed'].includes(String(t.status)) ? 'line-through text-slate-400' : ''}`}>{t.title}</span>
                            {(t as any).slug && (
                              <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded border bg-background">
                                {(t as any).slug}
                              </span>
                            )}
                            {(t as any).isBlocked && (
                              <IconHandStop className="w-3.5 h-3.5 text-blue-400" title="Blocked" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(String(t.status))}>{statusLabel(String(t.status))}</Badge>
                        </TableCell>
                        <TableCell>
                          {t.assignee ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={t.assignee?.image} />
                                <AvatarFallback className="text-xs">{t.assignee?.name?.[0]?.toUpperCase() || t.assignee?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{t.assignee?.name || t.assignee?.email || 'Assigned'}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            {getPriorityIcon(String(t.priority))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{(t.sizeHours ?? t.estimatedHours ?? 0)}h</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {t.dueDate ? (
                            <span className="text-sm">{new Date(t.dueDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-sm text-slate-400">No due date</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Task Dialog (new modal) */}
        <TaskFormDialog
          open={isTaskFormOpen}
          onOpenChange={setIsTaskFormOpen}
          task={taskFormTask as any}
          onSuccess={() => setIsTaskFormOpen(false)}
        />
        {createContext && (
          <TaskFormDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            projectContext={{
              projectId: createContext.projectId as unknown as Id<'projects'>,
              projectTitle: createContext.projectTitle,
              clientId: createContext.clientId as unknown as Id<'clients'>,
              clientName: createContext.clientName,
              departmentId: createContext.departmentId as unknown as Id<'departments'>,
              departmentName: createContext.departmentName,
            }}
            onSuccess={() => setIsCreateOpen(false)}
          />
        )}
      </div>
      <ProjectFormDialog
        open={isProjectFormOpen}
        onOpenChange={setIsProjectFormOpen}
        hideDescription
        showDueDate
        onSuccess={(result) => {
          setIsProjectFormOpen(false);
          router.push(`/editor/${result.documentId}`);
        }}
      />
    </>
  );
}

// Small logo component to safely fetch and render client logo
function ProjectClientLogo({ storageId, clientName }: { storageId?: Id<'_storage'>; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? ({ storageId } as any) : 'skip') as string | undefined;
  if (storageId && logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />;
  }
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
}