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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IconBell, IconCheck, IconEye, IconMessage, IconList, IconFileText, IconCalendarEvent } from "@tabler/icons-react"
import { LiveTimestamp } from '@/components/live-timestamp'
import { useState, useMemo } from 'react'

export default function InboxPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'new' | 'cleared'>('new');

  // Real-time Convex queries - must be called before any early returns
  const notifications = useQuery(api.notifications.getUserNotifications, { limit: 50 });
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);
  
  // Mutations for interacting with notifications
  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const markAsUnread = useMutation(api.notifications.markNotificationAsUnread);

  // Filter and group notifications based on active tab - must be called before early returns
  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    return notifications.filter(notification => {
      if (activeTab === 'new') {
        return !notification.isRead;
      } else {
        return notification.isRead && notification.createdAt >= thirtyDaysAgo;
      }
    });
  }, [notifications, activeTab]);

  // Group notifications by date - must be called before early returns
  const groupedNotifications = useMemo(() => {
    const groups: { [key: string]: typeof filteredNotifications } = {
      'Today': [],
      'This Week': [],
      'This Month': []
    };

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    filteredNotifications.forEach(notification => {
      const timeDiff = now - notification.createdAt;
      
      if (timeDiff < oneDay) {
        groups['Today'].push(notification);
      } else if (timeDiff < oneWeek) {
        groups['This Week'].push(notification);
      } else if (timeDiff < oneMonth) {
        groups['This Month'].push(notification);
      }
    });

    // Sort each group by newest first
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.createdAt - a.createdAt);
    });

    return groups;
  }, [filteredNotifications]);

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

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await markAsUnread({ notificationId: notificationId as Id<'notifications'> });
    } catch (error) {
      console.error('Failed to mark notification as unread:', error);
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



  const getDateGroupHeader = (groupName: string, count: number) => {
    if (count === 0) return null;
    return (
      <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border/50">
        {groupName} ({count})
      </div>
    );
  };

  // Helper function to get notification type title
  const getNotificationTitle = (type: string) => {
    const titles: Record<string, string> = {
      'comment_created': 'New Comment',
      'task_assigned': 'Task Assigned',
      'task_status_changed': 'Task Updated',
      'mention': 'You were mentioned',
      'sprint_started': 'Sprint Started',
      'sprint_completed': 'Sprint Completed',
      'document_updated': 'Document Updated',
      'project_created': 'Project Created',
      'project_updated': 'Project Updated'
    };
    return titles[type] || 'Notification';
  };

  // Helper function to format notification description
  const getNotificationDescription = (notification: { title?: string; message?: string; contextTitle?: string }) => {
    const title = notification.title || '';
    const message = notification.message || '';
    
    // If we have entity context, use it
    if (notification.contextTitle) {
      return `${title} on ${notification.contextTitle}`;
    }
    
    // Fallback to existing message
    return message || title;
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
                  </div>
                </div>
              </div>

              <div className="px-4 lg:px-6">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'new' | 'cleared')} className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid w-full max-w-[200px] grid-cols-2">
                      <TabsTrigger value="new" className="text-sm">
                        New {unreadCount !== undefined && unreadCount > 0 && (
                          <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                            {unreadCount}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="cleared" className="text-sm">
                        Cleared
                      </TabsTrigger>
                    </TabsList>
                    
                    {activeTab === 'new' && unreadCount !== undefined && unreadCount > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleMarkAllAsRead}
                      >
                        <IconCheck className="mr-2 h-4 w-4" />
                        Mark all read
                      </Button>
                    )}
                  </div>

                  <TabsContent value="new" className="mt-0">
                    {/* Loading State */}
                    {notifications === undefined && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading notifications...</div>
                      </div>
                    )}

                    {/* Empty State for New Tab */}
                    {notifications !== undefined && filteredNotifications.length === 0 && activeTab === 'new' && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <IconBell className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">All caught up!</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                          You have no unread notifications. Check the &quot;Cleared&quot; tab to see your recent activity.
                        </p>
                      </div>
                    )}

                    {/* Grouped Notifications for New Tab */}
                    {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                      groupNotifications.length > 0 && (
                        <div key={groupName} className="mb-3">
                          {getDateGroupHeader(groupName, groupNotifications.length)}
                          <div className="space-y-0">
                            {groupNotifications.map((notification) => (
                              <div
                                key={notification._id}
                                className="group flex items-center gap-3 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer border-b border-border/50"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                {/* Unread indicator */}
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                                
                                {/* Icon */}
                                <div className="p-1 rounded-sm bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                  <div className="h-3.5 w-3.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>
                                
                                {/* Main content */}
                                <div className="flex-1 flex items-center gap-3">
                                  <span className="font-semibold text-sm">
                                    {getNotificationTitle(notification.type)}
                                  </span>
                                  {notification.priority && (
                                    <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {getNotificationDescription(notification)}
                                  </span>
                                </div>
                                
                                {/* Right side: timestamp and action */}
                                <div className="flex items-center gap-3">
                                  <LiveTimestamp timestamp={notification.createdAt} className="text-xs text-muted-foreground" />
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead(notification._id);
                                      }}
                                    >
                                      <IconCheck className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </TabsContent>

                  <TabsContent value="cleared" className="mt-0">
                    {/* Loading State */}
                    {notifications === undefined && (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-muted-foreground">Loading notifications...</div>
                      </div>
                    )}

                    {/* Empty State for Cleared Tab */}
                    {notifications !== undefined && filteredNotifications.length === 0 && activeTab === 'cleared' && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <IconEye className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">No cleared notifications</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-md">
                          Read notifications from the last 30 days will appear here.
                        </p>
                      </div>
                    )}

                    {/* Grouped Notifications for Cleared Tab */}
                    {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                      groupNotifications.length > 0 && (
                        <div key={groupName} className="mb-3">
                          {getDateGroupHeader(groupName, groupNotifications.length)}
                          <div className="space-y-0">
                            {groupNotifications.map((notification) => (
                              <div
                                key={notification._id}
                                className="group flex items-center gap-3 py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer border-b border-border/50"
                                onClick={() => handleNotificationClick(notification)}
                              >
                                {/* Icon */}
                                <div className="p-1 rounded-sm bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                                  <div className="h-3.5 w-3.5">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>
                                
                                {/* Main content */}
                                <div className="flex-1 flex items-center gap-3">
                                  <span className="font-semibold text-sm">
                                    {getNotificationTitle(notification.type)}
                                  </span>
                                  {notification.priority && (
                                    <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(notification.priority)}`}>
                                      {notification.priority}
                                    </Badge>
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {getNotificationDescription(notification)}
                                  </span>
                                </div>
                                
                                {/* Right side: timestamp and action */}
                                <div className="flex items-center gap-3">
                                  <LiveTimestamp timestamp={notification.createdAt} className="text-xs text-muted-foreground" />
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsUnread(notification._id);
                                      }}
                                    >
                                      <IconEye className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 