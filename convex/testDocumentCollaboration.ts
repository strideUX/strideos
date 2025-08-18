import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Real collaboration functions using database tables

export const getDocumentState = query({
  args: { documentId: v.id('testDocuments') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    // Get active sessions for this document (active = seen within last 30 seconds)
    const thirtySecondsAgo = Date.now() - 30000;
    const sessions = await ctx.db
      .query('collaborationSessions')
      .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
      .filter((q) => q.gte(q.field('lastSeen'), thirtySecondsAgo))
      .collect();

    return {
      document,
      sessions,
      content: document.content,
      version: document.version || 0,
    };
  },
});

export const joinSession = mutation({
  args: {
    documentId: v.id('testDocuments'),
    userInfo: v.object({
      name: v.string(),
      color: v.string(),
      avatar: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await auth.getUserId(ctx);
    if (!user) throw new Error('User not found');

    // Check if user already has an active session for this document
    const existingSession = await ctx.db
      .query('collaborationSessions')
      .withIndex('by_user_document', (q) => 
        q.eq('userId', user).eq('documentId', args.documentId)
      )
      .first();

    if (existingSession) {
      // Update existing session
      await ctx.db.patch(existingSession._id, {
        userInfo: args.userInfo,
        lastSeen: Date.now(),
      });
      console.log(`Updated existing collaboration session: ${existingSession._id}`);
      return existingSession._id;
    } else {
      // Create new session
      const sessionId = await ctx.db.insert('collaborationSessions', {
        documentId: args.documentId,
        userId: user,
        userInfo: args.userInfo,
        lastSeen: Date.now(),
        createdAt: Date.now(),
      });
      console.log(`Created new collaboration session: ${sessionId}`);
      return sessionId;
    }
  },
});

export const updateSession = mutation({
  args: {
    sessionId: v.id('collaborationSessions'),
    cursor: v.optional(v.object({
      from: v.number(),
      to: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await auth.getUserId(ctx);
    if (!user) throw new Error('User not found');

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error('Session not found');

    // Verify the user owns this session
    if (session.userId !== user) throw new Error('Unauthorized to update this session');

    // Update session with heartbeat and cursor position
    await ctx.db.patch(args.sessionId, {
      cursor: args.cursor,
      lastSeen: Date.now(),
    });
  },
});

export const leaveSession = mutation({
  args: { sessionId: v.id('collaborationSessions') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await auth.getUserId(ctx);
    if (!user) throw new Error('User not found');

    // Get the session
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      // Session doesn't exist, that's fine - already left
      return;
    }

    // Verify the user owns this session
    if (session.userId !== user) throw new Error('Unauthorized to leave this session');

    // Delete the session
    await ctx.db.delete(args.sessionId);
    console.log(`User left collaboration session: ${args.sessionId}`);
  },
});

export const submitOperations = mutation({
  args: {
    documentId: v.id('testDocuments'),
    operations: v.any(), // ProseMirror steps
    version: v.number(), // Expected document version
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await auth.getUserId(ctx);
    if (!user) throw new Error('User not found');

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    const currentVersion = document.version || 0;

    // Check if the version matches (for operational transform)
    if (args.version !== currentVersion) {
      throw new Error(`Version mismatch: expected ${currentVersion}, got ${args.version}`);
    }

    // Store the operations
    await ctx.db.insert('collaborationOperations', {
      documentId: args.documentId,
      userId: user,
      operations: args.operations,
      version: currentVersion,
      timestamp: Date.now(),
    });

    // Increment document version
    await ctx.db.patch(args.documentId, {
      version: currentVersion + 1,
      updatedBy: user,
      updatedAt: Date.now(),
    });

    console.log(`Operations submitted for document ${args.documentId}, new version: ${currentVersion + 1}`);
    
    return {
      success: true,
      newVersion: currentVersion + 1,
    };
  },
});

export const getOperationsSince = query({
  args: {
    documentId: v.id('testDocuments'),
    sinceVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    // Get all operations since the given version
    const operations = await ctx.db
      .query('collaborationOperations')
      .withIndex('by_document_version', (q) => 
        q.eq('documentId', args.documentId).gte('version', args.sinceVersion)
      )
      .order('asc')
      .collect();

    return operations;
  },
});

// Cleanup function to remove old sessions and operations
export const cleanupOldData = mutation({
  args: {},
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    // Remove sessions older than 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const oldSessions = await ctx.db
      .query('collaborationSessions')
      .withIndex('by_last_seen', (q) => q.lt('lastSeen', fiveMinutesAgo))
      .collect();

    for (const session of oldSessions) {
      await ctx.db.delete(session._id);
    }

    // Remove operations older than 1 hour (keep recent ones for conflict resolution)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const oldOperations = await ctx.db
      .query('collaborationOperations')
      .withIndex('by_timestamp', (q) => q.lt('timestamp', oneHourAgo))
      .collect();

    for (const operation of oldOperations) {
      await ctx.db.delete(operation._id);
    }

    console.log(`Cleaned up ${oldSessions.length} old sessions and ${oldOperations.length} old operations`);
    
    return {
      sessionsRemoved: oldSessions.length,
      operationsRemoved: oldOperations.length,
    };
  },
});