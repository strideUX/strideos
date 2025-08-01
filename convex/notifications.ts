import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

/**
 * Get user's notifications
 */
export const getUserNotifications = query({
  args: { 
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const limit = args.limit || 50;
    const unreadOnly = args.unreadOnly || false;

    let notificationsQuery;
    
    if (unreadOnly) {
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('by_user_unread', (q) => 
          q.eq('userId', user._id).eq('isRead', false)
        );
    } else {
      notificationsQuery = ctx.db
        .query('notifications')
        .withIndex('by_user', (q) => 
          q.eq('userId', user._id)
        );
    }

    const notifications = await notificationsQuery
      .order('desc')
      .take(limit);

    return notifications;
  },
});

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = query({
  args: {},
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_user_unread', (q) => 
        q.eq('userId', user._id).eq('isRead', false)
      )
      .collect();

    return unreadNotifications.length;
  },
});

/**
 * Mark notification as read
 */
export const markNotificationAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error('Notification not found');

    // Ensure user can only mark their own notifications as read
    if (notification.userId !== user._id) {
      throw new Error('Insufficient permissions');
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });

    return args.notificationId;
  },
});

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = mutation({
  args: {},
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const unreadNotifications = await ctx.db
      .query('notifications')
      .withIndex('by_user_unread', (q) => 
        q.eq('userId', user._id).eq('isRead', false)
      )
      .collect();

    // Mark all unread notifications as read
    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: Date.now(),
      });
    }

    return unreadNotifications.length;
  },
});

/**
 * Delete a notification
 */
export const deleteNotification = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error('Notification not found');

    // Ensure user can only delete their own notifications
    if (notification.userId !== user._id) {
      throw new Error('Insufficient permissions');
    }

    await ctx.db.delete(args.notificationId);
    return args.notificationId;
  },
});

/**
 * Create a notification (internal use)
 */
export const createNotification = mutation({
  args: {
    type: v.union(
      v.literal('comment_created'),
      v.literal('task_assigned'),
      v.literal('task_status_changed'),
      v.literal('document_updated'),
      v.literal('sprint_started'),
      v.literal('sprint_completed'),
      v.literal('mention'),
      v.literal('general')
    ),
    title: v.string(),
    message: v.string(),
    userId: v.id('users'),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    )),
    relatedDocumentId: v.optional(v.id('documents')),
    relatedTaskId: v.optional(v.id('tasks')),
    relatedCommentId: v.optional(v.id('comments')),
    relatedSprintId: v.optional(v.id('sprints')),
    actionUrl: v.optional(v.string()),
    actionText: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Only allow admin/PM users to create notifications for others
    if (args.userId !== user._id && user.role !== 'admin' && user.role !== 'pm') {
      throw new Error('Insufficient permissions to create notifications for other users');
    }

    const notificationId = await ctx.db.insert('notifications', {
      type: args.type,
      title: args.title,
      message: args.message,
      userId: args.userId,
      isRead: false,
      priority: args.priority || 'medium',
      relatedDocumentId: args.relatedDocumentId,
      relatedTaskId: args.relatedTaskId,
      relatedCommentId: args.relatedCommentId,
      relatedSprintId: args.relatedSprintId,
      actionUrl: args.actionUrl,
      actionText: args.actionText,
      createdAt: Date.now(),
    });

    return notificationId;
  },
});

/**
 * Create task assignment notification
 */
export const createTaskAssignmentNotification = mutation({
  args: {
    taskId: v.id('tasks'),
    assigneeId: v.id('users'),
    assignedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');

    const assignedByUser = await ctx.db.get(args.assignedBy);
    if (!assignedByUser) throw new Error('User not found');

    // Create notification for the assignee
    await ctx.db.insert('notifications', {
      type: 'task_assigned',
      title: 'Task Assigned',
      message: `${assignedByUser.name || 'Someone'} assigned you a task: ${task.title}`,
      userId: args.assigneeId,
      isRead: false,
      priority: 'medium',
      relatedTaskId: args.taskId,
      actionUrl: `/tasks/${args.taskId}`,
      actionText: 'View Task',
      createdAt: Date.now(),
    });

    return 'Notification created';
  },
});

/**
 * Create task status change notification
 */
export const createTaskStatusChangeNotification = mutation({
  args: {
    taskId: v.id('tasks'),
    newStatus: v.string(),
    changedBy: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');

    const changedByUser = await ctx.db.get(args.changedBy);
    if (!changedByUser) throw new Error('User not found');

    // Create notification for the task assignee (if different from who changed it)
    if (task.assigneeId && task.assigneeId !== args.changedBy) {
      await ctx.db.insert('notifications', {
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `${changedByUser.name || 'Someone'} updated the status of "${task.title}" to ${args.newStatus}`,
        userId: task.assigneeId,
        isRead: false,
        priority: 'medium',
        relatedTaskId: args.taskId,
        actionUrl: `/tasks/${args.taskId}`,
        actionText: 'View Task',
        createdAt: Date.now(),
      });
    }

    return 'Notification created';
  },
});

/**
 * Create document update notification
 */
export const createDocumentUpdateNotification = mutation({
  args: {
    documentId: v.id('documents'),
    updatedBy: v.id('users'),
    updateType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    const updatedByUser = await ctx.db.get(args.updatedBy);
    if (!updatedByUser) throw new Error('User not found');

    // Get all users who should be notified about document updates
    // This could be project team members, document viewers, etc.
    const projectUsers = await ctx.db
      .query('users')
      .withIndex('by_client', (q) => q.eq('clientId', document.clientId))
      .collect();

    // Create notifications for relevant users
    for (const projectUser of projectUsers) {
      // Skip the user who made the update
      if (projectUser._id === args.updatedBy) continue;

      await ctx.db.insert('notifications', {
        type: 'document_updated',
        title: 'Document Updated',
        message: `${updatedByUser.name || 'Someone'} ${args.updateType} the document "${document.title}"`,
        userId: projectUser._id,
        isRead: false,
        priority: 'low',
        relatedDocumentId: args.documentId,
        actionUrl: `/documents/${args.documentId}`,
        actionText: 'View Document',
        createdAt: Date.now(),
      });
    }

    return 'Notifications created';
  },
});

/**
 * Create mention notification
 */
export const createMentionNotification = mutation({
  args: {
    mentionedUserId: v.id('users'),
    mentionedBy: v.id('users'),
    context: v.string(), // e.g., "commented on Task X"
    relatedDocumentId: v.optional(v.id('documents')),
    relatedTaskId: v.optional(v.id('tasks')),
    relatedCommentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const mentionedByUser = await ctx.db.get(args.mentionedBy);
    if (!mentionedByUser) throw new Error('User not found');

    await ctx.db.insert('notifications', {
      type: 'mention',
      title: 'You were mentioned',
      message: `${mentionedByUser.name || 'Someone'} mentioned you ${args.context}`,
      userId: args.mentionedUserId,
      isRead: false,
      priority: 'high',
      relatedDocumentId: args.relatedDocumentId,
      relatedTaskId: args.relatedTaskId,
      relatedCommentId: args.relatedCommentId,
      actionUrl: args.relatedDocumentId ? `/documents/${args.relatedDocumentId}` : 
                 args.relatedTaskId ? `/tasks/${args.relatedTaskId}` : undefined,
      actionText: 'View',
      createdAt: Date.now(),
    });

    return 'Mention notification created';
  },
}); 