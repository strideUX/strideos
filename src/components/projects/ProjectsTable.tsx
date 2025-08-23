"use client";

import { useMemo, Fragment } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
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
// Removed progress bar for this view
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

interface Project {
  _id: Id<'projects'>;
  title: string;
  description?: string;
  status: string;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  projectManagerId: Id<'users'>;
  targetDueDate?: number;
  createdAt: number;
  updatedAt: number;
  client?: { _id: Id<'clients'>; name: string; logo?: Id<'_storage'>; isInternal?: boolean };
  department?: { _id: Id<'departments'>; name: string };
  projectManager?: { _id: Id<'users'>; name: string; email: string; image?: string };
}

interface ProjectsTableProps {
  projects: Project[];
  onProjectSelect: (projectId: Id<'projects'>) => void;
  onViewDocument: (projectId: Id<'projects'>) => void;
  onDeleteProject?: (project: Project) => void; // NEW
  userRole?: string; // NEW
  groupByClientDepartment?: boolean;
  hideDescription?: boolean;
}

function SmallClientLogo({ storageId, clientName }: any) {
  // @ts-ignore simplify convex/react generics here to avoid deep instantiation
  const logoUrl = (useQuery as any)(api.clients.getLogoUrl as any, storageId ? ({ storageId } as any) : 'skip') as string | undefined;
  if (storageId && logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />
    );
  }
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
}

