'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
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
import { IconSearch, IconUser, IconCalendar, IconBuilding, IconMail } from "@tabler/icons-react"

export default function TeamPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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

  // Mock team data - will be replaced with Convex queries
  const mockTeamMembers = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah@company.com",
      role: "Senior Designer",
      department: "Design",
      avatar: "",
      capacity: 85,
      currentWorkload: 70,
      projects: ["Website Redesign", "Mobile App"],
      status: "available",
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike@company.com",
      role: "Frontend Developer",
      department: "Engineering",
      avatar: "",
      capacity: 90,
      currentWorkload: 95,
      projects: ["E-commerce Platform", "Admin Dashboard"],
      status: "busy",
    },
    {
      id: "3",
      name: "Alex Rodriguez",
      email: "alex@company.com",
      role: "Backend Developer",
      department: "Engineering",
      avatar: "",
      capacity: 80,
      currentWorkload: 60,
      projects: ["API Development", "Database Optimization"],
      status: "available",
    },
    {
      id: "4",
      name: "Lisa Wang",
      email: "lisa@company.com",
      role: "Project Manager",
      department: "Product",
      avatar: "",
      capacity: 75,
      currentWorkload: 80,
      projects: ["Q1 Planning", "Team Coordination"],
      status: "busy",
    },
  ];

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
                    <IconUser className="mr-2 h-4 w-4" />
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
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
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
                  {mockTeamMembers.map((member) => (
                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <IconBuilding className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{member.department}</span>
                            </div>
                          </div>
                          <Badge className={getStatusColor(member.status)} variant="secondary">
                            {member.status}
                          </Badge>
                        </div>

                        {/* Capacity and Workload */}
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Capacity</span>
                              <span>{member.capacity}%</span>
                            </div>
                            <Progress value={member.capacity} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Current Workload</span>
                              <span className={member.currentWorkload >= 90 ? "text-red-600" : ""}>
                                {member.currentWorkload}%
                              </span>
                            </div>
                            <Progress 
                              value={member.currentWorkload} 
                              className="h-2" 
                              style={{
                                '--progress-background': getWorkloadColor(member.currentWorkload)
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>

                        {/* Projects */}
                        <div className="mt-4">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Active Projects</p>
                          <div className="flex flex-wrap gap-1">
                            {member.projects.map((project, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {project}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Button variant="ghost" size="sm" className="flex-1">
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