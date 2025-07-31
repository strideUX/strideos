'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconPlus, IconDotsVertical, IconCalendar, IconUsers, IconTarget, IconTrendingUp } from '@tabler/icons-react';
import { SprintFormDialog } from '@/components/admin/SprintFormDialog';

export default function SprintsPage() {
  const { user } = useAuth();
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);

  // Queries
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listAllDepartments, {});
  const users = useQuery(api.users.listUsers, {});
  
  const sprints = useQuery(api.sprints.getSprints, {
    clientId: selectedClient === 'all' ? undefined : selectedClient,
    departmentId: selectedDepartment === 'all' ? undefined : selectedDepartment,
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });

  const sprintStats = useQuery(api.sprints.getSprintStats, {
    clientId: selectedClient === 'all' ? undefined : selectedClient,
    departmentId: selectedDepartment === 'all' ? undefined : selectedDepartment,
  });

  // Role-based permissions
  const canCreateSprints = user?.role === 'admin' || user?.role === 'pm';
  const canEditSprints = user?.role === 'admin' || user?.role === 'pm';
  const canDeleteSprints = user?.role === 'admin' || user?.role === 'pm';

  // Filter sprints based on search query
  const filteredSprints = sprints?.filter(sprint => 
    sprint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.client?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sprint.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning': return 'secondary';
      case 'active': return 'default';
      case 'review': return 'outline';
      case 'complete': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'complete': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sprint Management</h1>
              <p className="text-muted-foreground">
                Plan and manage development sprints with capacity tracking and task assignment.
              </p>
            </div>
            {canCreateSprints && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Sprint
              </Button>
            )}
          </div>

          {/* Statistics Cards */}
          {sprintStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sprints</CardTitle>
                  <IconCalendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sprintStats.totalSprints}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all departments
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
                  <IconTarget className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sprintStats.byStatus.active}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently running
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
                  <IconTrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sprintStats.capacityUtilization.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {sprintStats.totalCommitted} / {sprintStats.totalCapacity} points
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sprintStats.averageVelocity.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Points per sprint
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter sprints by client, department, status, or search by name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Client</label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clients</SelectItem>
                      {clients?.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All departments</SelectItem>
                      {departments?.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="complete">Complete</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <Input
                    placeholder="Search sprints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sprints Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sprints</CardTitle>
              <CardDescription>
                {filteredSprints.length} sprint{filteredSprints.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSprints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No sprints found matching your criteria.</p>
                  {canCreateSprints && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      Create First Sprint
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Sprint Master</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSprints.map((sprint) => (
                      <TableRow key={sprint._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sprint.name}</div>
                            {sprint.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {sprint.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{sprint.client?.name}</TableCell>
                        <TableCell>{sprint.department?.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(sprint.status)}>
                            {sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</div>
                            <div className="text-muted-foreground">{sprint.duration} week{sprint.duration !== 1 ? 's' : ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{sprint.totalCapacity} points</div>
                            <div className="text-muted-foreground">
                              {sprint.committedPoints} committed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{sprint.completedPoints} / {sprint.committedPoints} points</div>
                            <div className="text-muted-foreground">
                              {sprint.committedPoints > 0 
                                ? `${((sprint.completedPoints / sprint.committedPoints) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sprint.sprintMaster?.name || 'Unassigned'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <IconDotsVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditSprints && (
                                <DropdownMenuItem onClick={() => setEditingSprint(sprint)}>
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canDeleteSprints && (
                                <DropdownMenuItem 
                                  onClick={() => {
                                    // TODO: Implement delete functionality
                                    console.log('Delete sprint:', sprint._id);
                                  }}
                                  className="text-red-600"
                                >
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sprint Form Dialog */}
        <SprintFormDialog
          open={isCreateDialogOpen || !!editingSprint}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setEditingSprint(null);
            }
          }}
          sprint={editingSprint}
          clients={clients || []}
          departments={departments || []}
          users={users || []}
        />
      </SidebarInset>
    </SidebarProvider>
  );
} 