'use client';

import { useAuth } from '@/lib/auth-hooks';
import { useRouter } from 'next/navigation';
import { useState, use, Fragment } from 'react';
import { useQuery } from 'convex/react';
import Image from 'next/image';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { SiteHeader } from "@/components/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  IconBuilding, 
  IconUsers, 
  IconMail, 
  IconCalendar,
  IconFileText,
  IconActivity,
  IconArrowLeft,
  IconPlus,
  IconFolder,
  IconExternalLink,
  IconSquareCheck,
  IconArrowNarrowDown,
  IconArrowsDiff,
  IconArrowNarrowUp,
  IconFlame,
  IconHandStop
} from "@tabler/icons-react"
import { ClientStatsCards } from "@/components/clients/ClientStatsCards"
import { ClientProjectsCard } from "@/components/clients/ClientProjectsCard"
import { ClientSprintsCard } from "@/components/clients/ClientSprintsCard"
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog"
import { SprintFormDialog } from "@/components/sprints/SprintFormDialog"
import { ClientActiveSprintsKanban } from "@/components/sprints/ClientActiveSprintsKanban"
import { SprintsTable } from "@/components/sprints/SprintsTable"
import { ProjectsTable } from "@/components/projects/ProjectsTable"
import { ProjectFilters } from "@/components/projects/ProjectFilters"
import { TeamMembersTable } from "@/components/team/TeamMembersTable"
import { TeamMemberDetailsModal } from "@/components/team/TeamMemberDetailsModal"
import { ClientTeamTable } from "@/components/clients/ClientTeamTable"
// Tabs already imported above
// import { SprintFormDialog as PlanningSprintFormDialog } from "@/components/sprints/SprintFormDialog"

