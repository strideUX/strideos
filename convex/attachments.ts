import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error('Unauthenticated');
  return await ctx.storage.generateUploadUrl();
});

// Store attachment record after upload
export const createAttachment = mutation({
  args: {
    storageId: v.id('_storage'),
    filename: v.string(),
    mimeType: v.string(),
    size: v.number(),
    entityType: v.union(
      v.literal('task'),
      v.literal('comment'),
      v.literal('project'),
      v.literal('document')
    ),
    entityId: v.string(),
    taskId: v.optional(v.id('tasks')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Unauthenticated');

    return await ctx.db.insert('attachments', {
      ...args,
      uploadedBy: userId,
      uploadedAt: Date.now(),
    });
  },
});

// List attachments for entity
export const listByEntity = query({
  args: {
    entityType: v.union(
      v.literal('task'),
      v.literal('comment'),
      v.literal('project'),
      v.literal('document')
    ),
    entityId: v.string(),
  },
  handler: async (ctx, { entityType, entityId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Unauthenticated');

    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_entity', (q) => q.eq('entityType', entityType).eq('entityId', entityId))
      .collect();

    // Get URLs for each attachment
    const withUrls = await Promise.all(
      attachments.map(async (att) => ({
        ...att,
        url: await ctx.storage.getUrl(att.storageId),
      }))
    );
    return withUrls;
  },
});

// Delete attachment
export const deleteAttachment = mutation({
  args: { attachmentId: v.id('attachments') },
  handler: async (ctx, { attachmentId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Unauthenticated');

    const attachment = await ctx.db.get(attachmentId);
    if (!attachment) return;

    // Delete file from storage
    await ctx.storage.delete(attachment.storageId);

    // Delete record
    await ctx.db.delete(attachmentId);
  },
});


