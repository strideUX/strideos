import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Migration utility: Convert Novel.js/TipTap content to BlockNote format
function migrateContentToBlockNote(oldContent: any): any[] {
  console.log('migrateContentToBlockNote input:', oldContent);
  
  // If already in BlockNote format (array), clean and return
  if (Array.isArray(oldContent)) {
    console.log('Content is already BlockNote format, cleaning empty blocks');
    // Remove empty paragraph blocks (blocks with no content or only empty text)
    const cleanedContent = oldContent.filter((block: any) => {
      if (block.type === 'paragraph') {
        // Keep paragraph if it has content with actual text
        return block.content && block.content.some((item: any) => 
          item.type === 'text' && item.text && item.text.trim().length > 0
        );
      }
      // Keep all non-paragraph blocks
      return true;
    });
    
    // Ensure we always have at least one paragraph block
    if (cleanedContent.length === 0) {
      cleanedContent.push({
        id: 'empty-block',
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [],
        children: []
      });
    }
    
    console.log('Cleaned content:', cleanedContent);
    return cleanedContent;
  }

  // If Novel.js/TipTap format with type: "doc"
  if (oldContent && oldContent.type === 'doc' && Array.isArray(oldContent.content)) {
    // Convert TipTap content to BlockNote blocks
    return oldContent.content.map((node: any, index: number) => {
      if (node.type === 'paragraph') {
        return {
          id: `block-${index}`,
          type: 'paragraph',
          props: {
            textColor: 'default',
            backgroundColor: 'default',
            textAlignment: 'left'
          },
          content: node.content ? node.content.map((textNode: any) => ({
            type: 'text',
            text: textNode.text || '',
            styles: {}
          })) : [],
          children: []
        };
      }
      // Add more node type conversions as needed
      return {
        id: `block-${index}`,
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left'
        },
        content: [],
        children: []
      };
    });
  }

  // If empty or null, return default empty paragraph
  if (!oldContent) {
    return [{
      id: 'initial-block',
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left'
      },
      content: [],
      children: []
    }];
  }

  // Unknown format, create empty paragraph
  return [{
    id: 'unknown-format-block',
    type: 'paragraph',
    props: {
      textColor: 'default',
      backgroundColor: 'default',
      textAlignment: 'left'
    },
    content: [],
    children: []
  }];
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

    // Ensure content is in BlockNote format
    const blockNoteContent = args.content ? migrateContentToBlockNote(args.content) : [{
      id: 'initial-block',
      type: 'paragraph',
      props: {
        textColor: 'default',
        backgroundColor: 'default',
        textAlignment: 'left'
      },
      content: [],
      children: []
    }];

    const documentId = await ctx.db.insert('documents', {
      title: args.title,
      content: blockNoteContent,
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
    
    // Ensure content is in BlockNote format when updating
    if (args.content !== undefined) {
      updates.content = migrateContentToBlockNote(args.content);
    }
    
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

    // Migrate content to BlockNote format if needed
    const migratedContent = migrateContentToBlockNote(document.content);

    return {
      ...document,
      content: migratedContent,
      creator: creator ? { name: creator.name, email: creator.email } : null,
      updater: updater ? { name: updater.name, email: updater.email } : null,
    };
  },
});

// Migrate existing documents to BlockNote format
export const migrateDocumentsToBlockNote = mutation({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admin can run migration
    if (user.role !== 'admin') {
      throw new Error('Only admin can run migrations');
    }

    const documents = await ctx.db.query('documents').collect();
    let migratedCount = 0;

    for (const doc of documents) {
      const migratedContent = migrateContentToBlockNote(doc.content);
      
      // Only update if content actually changed
      if (JSON.stringify(migratedContent) !== JSON.stringify(doc.content)) {
        await ctx.db.patch(doc._id, {
          content: migratedContent,
          updatedAt: Date.now(),
          version: doc.version + 1
        });
        migratedCount++;
      }
    }

    return { migratedCount, totalDocuments: documents.length };
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