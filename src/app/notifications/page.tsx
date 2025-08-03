'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  Check,
  ExternalLink,
  Search,
  Inbox,
  Archive,
  CheckCheck,
  Mail,
  MailOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'open' | 'read'>('open');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const openNotifications = useQuery(api.notifications.getUserNotifications, { 
    limit: 100,
    unreadOnly: true 
  });

  const allNotifications = useQuery(api.notifications.getUserNotifications, { 
    limit: 100,
    unreadOnly: false 
  });

  const markAsRead = useMutation(api.notifications.markNotificationAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllNotificationsAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId: notificationId as any });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId: notificationId as any });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }

    // Navigate to related content
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const handleBulkMarkAsRead = async () => {
    for (const notificationId of selectedNotifications) {
      await handleMarkAsRead(notificationId);
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedNotifications.length} notification(s)?`)) {
      return;
    }
    
    for (const notificationId of selectedNotifications) {
      await handleDeleteNotification(notificationId);
    }
    setSelectedNotifications([]);
  };

  const handleSelectAll = () => {
    const currentNotifications = getFilteredNotifications();
    if (selectedNotifications.length === currentNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(currentNotifications.map(n => n._id));
    }
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment_created':
        return <MessageSquare className="h-4 w-4" />;
      case 'task_assigned':
      case 'task_status_changed':
        return <CheckCircle className="h-4 w-4" />;
      case 'mention':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'urgent') return 'text-red-600';
    if (priority === 'high') return 'text-orange-600';
    if (priority === 'medium') return 'text-blue-600';
    return 'text-gray-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment_created': return 'Comment';
      case 'task_assigned': return 'Task Assigned';
      case 'task_status_changed': return 'Task Updated';
      case 'mention': return 'Mention';
      case 'document_updated': return 'Document Updated';
      case 'sprint_started': return 'Sprint Started';
      case 'sprint_completed': return 'Sprint Completed';
      default: return 'Notification';
    }
  };

  // Filter notifications based on current tab and filters
  const getFilteredNotifications = () => {
    const notifications = activeTab === 'open' ? openNotifications : allNotifications;
    if (!notifications) return [];

    let filtered = notifications;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // For read tab, only show read notifications
    if (activeTab === 'read') {
      filtered = filtered.filter(n => n.isRead);
    }

    return filtered;
  };

  const filteredNotifications = getFilteredNotifications();
  const openCount = openNotifications?.length || 0;
  const readCount = allNotifications?.filter(n => n.isRead)?.length || 0;

  // Safety check for undefined user during loading
  if (!user) {
    return (
      <SidebarProvider>
        <AppSidebar user={undefined} />
        <SidebarInset>
          <SiteHeader user={undefined} />
          <div className="flex-1 flex items-center justify-center">
            <p>Loading...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (openNotifications === undefined || allNotifications === undefined) {
    return (
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <SiteHeader user={user} />
          <div className="flex-1 flex items-center justify-center">
            <p>Loading notifications...</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex-1 flex flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
              <p className="text-muted-foreground">
                {activeTab === 'open' ? openCount : readCount} {activeTab === 'open' ? 'unread' : 'read'} notifications
              </p>
            </div>
            {activeTab === 'open' && openCount > 0 && (
              <Button onClick={handleMarkAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All as Read
              </Button>
            )}
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="comment_created">Comments</SelectItem>
                    <SelectItem value="task_assigned">Task Assignments</SelectItem>
                    <SelectItem value="task_status_changed">Task Updates</SelectItem>
                    <SelectItem value="mention">Mentions</SelectItem>
                    <SelectItem value="document_updated">Document Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'open' | 'read')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="open">
                <Mail className="mr-2 h-4 w-4" />
                Open ({openCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                <MailOpen className="mr-2 h-4 w-4" />
                Read ({readCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No unread notifications</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || typeFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'You\'re all caught up!'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedNotifications.length} of {filteredNotifications.length} selected
                        </span>
                      </div>
                      {selectedNotifications.length > 0 && (
                        <div className="flex space-x-2">
                          <Button size="sm" onClick={handleBulkMarkAsRead}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark as Read
                          </Button>
                          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Notification</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotifications.map((notification) => (
                          <TableRow 
                            key={notification._id}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              !notification.isRead ? 'bg-blue-50/50' : ''
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedNotifications.includes(notification._id)}
                                onCheckedChange={() => handleSelectNotification(notification._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start space-x-3">
                                <div className={`mt-1 ${getNotificationColor(notification.type, notification.priority)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`font-medium ${!notification.isRead ? 'text-blue-900' : ''}`}>
                                    {notification.title}
                                  </h4>
                                  <p className={`text-sm ${!notification.isRead ? 'text-blue-700' : 'text-muted-foreground'}`}>
                                    {notification.message}
                                  </p>
                                  {notification.actionText && (
                                    <span className="text-sm text-blue-600 flex items-center mt-1">
                                      {notification.actionText}
                                      <ExternalLink className="ml-1 h-4 w-4" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="read">
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Bell className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No read notifications</h3>
                      <p className="text-muted-foreground">
                        {searchQuery || typeFilter !== 'all' 
                          ? 'Try adjusting your filters or search terms'
                          : 'You\'ve read all your notifications!'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <span className="text-sm text-muted-foreground">
                          {selectedNotifications.length} of {filteredNotifications.length} selected
                        </span>
                      </div>
                      {selectedNotifications.length > 0 && (
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Notification</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotifications.map((notification) => (
                          <TableRow 
                            key={notification._id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedNotifications.includes(notification._id)}
                                onCheckedChange={() => handleSelectNotification(notification._id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start space-x-3">
                                <div className={`mt-1 ${getNotificationColor(notification.type, notification.priority)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium">
                                    {notification.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {notification.message}
                                  </p>
                                  {notification.actionText && (
                                    <span className="text-sm text-blue-600 flex items-center mt-1">
                                      {notification.actionText}
                                      <ExternalLink className="ml-1 h-4 w-4" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getTypeLabel(notification.type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                                {notification.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                              </span>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteNotification(notification._id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 