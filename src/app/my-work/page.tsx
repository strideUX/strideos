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
import { IconPlus, IconSearch, IconCalendar, IconUser, IconFolder } from "@tabler/icons-react"

export default function MyWorkPage() {
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

  // Mock work data - will be replaced with Convex queries
  const mockWorkItems = [
    {
      id: "1",
      type: "task",
      title: "Design homepage mockups",
      project: "Website Redesign",
      priority: "high",
      status: "in_progress",
      dueDate: "2024-02-15",
      assignee: "Sarah Johnson",
    },
    {
      id: "2",
      type: "todo",
      title: "Review user feedback",
      project: "Mobile App",
      priority: "medium",
      status: "todo",
      dueDate: "2024-02-20",
      assignee: "Mike Chen",
    },
    {
      id: "3",
      type: "task",
      title: "Update API documentation",
      project: "Backend Services",
      priority: "low",
      status: "completed",
      dueDate: "2024-02-10",
      assignee: "Alex Rodriguez",
    },
    {
      id: "4",
      type: "todo",
      title: "Prepare sprint review",
      project: "E-commerce Platform",
      priority: "high",
      status: "in_progress",
      dueDate: "2024-02-18",
      assignee: "Lisa Wang",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "todo":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "task":
        return <IconFolder className="h-4 w-4" />;
      case "todo":
        return <IconCalendar className="h-4 w-4" />;
      default:
        return <IconUser className="h-4 w-4" />;
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
                    <h1 className="text-3xl font-bold tracking-tight">My Work</h1>
                    <p className="text-muted-foreground">
                      Personal dashboard with your tasks and todos
                    </p>
                  </div>
                  <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                {/* Filters and Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search tasks and todos..."
                      className="pl-10"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="todo">Todo</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Items Grid */}
                <div className="grid gap-4">
                  {mockWorkItems.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium">{item.title}</h3>
                                <Badge className={getStatusColor(item.status)} variant="secondary">
                                  {item.status.replace('_', ' ')}
                                </Badge>
                                <Badge className={getPriorityColor(item.priority)} variant="secondary">
                                  {item.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Project: {item.project}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <IconCalendar className="h-3 w-3" />
                                  Due: {item.dueDate}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconUser className="h-3 w-3" />
                                  {item.assignee}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                            {item.status === "todo" && (
                              <Button variant="ghost" size="sm">
                                Start
                              </Button>
                            )}
                          </div>
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