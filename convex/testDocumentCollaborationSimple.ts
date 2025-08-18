import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Simple collaboration state without tables - just for testing the UI
export const getDocumentState = query({
  args: { documentId: v.id('testDocuments') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    // Get the document
    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    // Return empty sessions for now
    return {
      document,
      sessions: [],
      content: document.content,
    };
  },
});

// Mock join session - returns a fake session ID
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

    // Just return a mock session ID for now
    console.log(`Mock: User joined collaboration on document ${args.documentId}`);
    return 'mock-session-id' as any;
  },
});

// Mock session update
export const updateSession = mutation({
  args: {
    sessionId: v.string(), // Using string instead of ID for mock
    cursor: v.optional(v.object({
      from: v.number(),
      to: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Mock implementation - just log
    console.log(`Mock: Session ${args.sessionId} updated cursor:`, args.cursor);
  },
});

// Mock leave session
export const leaveSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    console.log(`Mock: Session ${args.sessionId} left`);
  },
});

// Mock apply changes
export const applyChanges = mutation({
  args: {
    documentId: v.id('testDocuments'),
    changes: v.any(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    console.log(`Mock: Applied changes to document ${args.documentId}, version ${args.version}`);
    // For now, just log the changes
    return { success: true };
  },
});

// Mock get changes
export const getChangesSince = query({
  args: {
    documentId: v.id('testDocuments'),
    sinceVersion: v.number(),
  },
  handler: async (ctx, args) => {
    // Return empty changes for now
    console.log(`Mock: Getting changes for document ${args.documentId} since version ${args.sinceVersion}`);
    return [];
  },
});