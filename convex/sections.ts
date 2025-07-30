import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Default BlockNote content for new sections
const getDefaultSectionContent = (sectionType: string) => {
  const defaultContent = {
    overview: [{
      id: 'overview-intro',
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Project overview and goals will be documented here.' }],
      children: []
    }],
    deliverables: [{
      id: 'deliverables-intro',
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Project deliverables and tasks will be managed in this section.' }],
      children: []
    }],
    timeline: [{
      id: 'timeline-intro',
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Project timeline and milestones will be tracked here.' }],
      children: []
    }],
    feedback: [{
      id: 'feedback-intro',
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Client feedback and communication will be documented here.' }],
      children: []
    }],
    team: [{
      id: 'team-intro',
      type: 'paragraph',
      props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
      content: [{ type: 'text', text: 'Team coordination and stakeholder information.' }],
      children: []
    }]
  };

  return defaultContent[sectionType as keyof typeof defaultContent] || [{
    id: 'default-content',
    type: 'paragraph',
    props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
    content: [{ type: 'text', text: 'Section content goes here.' }],
    children: []
  }];
};

// Default permissions by section type
const getDefaultSectionPermissions = (sectionType: string) => {
  const permissionTemplates = {
    overview: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    },
    deliverables: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm', 'task_owner'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
      fieldPermissions: {
        taskStatus: { canEdit: ['admin', 'pm', 'assignee'], canView: ['all'] },
        taskDetails: { canEdit: ['admin', 'pm'], canView: ['all'] }
      }
    },
    timeline: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    },
    feedback: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm', 'client'],
      canInteract: ['admin', 'pm', 'client'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    },
    team: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    },
    weekly_status: {
      canView: ['admin', 'pm', 'task_owner'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: false,
    },
    getting_started: {
      canView: ['admin', 'pm', 'task_owner'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: false,
    },
    final_delivery: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    },
    original_request: {
      canView: ['admin', 'pm', 'task_owner', 'client'],
      canEdit: ['admin', 'pm'],
      canInteract: ['admin', 'pm'],
      canReorder: ['admin', 'pm'],
      canDelete: ['admin'],
      clientVisible: true,
    }
  };

  return permissionTemplates[sectionType as keyof typeof permissionTemplates] || permissionTemplates.overview;
};

// Get all sections for a document, ordered by order field
export const getDocumentSections = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get document to check permissions
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check document permissions
    if (!document.permissions.canView.includes(user.role) && !document.permissions.canView.includes('all')) {
      throw new Error('Insufficient permissions to view document');
    }

    // Get sections and filter by user permissions
    const sections = await ctx.db
      .query('sections')
      .withIndex('by_document_order', (q) => q.eq('documentId', args.documentId))
      .collect();

    // Filter sections based on user permissions
    return sections.filter(section => 
      section.permissions.canView.includes(user.role) || 
      section.permissions.canView.includes('all') ||
      (user.role === 'client' && section.permissions.clientVisible)
    );
  },
});

// Get a specific section
export const getSection = query({
  args: { sectionId: v.id('sections') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check section permissions
    if (!section.permissions.canView.includes(user.role) && 
        !section.permissions.canView.includes('all') &&
        !(user.role === 'client' && section.permissions.clientVisible)) {
      throw new Error('Insufficient permissions to view section');
    }

    return section;
  },
});

// Create a new section
export const createSection = mutation({
  args: {
    documentId: v.id('documents'),
    type: v.union(
      v.literal('overview'),
      v.literal('deliverables'),
      v.literal('timeline'),
      v.literal('feedback'),
      v.literal('getting_started'),
      v.literal('final_delivery'),
      v.literal('weekly_status'),
      v.literal('original_request'),
      v.literal('team'),
      v.literal('custom')
    ),
    title: v.string(),
    icon: v.string(),
    order: v.optional(v.number()),
    required: v.optional(v.boolean()),
    content: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check permissions - admin and PM can create sections
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create sections');
    }

    // Get document to verify access
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check document edit permissions
    if (!document.permissions.canEdit.includes(user.role)) {
      throw new Error('Insufficient permissions to edit document');
    }

    // Determine order if not provided
    let order = args.order;
    if (order === undefined) {
      const existingSections = await ctx.db
        .query('sections')
        .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
        .collect();
      order = existingSections.length;
    }

    const now = Date.now();
    const content = args.content || getDefaultSectionContent(args.type);
    const permissions = getDefaultSectionPermissions(args.type);

    const sectionId = await ctx.db.insert('sections', {
      documentId: args.documentId,
      type: args.type,
      title: args.title,
      icon: args.icon,
      order,
      required: args.required || false,
      content,
      permissions,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    return sectionId;
  },
});

// Update section content
export const updateSectionContent = mutation({
  args: {
    sectionId: v.id('sections'),
    content: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check section edit permissions
    if (!section.permissions.canEdit.includes(user.role) && !section.permissions.canEdit.includes('all')) {
      throw new Error('Insufficient permissions to edit section');
    }

    await ctx.db.patch(args.sectionId, {
      content: args.content,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });

    return args.sectionId;
  },
});

// Update section metadata (title, icon, order)
export const updateSectionMetadata = mutation({
  args: {
    sectionId: v.id('sections'),
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check section reorder permissions
    if (!section.permissions.canReorder.includes(user.role)) {
      throw new Error('Insufficient permissions to modify section');
    }

    const updates: any = {
      updatedBy: user._id,
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.sectionId, updates);
    return args.sectionId;
  },
});

// Delete a section (with minimum section validation)
export const deleteSection = mutation({
  args: { sectionId: v.id('sections') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error('Section not found');
    }

    // Check section delete permissions
    if (!section.permissions.canDelete.includes(user.role)) {
      throw new Error('Insufficient permissions to delete section');
    }

    // Check if this is the last section for the document
    const documentSections = await ctx.db
      .query('sections')
      .withIndex('by_document', (q) => q.eq('documentId', section.documentId))
      .collect();

    if (documentSections.length <= 1) {
      throw new Error('Cannot delete the last section. Every document must have at least one section.');
    }

    // Check if section is required
    if (section.required) {
      throw new Error('Cannot delete a required section.');
    }

    await ctx.db.delete(args.sectionId);
    return args.sectionId;
  },
});

// Reorder sections within a document
export const reorderSections = mutation({
  args: {
    documentId: v.id('documents'),
    sectionOrders: v.array(v.object({
      sectionId: v.id('sections'),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Get document to check permissions
    const document = await ctx.db.get(args.documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check document edit permissions
    if (!document.permissions.canEdit.includes(user.role)) {
      throw new Error('Insufficient permissions to reorder sections');
    }

    // Update section orders
    for (const sectionOrder of args.sectionOrders) {
      const section = await ctx.db.get(sectionOrder.sectionId);
      if (section && section.documentId === args.documentId) {
        // Check section reorder permissions
        if (section.permissions.canReorder.includes(user.role)) {
          await ctx.db.patch(sectionOrder.sectionId, {
            order: sectionOrder.order,
            updatedBy: user._id,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return true;
  },
});

// Get section count for a document
export const getDocumentSectionCount = query({
  args: { documentId: v.id('documents') },
  handler: async (ctx, args) => {
    const sections = await ctx.db
      .query('sections')
      .withIndex('by_document', (q) => q.eq('documentId', args.documentId))
      .collect();
    
    return sections.length;
  },
});