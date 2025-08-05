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
import { IconBell, IconCheck, IconEye, IconMessage, IconList, IconCalendar } from "@tabler/icons-react"

export default function InboxPage() {
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

  // Mock notification data - will be replaced with Convex queries
  const mockNotifications = [
    {
      id: "1",
      type: "task_assignment",
      title: "New task assigned",
      description: "You have been assigned 'Design homepage mockups'",
      priority: "high",
      read: false,
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "comment",
      title: "New comment on project",
      description: "Sarah commented on 'E-commerce redesign'",
      priority: "medium",
      read: false,
      timestamp: "4 hours ago",
    },
    {
      id: "3",
      type: "sprint_start",
      title: "Sprint started",
      description: "Sprint 'Q1 Launch' has begun",
      priority: "low",
      read: true,
      timestamp: "1 day ago",
    },
    {
      id: "4",
      type: "task_assignment",
      title: "Task completed",
      description: "Task 'Update documentation' marked as complete",
      priority: "medium",
      read: true,
      timestamp: "2 days ago",
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assignment":
        return <IconList className="h-4 w-4" />
      case "comment":
        return <IconMessage className="h-4 w-4" />
      case "sprint_start":
      case "sprint_end":
        return <IconCalendar className="h-4 w-4" />
      default:
        return <IconBell className="h-4 w-4" />
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

  const unreadCount = mockNotifications.filter(n => !n.read).length;

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
                    <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-muted-foreground">
                      Unified notification center for all your activities
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{unreadCount} unread</Badge>
                    <Button variant="outline" size="sm">
                      <IconCheck className="mr-2 h-4 w-4" />
                      Mark all read
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="grid gap-4">
                  {mockNotifications.map((notification) => (
                    <Card key={notification.id} className={`transition-colors ${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${!notification.read ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${!notification.read ? 'text-blue-900 dark:text-blue-100' : ''}`}>
                                  {notification.title}
                                </h3>
                                <Badge className={getPriorityColor(notification.priority)} variant="secondary">
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{notification.timestamp}</span>
                                {!notification.read && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <IconEye className="h-4 w-4" />
                            </Button>
                            {!notification.read && (
                              <Button variant="ghost" size="sm">
                                <IconCheck className="h-4 w-4" />
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