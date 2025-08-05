'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconBell, IconCheck, IconEye, IconMessage, IconList, IconFileText, IconCalendarEvent } from "@tabler/icons-react"

export default function InboxPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Real-time Convex queries - must be called before any early returns
  const notifications = useQuery(api.notifications.getUserNotifications, { limit: 50 });
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);
  
  // Mutations for interacting with notifications
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);

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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_status_changed":
        return <IconList className="h-4 w-4" />
      case "comment_created":
      case "mention":
        return <IconMessage className="h-4 w-4" />
      case "sprint_started":
      case "sprint_completed":
        return <IconCalendarEvent className="h-4 w-4" />
      case "document_updated":
        return <IconFileText className="h-4 w-4" />
      default:
        return <IconBell className="h-4 w-4" />
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white dark:bg-red-600";
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

  // Utility functions
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as Id<"notifications"> });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: { _id: string; isRead: boolean; actionUrl?: string }) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate to action URL if available
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
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
                    <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
                    <p className="text-muted-foreground">
                      Unified notification center for all your activities
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {unreadCount !== undefined ? unreadCount : 0} unread
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={!unreadCount || unreadCount === 0}
                    >
                      <IconCheck className="mr-2 h-4 w-4" />
                      Mark all read
                    </Button>
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <div className="grid gap-4">
                  {/* Loading State */}
                  {notifications === undefined && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Loading notifications...</div>
                    </div>
                  )}

                  {/* Empty State */}
                  {notifications !== undefined && notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <IconBell className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">No notifications yet</h3>
                      <p className="text-sm text-muted-foreground text-center max-w-md">
                        When you receive notifications about tasks, comments, or project updates, they&apos;ll appear here.
                      </p>
                    </div>
                  )}

                  {/* Notifications List */}
                  {notifications && notifications.map((notification) => (
                    <Card 
                      key={notification._id} 
                      className={`transition-colors cursor-pointer hover:shadow-md ${
                        !notification.isRead 
                          ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${
                              !notification.isRead 
                                ? 'bg-blue-100 dark:bg-blue-900' 
                                : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium ${
                                  !notification.isRead 
                                    ? 'text-blue-900 dark:text-blue-100' 
                                    : ''
                                }`}>
                                  {notification.title}
                                </h3>
                                <Badge className={getPriorityColor(notification.priority)} variant="secondary">
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatTimestamp(notification.createdAt)}</span>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                              <Button variant="ghost" size="sm" title="View">
                                <IconEye className="h-4 w-4" />
                              </Button>
                            )}
                            {!notification.isRead && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                title="Mark as read"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification._id);
                                }}
                              >
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