export function ProjectsTable({ projects, onProjectSelect, onViewDocument, onDeleteProject, userRole, groupByClientDepartment = false, hideDescription = false }: ProjectsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'planning': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready_for_work': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'client_review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'client_approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'planning': return 'Planning';
      case 'ready_for_work': return 'Ready for Work';
      case 'in_progress': return 'In Progress';
      case 'client_review': return 'Client Review';
      case 'client_approved': return 'Client Approved';
      case 'complete': return 'Complete';
      default: return status;
    }
  };

  // No progress computation needed in this view



  const handleSlugCopy = async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy ID');
    }
  };

  // Grouping setup
  const groups = groupByClientDepartment
    ? (() => {
        const map = new Map<string, { key: string; clientName: string; clientLogo?: Id<'_storage'>; departmentName: string; items: Project[] }>();
        for (const p of projects) {
          const key = `${p.clientId}|${p.departmentId}`;
          const existing = map.get(key);
          if (existing) {
            existing.items.push(p);
          } else {
            map.set(key, {
              key,
              clientName: p.client?.name || 'Unknown Client',
              clientLogo: p.client?.logo as Id<'_storage'> | undefined,
              departmentName: p.department?.name || 'Unknown Department',
              items: [p],
            });
          }
        }
        return Array.from(map.values()).sort((a, b) => a.clientName.localeCompare(b.clientName) || a.departmentName.localeCompare(b.departmentName));
      })()
    : [];

  // Fetch aggregated task counts and total hours per project
  const projectIds = useMemo(() => projects.map(p => p._id), [projects]);
  const aggregates = useQuery(api.tasks.getTaskAggregatesForProjects as any, projectIds.length > 0 ? ({ projectIds } as any) : 'skip') as Record<string, { totalTasks: number; totalHours: number }> | undefined;

  const columnCount = groupByClientDepartment ? 7 : 8;

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
                  const order = ['new','planning','ready_for_work','in_progress','client_review','client_approved','complete'];
                  const orderIndex = new Map(order.map((s, i) => [s, i] as [string, number]));
                  const sortedItems = [...group.items].sort((a, b) => {
                    const ai = orderIndex.get(a.status) ?? 999;
                    const bi = orderIndex.get(b.status) ?? 999;
                    if (ai !== bi) return ai - bi;
                    return a.title.localeCompare(b.title);
                  });
                  return sortedItems.map((project) => {
                    return (
                      <TableRow
                        key={project._id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => onViewDocument(project._id)}
                      >
                        <TableCell className="pl-8">
                          <div className="font-medium">
                            <div className="flex items-center gap-2">
                              <IconFileText className="w-4 h-4 text-slate-400" />
                              <span>{project.title}</span>
                              {((project as any).slug || (project as any).projectKey) && (
                                <button
                                  className="font-mono text-xs text-muted-foreground px-2 py-1 rounded border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                                  onClick={(e) => handleSlugCopy(((project as any).slug || (project as any).projectKey) as string, e)}
                                  title="Click to copy project ID"
                                >
                                  {(project as any).slug || (project as any).projectKey}
                                </button>
                              )}
                            </div>
                          </div>
                          {!hideDescription && project.description && (
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {project.description.length > 60 
                                ? `${project.description.substring(0, 60)}...` 
                                : project.description
                              }
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IconUsers className="w-4 h-4 text-slate-400" />
                            <div className="flex -space-x-2">
                              {project.projectManager && (
                                <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
                                  <AvatarImage src={project.projectManager.image} />
                                  <AvatarFallback className="text-xs">
                                    {project.projectManager.name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{aggregates?.[project._id as unknown as string]?.totalTasks ?? 0}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{(aggregates?.[project._id as unknown as string]?.totalHours ?? 0)}h</div>
                        </TableCell>
                        <TableCell>
                          {project.targetDueDate ? (
                            <div className="text-sm">
                              {new Date(project.targetDueDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-400">No due date</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <IconDots className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => onProjectSelect(project._id)}>
                                <IconEdit className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onViewDocument(project._id)}>
                                <IconEye className="w-4 h-4 mr-2" />
                                View Project Brief
                              </DropdownMenuItem>
                              {userRole === 'admin' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => onDeleteProject?.(project)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
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
                })()}
              </Fragment>
            ))
          : projects.map((project) => {
          
          return (
            <TableRow
              key={project._id}
              className="hover:bg-muted/50 cursor-pointer"
              onClick={() => onViewDocument(project._id)}
            >
              <TableCell>
                <div className="font-medium">
                  <div className="flex items-center gap-2">
                    <IconFileText className="w-4 h-4 text-slate-400" />
                    <span>{project.title}</span>
                    {((project as any).slug || (project as any).projectKey) && (
                      <button
                        className="font-mono text-xs text-muted-foreground px-2 py-1 rounded border bg-background hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        onClick={(e) => handleSlugCopy(((project as any).slug || (project as any).projectKey) as string, e)}
                        title="Click to copy project ID"
                      >
                        {(project as any).slug || (project as any).projectKey}
                      </button>
                    )}
                  </div>
                </div>
                {!hideDescription && project.description && (
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {project.description.length > 60 
                      ? `${project.description.substring(0, 60)}...` 
                      : project.description
                    }
                  </div>
                )}
              </TableCell>
              
              {!groupByClientDepartment && (
              <TableCell>
                <div className="flex items-center gap-2">
                  <IconBuilding className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-medium">{project.client?.name}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {project.department?.name}
                    </div>
                  </div>
                </div>
              </TableCell>
              )}
              
              <TableCell>
                <Badge className={getStatusColor(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-1">
                  <IconUsers className="w-4 h-4 text-slate-400" />
                  <div className="flex -space-x-2">
                    {project.projectManager && (
                      <Avatar className="w-6 h-6 border-2 border-white dark:border-slate-800">
                        <AvatarImage src={project.projectManager.image} />
                        <AvatarFallback className="text-xs">
                          {project.projectManager.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">{aggregates?.[project._id as unknown as string]?.totalTasks ?? 0}</div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">{(aggregates?.[project._id as unknown as string]?.totalHours ?? 0)}h</div>
              </TableCell>
              
              <TableCell>
                {project.targetDueDate ? (
                  <div className="text-sm">
                    {new Date(project.targetDueDate).toLocaleDateString()}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">No due date</div>
                )}
              </TableCell>
              
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <IconDots className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onProjectSelect(project._id)}>
                      <IconEdit className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewDocument(project._id)}>
                      <IconEye className="w-4 h-4 mr-2" />
                      View Project Brief
                    </DropdownMenuItem>
                    {userRole === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteProject?.(project)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Project
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
