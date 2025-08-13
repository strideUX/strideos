import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

// Helpers
async function requireUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error('Authentication required');
  const user = await ctx.db.get(userId);
  if (!user) throw new Error('User not found');
  return user;
}

async function assertCanAccessDocument(ctx: any, documentId: Id<'documents'>, user: any) {
  const document = await ctx.db.get(documentId);
  if (!document) throw new Error('Document not found');
  const canView = document.permissions?.canView?.includes(user.role) ||
                  document.createdBy === user._id ||
                  (user.role === 'client' && document.permissions?.clientVisible);
  if (!canView) throw new Error('Insufficient permissions to access document');
  return document;
}

// Join document session
export const joinDocumentSession = mutation({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const document = await assertCanAccessDocument(ctx, args.documentId, user);

    const now = Date.now();

    // Upsert existing session
    const existing = await ctx.db
      .query('documentSessions')
      .withIndex('by_user_document', q => q.eq('userId', user._id).eq('documentId', args.documentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'active',
        lastSeen: now,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('documentSessions', {
        documentId: args.documentId,
        userId: user._id,
        userAgent: (ctx as any).request?.headers?.get?.('user-agent') || undefined,
        lastSeen: now,
        status: 'active',
        cursorPosition: undefined,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Cleanup: remove sessions inactive for > 5 minutes on this document
    const cutoff = now - 5 * 60 * 1000;
    const stale = await ctx.db
      .query('documentSessions')
      .withIndex('by_document', q => q.eq('documentId', args.documentId))
      .filter(q => q.lt(q.field('lastSeen'), cutoff))
      .collect();

    for (const s of stale) {
      await ctx.db.delete(s._id);
    }

    return { ok: true } as const;
  }
});

// Update presence (heartbeat + cursor)
export const updatePresence = mutation({
  args: {
    documentId: v.id('documents'),
    status: v.union(v.literal('active'), v.literal('typing'), v.literal('idle')),
    cursorPosition: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertCanAccessDocument(ctx, args.documentId, user);

    const now = Date.now();

    // Throttle: max 1/s per user+doc
    const existing = await ctx.db
      .query('documentSessions')
      .withIndex('by_user_document', q => q.eq('userId', user._id).eq('documentId', args.documentId))
      .first();

    if (!existing) {
      // If no session, auto-join
      await ctx.db.insert('documentSessions', {
        documentId: args.documentId,
        userId: user._id,
        userAgent: (ctx as any).request?.headers?.get?.('user-agent') || undefined,
        lastSeen: now,
        status: 'active',
        cursorPosition: undefined,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true } as const;
    }

    if (existing.updatedAt && now - existing.updatedAt < 1000) {
      // Too soon, skip heavy updates; still bump lastSeen lightly
      await ctx.db.patch(existing._id, { lastSeen: now });
      return { ok: true, throttled: true } as const;
    }

    await ctx.db.patch(existing._id, {
      lastSeen: now,
      status: args.status,
      cursorPosition: args.cursorPosition as any,
      updatedAt: now,
    });

    return { ok: true } as const;
  }
});

// Leave document session
export const leaveDocumentSession = mutation({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertCanAccessDocument(ctx, args.documentId, user);

    const existing = await ctx.db
      .query('documentSessions')
      .withIndex('by_user_document', q => q.eq('userId', user._id).eq('documentId', args.documentId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return { ok: true } as const;
  }
});

// Get active collaborators
export const getActiveCollaborators = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    await assertCanAccessDocument(ctx, args.documentId, user);

    const now = Date.now();
    const activeCutoff = now - 2 * 60 * 1000; // last 2 minutes

    const sessions = await ctx.db
      .query('documentSessions')
      .withIndex('by_document_active', q => q.eq('documentId', args.documentId).eq('status', 'active'))
      .filter(q => q.gt(q.field('lastSeen'), activeCutoff))
      .collect();

    // Also include typing users (status === 'typing')
    const typingSessions = await ctx.db
      .query('documentSessions')
      .withIndex('by_document_active', q => q.eq('documentId', args.documentId).eq('status', 'typing'))
      .filter(q => q.gt(q.field('lastSeen'), activeCutoff))
      .collect();

    const allSessions = [...sessions, ...typingSessions];

    // Enrich with user info
    const result = await Promise.all(allSessions.map(async (s) => {
      const u = await ctx.db.get(s.userId);
      return {
        _id: s._id,
        userId: s.userId,
        documentId: s.documentId,
        status: s.status,
        lastSeen: s.lastSeen,
        cursorPosition: s.cursorPosition,
        user: u ? {
          _id: u._id,
          name: u.name,
          image: u.image,
          role: u.role,
          email: u.email,
        } : null,
      };
    }));

    return result;
  }
});