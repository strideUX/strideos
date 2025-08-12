'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  IconUsers, 
  IconBuilding, 
  IconChecklist, 
  IconCalendar,
  IconChartBar,
  IconTrendingUp,
  IconTrendingDown,
  IconActivity,
  IconDownload,
  IconFilter,
  IconRefresh
} from '@tabler/icons-react';
import { useState } from 'react';

export default function ReportsPage() {
  const { user: currentUser } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [clientFilter, setClientFilter] = useState('all');

  // Fetch data for reports
  const users = useQuery(api.users.listUsers, {});
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listDepartments, {});
  const tasks = useQuery(api.tasks.listTasks, {});
  const sprints = useQuery(api.sprints.listSprints, {});

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access reports.</p>
        </div>
      </div>
    );
  }

  // Calculate comprehensive statistics
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.status === 'active').length || 0;
  const invitedUsers = users?.filter(u => u.status === 'invited').length || 0;
  
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  
  const totalDepartments = departments?.length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  const todoTasks = tasks?.filter(t => t.status === 'todo').length || 0;
  
  const totalSprints = sprints?.length || 0;
  const activeSprints = sprints?.filter(s => s.status === 'active').length || 0;
  const completedSprints = sprints?.filter(s => s.status === 'complete').length || 0;
  const planningSprints = sprints?.filter(s => s.status === 'planning').length || 0;

  // Calculate rates and averages
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const sprintCompletionRate = totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0;
  const userActivationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  
  // Calculate average tasks per sprint
  const tasksPerSprint = totalSprints > 0 ? Math.round(totalTasks / totalSprints) : 0;
  
  // Calculate average velocity (completed tasks per sprint)
  const averageVelocity = completedSprints > 0 ? Math.round(completedTasks / completedSprints) : 0;

  // Role distribution
  const roleDistribution = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Task priority distribution
  const priorityDistribution = tasks?.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Client performance (tasks completed per client)
  const clientPerformance = clients?.map(client => {
    const clientTasks = tasks?.filter(task => task.clientId === client._id) || [];
    const completedClientTasks = clientTasks.filter(task => task.status === 'done').length;
    const totalClientTasks = clientTasks.length;
    const completionRate = totalClientTasks > 0 ? Math.round((completedClientTasks / totalClientTasks) * 100) : 0;
    
    return {
      name: client.name,
      totalTasks: totalClientTasks,
      completedTasks: completedClientTasks,
      completionRate,
      status: client.status
    };
  }).sort((a, b) => b.completionRate - a.completionRate) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'invited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={currentUser} />
      <SidebarInset>
        <SiteHeader user={currentUser} />
        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Comprehensive insights and performance metrics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <IconDownload className="w-4 h-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" size="sm">
                <IconRefresh className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Filters</CardTitle>
              <CardDescription>Customize your analytics view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <IconFilter className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Time Range:</span>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <IconBuilding className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Client:</span>
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Clients</SelectItem>
                      {clients?.map(client => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Task Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Completion Rate</CardTitle>
                <IconTrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{taskCompletionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${taskCompletionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Sprint Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sprint Completion Rate</CardTitle>
                <IconCalendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{sprintCompletionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {completedSprints} of {totalSprints} sprints completed
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${sprintCompletionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Average Velocity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Velocity</CardTitle>
                <IconChartBar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{averageVelocity}</div>
                <p className="text-xs text-muted-foreground">
                  tasks completed per sprint
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {tasksPerSprint} avg tasks/sprint
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* User Activation Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">User Activation Rate</CardTitle>
                <IconUsers className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{userActivationRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {activeUsers} of {totalUsers} users active
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${userActivationRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Status Distribution</CardTitle>
                <CardDescription>Current task status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{completedTasks}</span>
                      <Badge variant="secondary" className="text-xs">
                        {taskCompletionRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{inProgressTasks}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span className="text-sm">To Do</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{todoTasks}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalTasks > 0 ? Math.round((todoTasks / totalTasks) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sprint Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sprint Status Distribution</CardTitle>
                <CardDescription>Current sprint lifecycle breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{completedSprints}</span>
                      <Badge variant="secondary" className="text-xs">
                        {sprintCompletionRate}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{activeSprints}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalSprints > 0 ? Math.round((activeSprints / totalSprints) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Planning</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{planningSprints}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalSprints > 0 ? Math.round((planningSprints / totalSprints) * 100) : 0}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Performance</CardTitle>
              <CardDescription>Task completion rates by client</CardDescription>
            </CardHeader>
            <CardContent>
              {clientPerformance.length > 0 ? (
                <div className="space-y-4">
                  {clientPerformance.slice(0, 5).map((client, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{client.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.completedTasks} of {client.totalTasks} tasks completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">{client.completionRate}%</p>
                          <p className="text-xs text-muted-foreground">completion rate</p>
                        </div>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconBuilding className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-300">No client performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role and Priority Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Role Distribution</CardTitle>
                <CardDescription>Breakdown of users by role</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(roleDistribution).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm capitalize">{role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Task Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Priority Distribution</CardTitle>
                <CardDescription>Breakdown of tasks by priority</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(priorityDistribution).map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          priority === 'high' ? 'bg-red-500' : 
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="text-sm capitalize">{priority}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="secondary" className="text-xs">
                          {totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Health Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Health Summary</CardTitle>
              <CardDescription>Overall system performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{activeClients}</div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <Badge variant="outline" className="mt-1">
                    {totalDepartments} Departments
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{activeSprints}</div>
                  <p className="text-sm text-muted-foreground">Active Sprints</p>
                  <Badge variant="outline" className="mt-1">
                    {averageVelocity} avg velocity
                  </Badge>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{activeUsers}</div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <Badge variant="outline" className="mt-1">
                    {invitedUsers} pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 