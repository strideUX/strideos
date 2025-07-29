import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Create a new document
export const createDocument = mutation({
  args: {
    title: v.string(),
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    documentType: v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective')
    ),
    projectId: v.optional(v.id('projects')),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check permissions - admin and PM can create documents
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create documents');
    }

    const now = Date.now();
    const defaultPermissions = {
      canView: ['admin', 'pm', 'task_owner'],
      canEdit: ['admin', 'pm'],
      clientVisible: args.documentType === 'project_brief'
    };

    const documentId = await ctx.db.insert('documents', {
      title: args.title,
      content: args.content || { type: 'doc', content: [] },
      projectId: args.projectId,
      clientId: args.clientId,
      departmentId: args.departmentId,
      status: 'draft',
      documentType: args.documentType,
      createdBy: user._id,
      updatedBy: user._id,
      lastModified: now,
      version: 1,
      sections: [],
      permissions: defaultPermissions,
      createdAt: now,
      updatedAt: now,
    });

    return documentId;
  },
});

// Update document content and metadata
export const updateDocument = mutation({
  args: {
    documentId: v.id('documents'),
    title: v.optional(v.string()),
    content: v.optional(v.any()),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('review'),
      v.literal('complete')
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check edit permissions
    if (!document.permissions.canEdit.includes(user.role) && document.createdBy !== user._id) {
      throw new Error('Insufficient permissions to edit this document');
    }

    const now = Date.now();
    const updates: any = {
      updatedBy: user._id,
      lastModified: now,
      updatedAt: now,
      version: document.version + 1,
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.documentId, updates);
    return args.documentId;
  },
});

// Get a single document by ID
export const getDocument = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      return null;
    }

    // Check view permissions
    const canView = document.permissions.canView.includes(user.role) || 
                   document.createdBy === user._id ||
                   (user.role === 'client' && document.permissions.clientVisible);

    if (!canView) {
      throw new Error('Insufficient permissions to view this document');
    }

    // Include creator information
    const creator = await ctx.db.get(document.createdBy);
    const updater = await ctx.db.get(document.updatedBy);

    return {
      ...document,
      creator: creator ? { name: creator.name, email: creator.email } : null,
      updater: updater ? { name: updater.name, email: updater.email } : null,
    };
  },
});

// List documents with basic filtering
export const listDocuments = query({
  args: {
    clientId: v.optional(v.id('clients')),
    departmentId: v.optional(v.id('departments')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    let documents;

    // Apply filters based on arguments
    if (args.clientId) {
      documents = await ctx.db
        .query('documents')
        .withIndex('by_client', (q) => q.eq('clientId', args.clientId!))
        .collect();
    } else if (args.departmentId) {
      documents = await ctx.db
        .query('documents')
        .withIndex('by_department', (q) => q.eq('departmentId', args.departmentId!))
        .collect();
    } else {
      // For clients, only show their client's documents
      if (user.role === 'client' && user.clientId) {
        documents = await ctx.db
          .query('documents')
          .withIndex('by_client', (q) => q.eq('clientId', user.clientId!))
          .collect();
      } else {
        // For other roles, show all documents they have access to
        documents = await ctx.db.query('documents').collect();
      }
    }

    // Filter by permissions
    const visibleDocuments = documents.filter(doc => {
      const canView = doc.permissions.canView.includes(user.role) || 
                     doc.createdBy === user._id ||
                     (user.role === 'client' && doc.permissions.clientVisible);
      return canView;
    });

    // Apply limit
    const limitedDocuments = args.limit ? visibleDocuments.slice(0, args.limit) : visibleDocuments;

    // Add creator information
    const documentsWithCreators = await Promise.all(
      limitedDocuments.map(async (doc) => {
        const creator = await ctx.db.get(doc.createdBy);
        return {
          ...doc,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    return documentsWithCreators;
  },
});

// Delete a document
export const deleteDocument = mutation({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Only admin, PM, or document creator can delete
    if (!['admin', 'pm'].includes(user.role) && document.createdBy !== user._id) {
      throw new Error('Insufficient permissions to delete this document');
    }

    await ctx.db.delete(args.documentId);
    return true;
  },
}); 