// Helper component to render the client's logo with fallback
function ClientLogoDisplay({ storageId, clientName }: { storageId?: any; clientName: string }) {
  // Relax generics to avoid deep type instantiation in this large component
  const logoUrl = (useQuery as any)((api as any).clients.getLogoUrl, storageId ? ({ storageId } as any) : "skip") as string | undefined;

  if (storageId && logoUrl) {
    return (
      <div className="h-12 w-12">
        <Image
          src={logoUrl}
          alt={`${clientName} logo`}
          width={48}
          height={48}
          className="h-12 w-12 rounded object-cover"
        />
        <div className="hidden h-12 w-12 rounded-full bg-muted items-center justify-center">
          <span className="text-lg font-semibold">{clientName?.charAt(0)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
      <span className="text-lg font-semibold">{clientName?.charAt(0)}</span>
    </div>
  );
}

// Small logo component to safely fetch and render client logo for sprints rows
function SprintClientLogo({ storageId, clientName }: { storageId?: Id<'_storage'>; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? ({ storageId } as any) : 'skip') as string | undefined;
  if (storageId && logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />;
  }
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
}

// Shared helpers copied from the Sprints insights page for consistent styling
function statusLabel(s: string): string {
  switch (s) {
    case 'todo': return 'To Do';
    case 'in_progress': return 'In Progress';
    case 'review': return 'Review';
    case 'on_hold': return 'On Hold';
    case 'done':
    case 'completed': return 'Completed';
    default: return String(s);
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

interface ClientDetailPageProps {
  // Next.js 15 passes params as a Promise in Client Components
  params: Promise<{ id: string }>;
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Next.js 15: unwrap params Promise using React.use()
  const { id } = use(params);
  const clientId = id as Id<"clients">;

  // Real-time Convex queries
  // Relax Convex generics to avoid deep instantiation errors in this large component
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const client = (useQuery as any)((api as any).clients.getClientById, { clientId }) as any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const clientTeam = (useQuery as any)((api as any).users.getClientTeam, { clientId }) as any;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const clientDocuments = (useQuery as any)((api as any).legacy.legacyDocuments.listDocuments, { clientId }) as any;

  // Client dashboard UI state and data (must be declared before any early returns)
  const [activeTab, setActiveTab] = useState<string>('active_sprints');
  const [showProjectDialog, setShowProjectDialog] = useState<boolean>(false);
  const [showSprintDialog, setShowSprintDialog] = useState<boolean>(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const clientDashboard = (useQuery as any)((api as any).clients.getClientDashboardById, { clientId }) as any;

  // Auth redirect is handled in `(dashboard)/layout.tsx` to avoid duplicate redirects

  // Show loading state while data is being fetched
  if (isLoading || !user || client === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading client details...</div>
      </div>
    );
  }
  

  // Handle client not found
  if (client === null) {
    return (
      <>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <IconArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </div>
                <div className="text-center py-12">
                  <IconBuilding className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
                  <p className="text-muted-foreground">The client you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Utility functions
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              {/* Client Dashboard Header */}
              <div className="mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                >
                  <IconArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ClientLogoDisplay
                    storageId={client?.logo}
                    clientName={client?.name || ''}
                  />
                  <div>
                    <h1 className="text-2xl font-bold">{client?.name}</h1>
                    {/* contact email not on schema; display website if present */}
                    <p className="text-sm text-muted-foreground">{client?.website ?? ''}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowProjectDialog(true)}>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => setShowSprintDialog(true)}>
                    <IconCalendar className="mr-2 h-4 w-4" />
                    Create Sprint
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <ClientStatsCards stats={clientDashboard?.stats} client={null} />

              {/* Tabs (client-scoped views) */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2 mt-6">
                <TabsList className="w-full grid grid-cols-5">
                  <TabsTrigger value="active_sprints">Active Sprints</TabsTrigger>
                  <TabsTrigger value="planning">Upcoming Sprints</TabsTrigger>
                  <TabsTrigger value="completed">Completed Sprints</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                {/* Active Sprints Kanban only */}
                <TabsContent value="active_sprints" className="mt-0">
                  <ClientActiveSprintsKanban clientId={clientId} />
                </TabsContent>

                {/* Planning Sprints table */}
                <PlanningTabInner clientId={clientId} onNavigate={(id) => router.push(`/sprint/${id}`)} />

                {/* Completed Sprints table */}
                <CompletedTabInner clientId={clientId} onNavigate={(id) => router.push(`/sprint/${id}`)} />

                {/* Projects view (card with search + table like sprints layout) */}
                <ProjectsTabInner clientId={clientId} />

                {/* Team Tab */}
                <TabsContent value="team" className="space-y-4">
                  {clientTeam === undefined ? (
                    <Card className="col-span-full">
                      <CardContent className="p-6">
                        <div className="text-center text-muted-foreground">Loading team members...</div>
                      </CardContent>
                    </Card>
                  ) : clientTeam.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                          <h3 className="font-medium text-muted-foreground mb-2">No team members found</h3>
                          <p className="text-sm text-muted-foreground">This client doesn&apos;t have any team members assigned yet.</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <TeamMembersTable members={(clientTeam as any)} onViewDetails={(memberId: string) => setSelectedMember(memberId)} />
                      {selectedMember && (
                        <TeamMemberDetailsModal
                          memberId={selectedMember}
                          open={!!selectedMember}
                          onOpenChange={(open: boolean) => !open && setSelectedMember(null)}
                        />
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProjectFormDialog
        open={showProjectDialog}
        onOpenChange={setShowProjectDialog}
        defaultValues={{
          clientId: clientId,
          departmentId: clientDashboard?.departments?.[0]?._id,
        }}
        hideDescription
        showDueDate
        onSuccess={(result) => {
          setShowProjectDialog(false);
          router.push(`/editor/${(result as any).documentId}`);
        }}
      />

      {/* Sprint creation: preselect this client, then route to sprint page on success */}
      <SprintFormDialog
        open={showSprintDialog}
        onOpenChange={setShowSprintDialog}
        initialClientId={clientId}
        initialDepartmentId={clientDashboard?.departments?.[0]?._id}
        hideDescription
        onSuccess={(newSprintId) => {
          setShowSprintDialog(false);
          router.push(`/sprint/${newSprintId}`);
        }}
      />
    </>
  );
}
function ProjectsTabInner({ clientId }: { clientId: Id<'clients'> }) {
  const router = useRouter();
  const projects = (useQuery(api.projects.listProjects, { clientId }) as any) || [];
  const tasks = useQuery(api.tasks.getTasks, {}) as any[] | undefined;
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProjects = (() => {
    const q = searchTerm.toLowerCase();
    if (!q) return projects;
    return projects.filter((p: any) =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.client?.name || '').toLowerCase().includes(q) ||
      (p.department?.name || '').toLowerCase().includes(q)
    );
  })();

  const tasksByProject = (() => {
    const map = new Map<string, any[]>();
    (tasks || []).forEach((t: any) => {
      if (!t.projectId) return;
      if (!map.has(String(t.projectId))) map.set(String(t.projectId), []);
      map.get(String(t.projectId))!.push(t);
    });
    return map;
  })();
  return (
    <TabsContent value="projects" className="mt-4">
      <Card className='gap-3 py-6'>
        <CardHeader>
          <div className="mb-2">
            <ProjectFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-2 font-bold">Project</th>
                  <th className="px-4 py-2 font-bold">Status</th>
                  <th className="px-4 py-2 font-bold">Assignee</th>
                  <th className="px-4 py-2 font-bold">Priority</th>
                  <th className="px-4 py-2 font-bold">Size (hours)</th>
                  <th className="px-4 py-2 font-bold text-right">Due</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project: any) => 
                  <Fragment key={`proj-wrap-${project._id}`}>
                    <tr
                      key={`proj-${project._id}`}
                      className="bg-muted/40 hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/projects/${project._id}/details`)}
                    >
                      <td colSpan={6} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <IconFileText className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold inline-flex items-center gap-1">
                              {project.title}
                              <button
                                className="text-muted-foreground hover:text-foreground inline-flex items-center ml-0.5"
                                onClick={(e) => { e.stopPropagation(); window.open(`/projects/${project._id}/details`, '_blank'); }}
                                title="Open project in new tab"
                              >
                                <IconExternalLink className="w-3 h-3 ml-1" />
                              </button>
                            </span>
                            <Badge className={statusBadgeClass(String(project.status))}>{statusLabel(String(project.status))}</Badge>
                            <span className="text-xs text-muted-foreground">{(tasksByProject.get(String(project._id)) || []).length} tasks</span>
                            {(() => {
                              const list = (tasksByProject.get(String(project._id)) || []) as any[];
                              const total = list.length;
                              const done = list.filter((t: any) => ['done','completed'].includes(String(t.status))).length;
                              const pct = total ? Math.round((done / total) * 100) : 0;
                              return (
                                <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                                  <div className="h-2 bg-blue-500" style={{ width: `${pct}%` }} />
                                </div>
                              );
                            })()}
                          </div>
                          <div className="text-sm font-semibold">
                            {project.targetDueDate ? new Date(project.targetDueDate).toLocaleDateString() : '—'}
                          </div>
                        </div>
                      </td>
                    </tr>
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
                        <tr key={`task-${project._id}-${t._id}`} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/projects/${project._id}/details`)}>
                          <td className="px-4 py-2 pl-8">
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
                          </td>
                          <td className="px-4 py-2">
                            <Badge className={statusBadgeClass(String(t.status))}>{statusLabel(String(t.status))}</Badge>
                          </td>
                          <td className="px-4 py-2">
                            {t.assignee ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={t.assignee?.image} />
                                  <AvatarFallback className="text-xs">{t.assignee?.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{t.assignee?.name || t.assignee?.email || 'Assigned'}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-2"><div className="flex items-center justify-center">{getPriorityIcon(String(t.priority))}</div></td>
                          <td className="px-4 py-2"><span className="text-sm">{(t.sizeHours ?? t.estimatedHours ?? 0)}h</span></td>
                          <td className="px-4 py-2 text-right">
                            {t.dueDate ? (
                              <span className="text-sm">{new Date(t.dueDate).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-sm text-slate-400">No due date</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                )}
              </tbody>
            </table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}


function PlanningTabInner({ clientId, onNavigate }: { clientId: Id<'clients'>; onNavigate: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const planning = useQuery(api.sprints.getSprintsWithDetails, { clientId, status: 'planning' }) || [];

  const filterBySearch = (items?: any[] | null) => {
    const list = items ?? [];
    const q = searchQuery.toLowerCase();
    if (!q) return list;
    return list.filter((sprint: any) =>
      (sprint.name || '').toLowerCase().includes(q) ||
      (sprint.description || '').toLowerCase().includes(q) ||
      (sprint.client?.name || '').toLowerCase().includes(q) ||
      (sprint.department?.name || '').toLowerCase().includes(q)
    );
  };

  const filteredPlanning = filterBySearch(planning)
    ?.slice()
    .sort((a: any, b: any) => {
      const aClient = (a.client?.name || '').toLowerCase();
      const bClient = (b.client?.name || '').toLowerCase();
      if (aClient !== bClient) return aClient.localeCompare(bClient);
      const aDept = (a.department?.name || '').toLowerCase();
      const bDept = (b.department?.name || '').toLowerCase();
      if (aDept !== bDept) return aDept.localeCompare(bDept);
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <TabsContent value="planning" className="mt-6">
      <Card className='gap-3 py-6'>
        <CardHeader>
          <div className="mb-2">
            <Input
              placeholder="Search sprints"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sprint</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Assignee</TableHead>
                <TableHead className="font-bold">Priority</TableHead>
                <TableHead className="font-bold">Size (hours)</TableHead>
                <TableHead className="font-bold text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredPlanning || []).map((sprint: any) => (
                <Fragment key={`up-wrap-${sprint._id}`}>
                  <TableRow key={`up-${sprint._id}`} className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => onNavigate(sprint._id as any)}>
                    <TableCell colSpan={6} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SprintClientLogo storageId={sprint.client?.logo as Id<'_storage'> | undefined} clientName={sprint.client?.name || 'Client'} />
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold">{sprint.name}</span>
                            <span className="text-sm text-muted-foreground ml-0.5">{sprint.client?.name || 'Client'} / {sprint.department?.name || 'Department'}</span>
                            <button
                              className="text-muted-foreground hover:text-foreground inline-flex items-center"
                              onClick={(e) => { e.stopPropagation(); window.open(`/sprint/${sprint._id}`, '_blank'); }}
                              title="Open sprint in new tab"
                            >
                              <IconExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          </span>
                          <Badge variant="outline">{(sprint.status || '').replaceAll('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{sprint.totalTasks} tasks</span>
                          <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                            <div className="h-2 bg-blue-500" style={{ width: `${sprint.progressPercentage ?? 0}%` }} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  {((sprint.tasks || []).length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="pl-8 text-sm text-muted-foreground">
                        No tasks have been added. <button className="underline" onClick={() => onNavigate(sprint._id as any)}>Add tasks</button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    (sprint.tasks || [])
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
                      <TableRow key={t._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate(sprint._id as any)}>
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-2">
                            <IconSquareCheck className="w-4 h-4 text-slate-400" />
                            <span className={`font-medium ${['done','completed'].includes(String(t.status)) ? 'line-through text-slate-400' : ''}`}>{t.title}</span>
                            {(t as any).slug && (
                              <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded border bg-background">
                                {(t as any).slug}
                              </span>
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
                          <div className="flex items-center justify-center">{getPriorityIcon(String(t.priority))}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{(t.sizeHours ?? t.estimatedHours ?? 0)}h</span>
                        </TableCell>
                        <TableCell className="text-right">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : <span className="text-slate-400">No due date</span>}</TableCell>
                      </TableRow>
                    ))
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

function CompletedTabInner({ clientId, onNavigate }: { clientId: Id<'clients'>; onNavigate: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const completed = useQuery(api.sprints.getSprintsWithDetails, { clientId, status: 'complete' }) || [];

  const filterBySearch = (items?: any[] | null) => {
    const list = items ?? [];
    const q = searchQuery.toLowerCase();
    if (!q) return list;
    return list.filter((sprint: any) =>
      (sprint.name || '').toLowerCase().includes(q) ||
      (sprint.description || '').toLowerCase().includes(q) ||
      (sprint.client?.name || '').toLowerCase().includes(q) ||
      (sprint.department?.name || '').toLowerCase().includes(q)
    );
  };

  const filteredCompleted = filterBySearch(completed)
    ?.slice()
    .sort((a: any, b: any) => {
      const aClient = (a.client?.name || '').toLowerCase();
      const bClient = (b.client?.name || '').toLowerCase();
      if (aClient !== bClient) return aClient.localeCompare(bClient);
      const aDept = (a.department?.name || '').toLowerCase();
      const bDept = (b.department?.name || '').toLowerCase();
      if (aDept !== bDept) return aDept.localeCompare(bDept);
      return (a.name || '').localeCompare(b.name || '');
    });

  return (
    <TabsContent value="completed" className="mt-6">
      <Card className='gap-3 py-6'>
        <CardHeader>
          <div className="mb-2">
            <Input
              placeholder="Search sprints"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Sprint</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="font-bold">Assignee</TableHead>
                <TableHead className="font-bold">Priority</TableHead>
                <TableHead className="font-bold">Size (hours)</TableHead>
                <TableHead className="font-bold text-right">Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(filteredCompleted || []).map((sprint: any) => (
                <Fragment key={`cm-wrap-${sprint._id}`}>
                  <TableRow key={`cm-${sprint._id}`} className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => onNavigate(sprint._id as any)}>
                    <TableCell colSpan={6} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <SprintClientLogo storageId={sprint.client?.logo as Id<'_storage'> | undefined} clientName={sprint.client?.name || 'Client'} />
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold">{sprint.name}</span>
                            <span className="text-sm text-muted-foreground ml-0.5">{sprint.client?.name || 'Client'} / {sprint.department?.name || 'Department'}</span>
                            <button
                              className="text-muted-foreground hover:text-foreground inline-flex items-center"
                              onClick={(e) => { e.stopPropagation(); window.open(`/sprint/${sprint._id}`, '_blank'); }}
                              title="Open sprint in new tab"
                            >
                              <IconExternalLink className="w-3 h-3 ml-1" />
                            </button>
                          </span>
                          <Badge variant="outline">{(sprint.status || '').replaceAll('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground">{sprint.totalTasks} tasks</span>
                          <div className="w-32 h-2 rounded bg-muted overflow-hidden">
                            <div className="h-2 bg-blue-500" style={{ width: `${sprint.progressPercentage ?? 0}%` }} />
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : '—'} — {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : '—'}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  {(sprint.tasks || [])
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
                    <TableRow key={t._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onNavigate(sprint._id as any)}>
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-2">
                          <IconSquareCheck className="w-4 h-4 text-slate-400" />
                          <span className={`font-medium ${['done','completed'].includes(String(t.status)) ? 'line-through text-slate-400' : ''}`}>{t.title}</span>
                          {(t as any).slug && (
                            <span className="font-mono text-[10px] text-muted-foreground px-2 py-0.5 rounded border bg-background">
                              {(t as any).slug}
                            </span>
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
                        <div className="flex items-center justify-center">{getPriorityIcon(String(t.priority))}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{(t.sizeHours ?? t.estimatedHours ?? 0)}h</span>
                      </TableCell>
                      <TableCell className="text-right">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : <span className="text-slate-400">No due date</span>}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}