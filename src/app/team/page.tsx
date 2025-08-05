'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { IconSearch, IconCalendar, IconBuilding, IconMail, IconUsers } from "@tabler/icons-react"

export default function TeamPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Real-time Convex queries - must be called before any early returns
  const teamWorkload = useQuery(api.users.getTeamWorkload, {
    includeInactive: false,
  });

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  // Don't render page if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Redirecting to sign-in...</div>
      </div>
    );
  }

  // Show loading state while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  // Filter team members based on search and filters
  const filteredTeamMembers = teamWorkload?.filter(member => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        member.name?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.jobTitle?.toLowerCase().includes(searchLower) ||
        member.departments?.some(dept => dept.name?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Department filter
    if (departmentFilter !== 'all') {
      const matchesDepartment = member.departments?.some(dept => 
        dept.name?.toLowerCase() === departmentFilter.toLowerCase()
      );
      if (!matchesDepartment) return false;
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (member.workload?.status !== statusFilter) return false;
    }

    return true;
  }) || [];

  // Get unique departments for filter dropdown
  const availableDepartments = Array.from(
    new Set(
      teamWorkload?.flatMap(member => 
        member.departments?.map(dept => dept.name) || []
      ) || []
    )
  ).filter(Boolean);

  // Utility functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "busy":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "unavailable":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getWorkloadColor = (workload: number) => {
    if (workload >= 90) return "bg-red-500";
    if (workload >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleMemberContact = (member: { email?: string }) => {
    if (member.email) {
      window.location.href = `mailto:${member.email}`;
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
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team</h1>
                    <p className="text-muted-foreground">
                      Team capacity planning and member management
                    </p>
                  </div>
                  <Button>
                    <IconUsers className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search team members..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {availableDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept.toLowerCase()}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Team Members Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Loading State */}
                  {teamWorkload === undefined && (
                    <div className="col-span-full flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading team members...</div>
                    </div>
                  )}

                  {/* Empty State */}
                  {teamWorkload !== undefined && filteredTeamMembers.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12">
                      <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No team members found</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        {searchQuery || departmentFilter !== 'all' || statusFilter !== 'all' 
                          ? 'Try adjusting your search or filters.' 
                          : 'Team members will appear here when they are added to the system.'}
                      </p>
                    </div>
                  )}

                  {/* Team Members List */}
                  {filteredTeamMembers.map((member) => (
                    <Card key={member._id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.image || ''} alt={member.name || 'User'} />
                            <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{member.name || 'Unknown User'}</h3>
                            <p className="text-sm text-muted-foreground">{member.jobTitle || 'No title'}</p>
                            {member.departments && member.departments.length > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <IconBuilding className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {member.departments.map(dept => dept.name).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge className={getStatusColor(member.workload?.status || 'available')} variant="secondary">
                            {member.workload?.status || 'available'}
                          </Badge>
                        </div>

                        {/* Capacity and Workload */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Capacity</span>
                              <span>{member.workload?.capacity || 0}%</span>
                            </div>
                            <Progress value={member.workload?.capacity || 0} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Workload</span>
                              <span className={(member.workload?.currentWorkload || 0) >= 90 ? "text-red-600" : ""}>
                                {member.workload?.currentWorkload || 0}%
                              </span>
                            </div>
                            <Progress 
                              value={member.workload?.currentWorkload || 0} 
                              className="h-2" 
                              style={{
                                '--progress-background': getWorkloadColor(member.workload?.currentWorkload || 0)
                              } as React.CSSProperties}
                            />
                          </div>
                          
                          {/* Task Summary */}
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{member.workload?.activeTasks || 0} active tasks</span>
                            <span>{member.workload?.totalStoryPoints || 0} story points</span>
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Active Projects</p>
                          <div className="flex flex-wrap gap-1">
                            {member.projects && member.projects.length > 0 ? (
                              member.projects.map((project, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {project?.title || 'Untitled Project'}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No active projects</span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleMemberContact(member)}
                            disabled={!member.email}
                          >
                            <IconMail className="mr-1 h-3 w-3" />
                            Contact
                          </Button>
                          <Button variant="ghost" size="sm" className="flex-1">
                            <IconCalendar className="mr-1 h-3 w-3" />
                            Schedule
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 