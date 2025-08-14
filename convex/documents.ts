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

// Create a new document with sections based on template
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
    templateId: v.optional(v.id('documentTemplates')),
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

    // Create the document first
    const documentId = await ctx.db.insert('documents', {
      title: args.title,
      projectId: args.projectId,
      clientId: args.clientId,
      departmentId: args.departmentId,
      status: 'draft',
      documentType: args.documentType,
      templateId: args.templateId,
      createdBy: user._id,
      updatedBy: user._id,
      lastModified: now,
      version: 1,
      permissions: defaultPermissions,
      createdAt: now,
      updatedAt: now,
    });

    // Get template if provided, or find default template
    let template = null;
    if (args.templateId) {
      template = await ctx.db.get(args.templateId);
    } else {
      // Find default template for document type
      template = await ctx.db
        .query('documentTemplates')
        .withIndex('by_document_type', (q) => q.eq('documentType', args.documentType))
        .filter((q) => q.eq(q.field('isActive'), true))
        .first();
    }

    // Create sections based on template
    if (template && template.defaultSections.length > 0) {
      for (const sectionTemplate of template.defaultSections) {
        await ctx.db.insert('documentSections', {
          documentId,
          type: sectionTemplate.type,
          title: sectionTemplate.title,
          icon: sectionTemplate.icon,
          order: sectionTemplate.order,
          required: sectionTemplate.required,
          content: sectionTemplate.defaultContent || [{
            id: `${sectionTemplate.type}-default`,
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ type: 'text', text: `${sectionTemplate.title} content goes here.` }],
            children: []
          }],
          permissions: sectionTemplate.permissions,
          createdBy: user._id,
          updatedBy: user._id,
          createdAt: now,
          updatedAt: now,
        });
      }
    } else {
      // Create default overview section if no template
      await ctx.db.insert('documentSections', {
        documentId,
        type: 'overview',
        title: 'Overview',
        icon: 'FileText',
        order: 0,
        required: true,
        content: [{
          id: 'overview-default',
          type: 'paragraph',
          props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
          content: [{ type: 'text', text: 'Document overview and content goes here.' }],
          children: []
        }],
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        },
        createdBy: user._id,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
    }

    return documentId;
  },
});

// Update document content and metadata
export const updateDocument = mutation({
  args: {
    documentId: v.id('documents'),
    title: v.optional(v.string()),
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

    // This migration is no longer needed since documents don't have content
    // Content is now stored in individual sections
    return { migratedCount: 0, totalDocuments: 0 };
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

// Query: Get project from document
export const getProjectFromDocument = query({
  args: {
    documentId: v.id('documents'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const document = await ctx.db.get(args.documentId);
    if (!document) throw new Error("Document not found");

    // Check if document has a project
    if (!document.projectId) return null;

    const project = await ctx.db.get(document.projectId);
    if (!project) return null;

    // Check permissions - user must have access to the document's client/department
    if (user.role === 'client') {
      if (user.clientId !== document.clientId) {
        throw new Error("Access denied");
      }
    } else if (user.role === 'task_owner') {
      // Task owners can access if they're in the document's department
      if (!user.departmentIds?.includes(document.departmentId)) {
        throw new Error("Access denied");
      }
    } else if (user.role === 'pm') {
      // PMs can access if they're in the document's department
      if (!user.departmentIds?.includes(document.departmentId)) {
        throw new Error("Access denied");
      }
    }
    // Admins have access to everything

    return project;
  },
});

// Get document with its sections (for section-based architecture)
export const getDocumentWithSections = query({
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

    // Check document permissions
    const canView = document.permissions.canView.includes(user.role) || 
                   document.createdBy === user._id ||
                   (user.role === 'client' && document.permissions.clientVisible);

    if (!canView) {
      throw new Error('Insufficient permissions to view this document');
    }

    // Get sections and filter by user permissions
    const allSections = await ctx.db
      .query('documentSections')
      .withIndex('by_document_order', (q) => q.eq('documentId', args.documentId))
      .collect();

    // Filter sections based on user permissions
    const sections = allSections.filter(section => 
      section.permissions.canView.includes(user.role) || 
      section.permissions.canView.includes('all') ||
      (user.role === 'client' && section.permissions.clientVisible)
    );

    return {
      document,
      sections
    };
  },
});

// --- Test Document APIs (safe testing only) ---
export const createTestDocument = mutation({
  args: {
    title: v.string(),
    documentType: v.literal('project_brief'),
    isTestDocument: v.boolean(),
    sections: v.array(v.object({
      id: v.string(),
      type: v.string(),
      title: v.string(),
      content: v.any(),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // For testing: pick any available client/department the user has access to or create placeholders
    // Prefer existing records; fall back to first ones
    const anyClient = await ctx.db.query('clients').first();
    const anyDepartment = await ctx.db.query('departments').first();
    if (!anyClient || !anyDepartment) {
      throw new Error('Client/Department required. Seed data first.');
    }

    const now = Date.now();
    const documentId = await ctx.db.insert('documents', {
      title: args.title,
      projectId: undefined,
      clientId: anyClient._id,
      departmentId: anyDepartment._id,
      status: 'draft',
      documentType: args.documentType,
      templateId: undefined,
      createdBy: userId,
      updatedBy: userId,
      lastModified: now,
      version: 1,
      // Safe default permissions
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm'],
        clientVisible: true,
      },
      createdAt: now,
      updatedAt: now,
      // Not in schema but harmless if ignored by client types; stored as extra field
      // Use this flag to filter in queries and UI for safety
      // @ts-ignore
      isTestDocument: args.isTestDocument,
    } as any);

    // Create provided sections mapped to our schema
    for (const s of args.sections) {
      await ctx.db.insert('documentSections', {
        documentId: documentId as any,
        type: (s.type as any) || 'custom',
        title: s.title,
        icon: 'FileText',
        order: s.order,
        required: false,
        content: s.content,
        permissions: {
          canView: ['admin', 'pm', 'task_owner', 'client'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin'],
          clientVisible: true,
        },
        createdBy: userId as any,
        updatedBy: userId as any,
        createdAt: now,
        updatedAt: now,
      });
    }

    return documentId;
  },
});

export const getTestDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Filter by ad-hoc flag. If the field does not exist, treat as non-test
    const docs = await ctx.db.query('documents').collect();
    // @ts-ignore
    const testDocs = docs.filter((d: any) => d.isTestDocument === true);

    // Return newest first
    testDocs.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return testDocs;
  },
}); 