'use client';

import { useState, Fragment } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/lib/auth-hooks';
import { SiteHeader } from '@/components/site-header';
import { Button } from '@/components/ui/button';
import { IconBuilding, IconPlus, IconSquareCheck, IconArrowNarrowDown, IconArrowsDiff, IconArrowNarrowUp, IconFlame, IconExternalLink } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Id } from '@/../convex/_generated/dataModel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Lazy load heavy components using centralized imports
import { 
  LazySprintStatsCards, 
  LazySprintFormDialog, 
  LazyTaskFormDialog 
} from '@/lib/dynamic-imports';

export default function SprintsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskFormTask, setTaskFormTask] = useState<any | null>(null);
  // Queries
  const router = useRouter();
  const activeSprints = useQuery(api.sprints.getSprintsWithDetails, { status: 'active' });
  const sprintStats = useQuery(api.sprints.getSprintStats, {});
  const upcomingSprints = useQuery(api.sprints.getSprintsWithDetails, { status: 'planning' });

  // Department aggregation view removed per UX refinement

  // Role-based permissions
  const canCreateSprints = user?.role === 'admin' || user?.role === 'pm';

  const filterBySearch = (items?: any[] | null) => {
    const list = items ?? [];
    const q = searchQuery.toLowerCase();
    if (!q) return list;
    return list.filter((sprint: any) =>
      sprint.name.toLowerCase().includes(q) ||
      sprint.description?.toLowerCase().includes(q) ||
      sprint.client?.name?.toLowerCase().includes(q) ||
      sprint.department?.name?.toLowerCase().includes(q)
    );
  };
  const filteredActive = filterBySearch(activeSprints)
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

  const filteredUpcoming = filterBySearch(upcomingSprints)
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

  // Note: moved to unified sprint page; keep table-only here

  if (!user) return null;

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Client Sprints</h1>
            <p className="text-slate-600 dark:text-slate-300">Sprint tasks by client and department</p>
          </div>
          {canCreateSprints && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Sprint
            </Button>
          )}
        </div>

        {/* Statistics Cards */}
        {sprintStats && <LazySprintStatsCards stats={sprintStats} />}

        <Tabs defaultValue="active" className="h-full flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Sprints</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Sprints</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-2">
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
                    {(filteredActive || []).map((sprint: any) => (
                      <Fragment key={`s-${sprint._id}`}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/sprint/${sprint._id}`)}>
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
                          <TableRow key={t._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setTaskFormTask(t); setIsTaskFormOpen(true); }}>
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

          <TabsContent value="upcoming" className="mt-2">
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
                    {(filteredUpcoming || []).map((sprint: any) => (
                      <Fragment key={`up-${sprint._id}`}>
                        <TableRow className="bg-muted/40 hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/sprint/${sprint._id}`)}>
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
                              No tasks have been added. <button className="underline" onClick={() => router.push(`/sprint/${sprint._id}`)}>Add tasks</button>
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
                            <TableRow key={t._id} className="hover:bg-muted/50 cursor-pointer" onClick={() => { setTaskFormTask(t); setIsTaskFormOpen(true); }}>
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
        </Tabs>
      </div>

      <LazySprintFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={(id) => router.push(`/sprint/${id}`)}
        hideDescription
      />

      <LazyTaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        task={taskFormTask as any}
        onSuccess={() => setIsTaskFormOpen(false)}
      />
    </>
  );
}

// Small logo component to safely fetch and render client logo
function SprintClientLogo({ storageId, clientName }: { storageId?: Id<'_storage'>; clientName: string }) {
  const logoUrl = useQuery(api.clients.getLogoUrl, storageId ? ({ storageId } as any) : 'skip') as string | undefined;
  if (storageId && logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${clientName} logo`} className="h-4 w-4 rounded object-cover" />;
  }
  return <IconBuilding className="h-4 w-4 text-slate-400" />;
}

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