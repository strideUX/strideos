/**
 * NotificationBell - Interactive notification dropdown component with real-time updates
 *
 * @remarks
 * Displays user notifications in a dropdown menu with unread count badge.
 * Supports marking notifications as read, deleting notifications, and navigation to related content.
 * Integrates with Convex for real-time notification data and operations.
 * Features priority-based styling and type-specific icons for different notification categories.
 *
 * @example
 * ```tsx
 * <NotificationBell />
 * ```
 */

// 1. External imports
import React, { useState, useMemo, useCallback, memo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Check,
  ExternalLink,
  UserPlus
} from 'lucide-react';

// 2. Internal imports
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// 3. Types
interface Notification {
  /** Unique identifier for the notification */
  _id: string;
  /** Whether the notification has been read */
  isRead: boolean;
  /** Notification title text */
  title: string;
  /** Notification message content */
  message: string;
  /** Notification type for categorization */
  type?: string;
  /** Priority level of the notification */
  priority?: string;
  /** URL to navigate to when clicked */
  actionUrl?: string;
  /** Text for the action button */
  actionText?: string;
  /** Related task identifier */
  relatedTaskId?: string;
  /** Related comment identifier */
  relatedCommentId?: string;
  /** Task identifier (legacy field) */
  taskId?: string;
  /** When the notification was created */
  createdAt: Date;
}

interface NotificationBellProps {
  // No props required for this component
}

// 4. Component definition
export const NotificationBell = memo(function NotificationBell({}: NotificationBellProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (No props to destructure)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const router = useRouter();
  
  const unreadCount = useQuery(api.notifications.getUnreadNotificationCount);
  const notifications = useQuery(api.notifications.getUserNotifications, { 
    limit: 10,
    unreadOnly: false 
  });

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const hasUnreadNotifications = useMemo(() => {
    return unreadCount !== undefined && unreadCount > 0;
  }, [unreadCount]);

  const hasNotifications = useMemo(() => {
    return notifications && notifications.length > 0;
  }, [notifications]);

  const displayUnreadCount = useMemo(() => {
    if (!hasUnreadNotifications) return null;
    return unreadCount > 99 ? '99+' : unreadCount;
  }, [hasUnreadNotifications, unreadCount]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as Id<"notifications"> });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [markAsRead]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [markAllAsRead]);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as Id<"notifications"> });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [deleteNotification]);

  const handleNotificationClick = useCallback(async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate to related content
    if (notification.type === 'task_assigned' || notification.type === 'task_comment_mention' || notification.type === 'task_comment_activity') {
      const taskId = (notification.relatedTaskId || notification.taskId);
      if (taskId) {
        router.push(`/tasks/${taskId}`);
      } else if (notification.actionUrl) {
        router.push(notification.actionUrl);
      }
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }

    setIsOpen(false);
  }, [handleMarkAsRead, router]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    handleDeleteNotification(notificationId);
  }, [handleDeleteNotification]);

  const handleViewAllNotifications = useCallback(() => {
    router.push('/notifications');
    setIsOpen(false);
  }, [router]);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case 'comment_created':
        return <MessageSquare className="h-4 w-4" />;
      case 'task_assigned':
        return <UserPlus className="h-4 w-4" />;
      case 'task_status_changed':
        return <CheckCircle className="h-4 w-4" />;
      case 'mention':
      case 'task_comment_mention':
        return <AlertCircle className="h-4 w-4" />;
      case 'task_comment_activity':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  }, []);

  const getNotificationColor = useCallback((type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'high') return 'text-orange-600';
    if (type === 'mention' || type === 'task_comment_mention') return 'text-blue-600';
    return 'text-gray-600';
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (notifications === undefined) {
    return (
      <Button variant="ghost" size="sm" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnreadNotifications && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {displayUnreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {hasUnreadNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        {!hasNotifications ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((notification) => (
              <div key={notification._id} className="relative">
                <DropdownMenuItem
                  className={`p-4 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 w-full">
                    <div className={`mt-1 ${getNotificationColor(notification.type || '', notification.priority || '')}`}>
                      {getNotificationIcon(notification.type || '')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`text-sm font-medium ${!notification.isRead ? 'text-blue-900' : ''}`}>
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => handleDeleteClick(e, notification._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className={`text-sm mt-1 ${!notification.isRead ? 'text-blue-700' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                        </span>
                        
                        {notification.actionText && (
                          <span className="text-xs text-blue-600 flex items-center">
                            {notification.actionText}
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                {!notification.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l" />
                )}
              </div>
            ))}
          </div>
        )}

        {hasNotifications && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-sm text-muted-foreground cursor-pointer"
              onClick={handleViewAllNotifications}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export default NotificationBell; 