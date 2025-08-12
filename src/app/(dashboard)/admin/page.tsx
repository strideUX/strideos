'use client';

import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { SiteHeader } from '@/components/site-header';
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
  IconUsers, 
  IconBuilding, 
  IconChecklist, 
  IconCalendar,
  IconActivity,
  IconArrowUpRight,
  IconArrowDownRight,
  IconMinus
} from '@tabler/icons-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user: currentUser } = useAuth();

  // Fetch system-wide data
  const users = useQuery(api.users.listUsers, {});
  const clients = useQuery(api.clients.listClients, {});
  const departments = useQuery(api.departments.listDepartments, {});
  const tasks = useQuery(api.tasks.listTasks, {});
  const sprints = useQuery(api.sprints.listSprints, {});

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter(u => u.status === 'active').length || 0;
  const invitedUsers = users?.filter(u => u.status === 'invited').length || 0;
  
  const totalClients = clients?.length || 0;
  const activeClients = clients?.filter(c => c.status === 'active').length || 0;
  
  const totalDepartments = departments?.length || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter(t => t.status === 'done').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
  
  const totalSprints = sprints?.length || 0;
  const activeSprints = sprints?.filter(s => s.status === 'active').length || 0;
  const completedSprints = sprints?.filter(s => s.status === 'complete').length || 0;

  // Calculate completion rates
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const sprintCompletionRate = totalSprints > 0 ? Math.round((completedSprints / totalSprints) * 100) : 0;
  const userActivationRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: IconArrowUpRight, color: 'text-green-600', text: '+' + (current - previous) };
    if (current < previous) return { icon: IconArrowDownRight, color: 'text-red-600', text: (current - previous).toString() };
    return { icon: IconMinus, color: 'text-gray-600', text: '0' };
  };

  // Mock previous period data for demonstration
  const previousUsers = Math.max(0, totalUsers - 2);
  const previousTasks = Math.max(0, totalTasks - 5);
  const previousSprints = Math.max(0, totalSprints - 1);

  const userChange = getChangeIndicator(totalUsers, previousUsers);
  const taskChange = getChangeIndicator(totalTasks, previousTasks);
  const sprintChange = getChangeIndicator(totalSprints, previousSprints);

  return (
    <>
      <SiteHeader user={currentUser} />
      <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-300">
                System overview and analytics
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/admin/users">
                  <IconUsers className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/clients">
                  <IconBuilding className="w-4 h-4 mr-2" />
                  Manage Clients
                </Link>
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Users Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <userChange.icon className={`h-3 w-3 mr-1 ${userChange.color}`} />
                  <span className={userChange.color}>{userChange.text}</span>
                  <span className="ml-1">from last period</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeUsers} Active
                  </Badge>
                  {invitedUsers > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {invitedUsers} Invited
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Clients Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                <IconBuilding className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeClients}</div>
                <p className="text-xs text-muted-foreground">
                  of {totalClients} total clients
                </p>
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {totalDepartments} Departments
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tasks Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <IconChecklist className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <taskChange.icon className={`h-3 w-3 mr-1 ${taskChange.color}`} />
                  <span className={taskChange.color}>{taskChange.text}</span>
                  <span className="ml-1">from last period</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {completedTasks} Done
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {inProgressTasks} In Progress
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Sprints Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sprints</CardTitle>
                <IconCalendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSprints}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <sprintChange.icon className={`h-3 w-3 mr-1 ${sprintChange.color}`} />
                  <span className={sprintChange.color}>{sprintChange.text}</span>
                  <span className="ml-1">from last period</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeSprints} Active
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {completedSprints} Complete
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Task Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Completion Rate</CardTitle>
                <CardDescription>Overall task completion performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{taskCompletionRate}%</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {completedTasks} of {totalTasks} tasks completed
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${taskCompletionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Sprint Completion Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sprint Completion Rate</CardTitle>
                <CardDescription>Sprint delivery performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{sprintCompletionRate}%</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {completedSprints} of {totalSprints} sprints completed
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${sprintCompletionRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* User Activation Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Activation Rate</CardTitle>
                <CardDescription>User account activation success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{userActivationRate}%</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {activeUsers} of {totalUsers} users active
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${userActivationRate}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                  <Link href="/admin/users">
                    <IconUsers className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="font-semibold">Manage Users</span>
                    <span className="text-sm text-muted-foreground">Add, edit, and manage user accounts</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                  <Link href="/admin/clients">
                    <IconBuilding className="h-6 w-6 mb-2 text-green-600" />
                    <span className="font-semibold">Manage Clients</span>
                    <span className="text-sm text-muted-foreground">Create and manage client relationships</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                  <Link href="/tasks">
                    <IconChecklist className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="font-semibold">View Tasks</span>
                    <span className="text-sm text-muted-foreground">Monitor task progress and assignments</span>
                  </Link>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                  <Link href="/sprints">
                    <IconCalendar className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="font-semibold">View Sprints</span>
                    <span className="text-sm text-muted-foreground">Track sprint planning and execution</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <CardDescription>Latest system activity and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users && users.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <IconActivity className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">User Management</p>
                      <p className="text-xs text-muted-foreground">
                        {totalUsers} users registered • {activeUsers} active • {invitedUsers} pending invitations
                      </p>
                    </div>
                  </div>
                )}
                
                {clients && clients.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <IconBuilding className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Client Management</p>
                      <p className="text-xs text-muted-foreground">
                        {totalClients} clients • {activeClients} active • {totalDepartments} departments
                      </p>
                    </div>
                  </div>
                )}
                
                {tasks && tasks.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <IconChecklist className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Task Management</p>
                      <p className="text-xs text-muted-foreground">
                        {totalTasks} tasks • {completedTasks} completed • {inProgressTasks} in progress
                      </p>
                    </div>
                  </div>
                )}
                
                {sprints && sprints.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <IconCalendar className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sprint Management</p>
                      <p className="text-xs text-muted-foreground">
                        {totalSprints} sprints • {activeSprints} active • {completedSprints} completed
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </>
  );
} 