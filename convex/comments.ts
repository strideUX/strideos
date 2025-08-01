import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

/**
 * Get comments for a document
 */
export const getDocumentComments = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    console.log('Querying comments for document:', args.documentId);

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
      .order('asc')
      .collect();

    console.log('Found comments:', comments.length);

    // Get user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.createdBy);
        return {
          ...comment,
          user: {
            id: user?._id,
            name: user?.name || 'Unknown User',
            image: user?.image,
            role: user?.role,
          },
        };
      })
    );

    console.log('Comments with users:', commentsWithUsers);

    // Build nested comment structure
    const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
      const filteredComments = comments.filter((comment) => comment.parentCommentId === parentId);
      console.log('buildCommentTree (doc):', { parentId, filteredCommentsCount: filteredComments.length, allCommentsCount: comments.length });
      
      return filteredComments.map((comment) => ({
        ...comment,
        replies: buildCommentTree(comments, comment._id),
      }));
    };

    const result = buildCommentTree(commentsWithUsers);
    console.log('Final result (doc):', { resultLength: result.length, result });
    
    // Temporarily return raw comments to test
    console.log('Returning raw comments instead of tree structure');
    return commentsWithUsers;
  },
});

/**
 * Get comments for a task
 */
export const getTaskComments = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const comments = await ctx.db
      .query('comments')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .order('asc')
      .collect();

    // Get user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.createdBy);
        return {
          ...comment,
          user: {
            id: user?._id,
            name: user?.name || 'Unknown User',
            image: user?.image,
            role: user?.role,
          },
        };
      })
    );

    // Build nested comment structure
    const buildCommentTree = (comments: any[], parentId: string | null = null): any[] => {
      return comments
        .filter((comment) => comment.parentCommentId === parentId)
        .map((comment) => ({
          ...comment,
          replies: buildCommentTree(comments, comment._id),
        }));
    };

    return buildCommentTree(commentsWithUsers);
  },
});

/**
 * Create a new comment
 */
export const createComment = mutation({
  args: {
    content: v.string(),
    documentId: v.optional(v.id('documents')),
    taskId: v.optional(v.id('tasks')),
    parentCommentId: v.optional(v.id('comments')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    // Validate that either documentId or taskId is provided, but not both
    if (!args.documentId && !args.taskId) {
      throw new Error('Either documentId or taskId must be provided');
    }
    if (args.documentId && args.taskId) {
      throw new Error('Cannot provide both documentId and taskId');
    }

    // Check permissions based on what we're commenting on
    if (args.documentId) {
      const document = await ctx.db.get(args.documentId);
      if (!document) throw new Error('Document not found');
      
      // For now, allow all authenticated users to comment
      // TODO: Implement proper permission checking based on document permissions
      console.log('Creating comment for document:', document._id, 'by user:', user._id);
    }

    if (args.taskId) {
      const task = await ctx.db.get(args.taskId);
      if (!task) throw new Error('Task not found');
      
      // Check if user has permission to view the task
      // This is a simplified check - you might want to add more sophisticated permission logic
      if (task.assigneeId && task.assigneeId !== user._id && user.role !== 'admin' && user.role !== 'pm') {
        throw new Error('Insufficient permissions to comment on this task');
      }
    }

    const commentId = await ctx.db.insert('comments', {
      content: args.content,
      documentId: args.documentId,
      taskId: args.taskId,
      parentCommentId: args.parentCommentId,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create notification for the comment
    // Temporarily commented out to debug comment creation
    /*
    await ctx.db.insert('notifications', {
      type: 'comment_created',
      title: 'New Comment',
      message: `${user.name || 'Someone'} commented on ${args.documentId ? 'a document' : 'a task'}`,
      userId: user._id, // The commenter
      priority: 'medium',
      relatedDocumentId: args.documentId,
      relatedTaskId: args.taskId,
      relatedCommentId: commentId,
      isRead: false,
      createdAt: Date.now(),
    });
    */

    // Check for mentions and create mention notifications
    // Temporarily commented out to debug comment creation
    /*
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(args.content)) !== null) {
      mentions.push(match[1]);
    }

    // Create mention notifications for each mentioned user
    for (const mention of mentions) {
      const mentionedUser = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', mention))
        .first();

      if (mentionedUser && mentionedUser._id !== user._id) {
        await ctx.db.insert('notifications', {
          type: 'mention',
          title: 'You were mentioned',
          message: `${user.name || 'Someone'} mentioned you in a comment: "${args.content.substring(0, 100)}${args.content.length > 100 ? '...' : ''}"`,
          userId: mentionedUser._id,
          relatedDocumentId: args.documentId,
          relatedTaskId: args.taskId,
          relatedCommentId: commentId,
          isRead: false,
          priority: 'high',
          actionUrl: args.documentId ? `/documents/${args.documentId}` : `/tasks/${args.taskId}`,
          actionText: 'View Comment',
          createdAt: Date.now(),
        });
      }
    }
    */

    return commentId;
  },
});

/**
 * Update a comment
 */
export const updateComment = mutation({
  args: {
    commentId: v.id('comments'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error('Comment not found');

    // Check if user is the comment author or has admin/PM role
    if (comment.createdBy !== user._id && user.role !== 'admin' && user.role !== 'pm') {
      throw new Error('Insufficient permissions to edit this comment');
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return args.commentId;
  },
});

/**
 * Delete a comment
 */
export const deleteComment = mutation({
  args: { commentId: v.id('comments') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error('Comment not found');

    // Check if user is the comment author or has admin/PM role
    if (comment.createdBy !== user._id && user.role !== 'admin' && user.role !== 'pm') {
      throw new Error('Insufficient permissions to delete this comment');
    }

    // Delete all child comments first
    const childComments = await ctx.db
      .query('comments')
      .withIndex('by_parent', (q) => q.eq('parentCommentId', args.commentId))
      .collect();

    for (const childComment of childComments) {
      await ctx.db.delete(childComment._id);
    }

    // Delete the comment itself
    await ctx.db.delete(args.commentId);

    return args.commentId;
  },
});

/**
 * Get comment count for a document
 */
export const getDocumentCommentCount = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
      .collect();

    return comments.length;
  },
});

/**
 * Get comment count for a task
 */
export const getTaskCommentCount = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query('comments')
      .withIndex('by_task', (q) => q.eq('taskId', args.taskId))
      .collect();

    return comments.length;
  },
}); 