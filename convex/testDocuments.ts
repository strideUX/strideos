import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Get all test documents
export const getAllTestDocuments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    return await ctx.db.query('testDocuments').collect();
  },
});

// Get a specific test document
export const getTestDocument = query({
  args: { documentId: v.id('testDocuments') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    return await ctx.db.get(args.documentId);
  },
});

// Create a new test document
export const createTestDocument = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Unauthorized');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const now = Date.now();
    const defaultContent = [
      {
        id: 'default-block',
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left',
        },
        content: [],
        children: [],
      },
    ];

    return await ctx.db.insert('testDocuments', {
      title: args.title,
      content: args.content || defaultContent,
      version: 0, // Start with version 0
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update test document content
export const updateTestDocumentContent = mutation({
  args: {
    documentId: v.id('testDocuments'),
    content: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Unauthorized');

    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found');

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    return await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });
  },
});

// Update test document title
export const updateTestDocumentTitle = mutation({
  args: {
    documentId: v.id('testDocuments'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', identity.email))
      .first();

    if (!user) throw new Error('User not found');

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    return await ctx.db.patch(args.documentId, {
      title: args.title,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });
  },
});

// Delete test document
export const deleteTestDocument = mutation({
  args: { documentId: v.id('testDocuments') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthorized');

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error('Document not found');

    return await ctx.db.delete(args.documentId);
  },
});