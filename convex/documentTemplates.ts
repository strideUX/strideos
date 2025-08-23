import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Default blank template (page-based snapshot)
const emptyDocContent = JSON.stringify({ type: 'doc', content: [] });
const blankTemplate = {
  name: 'Blank Document',
  description: 'Empty document with one untitled page',
  category: 'general' as const,
  snapshot: {
    documentTitle: 'Untitled',
    documentMetadata: undefined as any,
    pages: [
      { title: 'Untitled', icon: 'FileText', order: 0, content: emptyDocContent }
    ],
  },
};

// Default project brief template (page-based snapshot) 
const projectBriefTemplate = {
  name: 'Project Brief',
  description: 'Standard project brief template for new page-based editor',
  category: 'project_brief' as const,
  snapshot: {
    documentTitle: 'Project Brief',
    documentMetadata: undefined as any,
    pages: [
      { title: 'Overview', icon: 'FileText', order: 0, content: emptyDocContent },
      { title: 'Tasks', icon: 'CheckSquare', order: 1, content: emptyDocContent },
      { title: 'Assets', icon: 'FolderOpen', order: 2, content: emptyDocContent },
    ],
  },
};

// Get all active document templates
export const getActiveTemplates = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    return await ctx.db
      .query('documentTemplates')
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

// Get templates by document type
export const getTemplatesByType = query({
  args: { 
    category: v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective'),
      v.literal('general'),
      v.literal('user_created'),
    )
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    return await ctx.db
      .query('documentTemplates')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();
  },
});

// Get a specific template
export const getTemplate = query({
  args: { templateId: v.id('documentTemplates') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  },
});

// Create a new document template (admin only)
export const createTemplate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective'),
      v.literal('general'),
      v.literal('user_created'),
    ),
    snapshot: v.object({
      documentTitle: v.string(),
      documentMetadata: v.optional(v.any()),
      pages: v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string(),
        subpages: v.optional(v.array(v.object({
          title: v.string(),
          icon: v.optional(v.string()),
          order: v.number(),
          content: v.string(),
        }))),
      })),
    }),
    thumbnailUrl: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admins can create templates
    if (user.role !== 'admin') {
      throw new Error('Only administrators can create document templates');
    }

    const now = Date.now();

    const templateId = await ctx.db.insert('documentTemplates', {
      name: args.name,
      description: args.description,
      category: args.category,
      snapshot: args.snapshot,
      thumbnailUrl: args.thumbnailUrl,
      usageCount: 0,
      isPublic: args.isPublic ?? false,
      isActive: args.isActive ?? true,
      createdBy: user._id,
      createdAt: now,
    });

    return templateId;
  },
});

// Initialize default templates (run once during setup)
export const initializeDefaultTemplates = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admins can initialize templates
    if (user.role !== 'admin') {
      throw new Error('Only administrators can initialize default templates');
    }

    const now = Date.now();
    const results = [];

    // Check if blank template already exists
    const existingBlankTemplate = await ctx.db
      .query('documentTemplates')
      .withIndex('by_category', (q) => q.eq('category', 'general'))
      .first();

    if (!existingBlankTemplate) {
      // Create the default blank template
      const blankTemplateId = await ctx.db.insert('documentTemplates', {
        name: blankTemplate.name,
        description: blankTemplate.description,
        category: blankTemplate.category,
        snapshot: blankTemplate.snapshot,
        usageCount: 0,
        isPublic: false,
        isActive: true,
        createdBy: user._id,
        createdAt: now,
      });
      results.push({ type: 'blank', id: blankTemplateId });
    }

    // Check if project brief template already exists
    const existingProjectTemplate = await ctx.db
      .query('documentTemplates')
      .withIndex('by_category', (q) => q.eq('category', 'project_brief'))
      .first();

    if (!existingProjectTemplate) {
      // Create the default project brief template
      const projectTemplateId = await ctx.db.insert('documentTemplates', {
        name: projectBriefTemplate.name,
        description: projectBriefTemplate.description,
        category: projectBriefTemplate.category,
        snapshot: projectBriefTemplate.snapshot,
        usageCount: 0,
        isPublic: false,
        isActive: true,
        createdBy: user._id,
        createdAt: now,
      });
      results.push({ type: 'project_brief', id: projectTemplateId });
    }

    return results;
  },
});

// Update template (admin only)
export const updateTemplate = mutation({
  args: {
    templateId: v.id('documentTemplates'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    category: v.optional(v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective'),
      v.literal('general'),
      v.literal('user_created'),
    )),
    thumbnailUrl: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    snapshot: v.optional(v.object({
      documentTitle: v.string(),
      documentMetadata: v.optional(v.any()),
      pages: v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        content: v.string(),
        subpages: v.optional(v.array(v.object({
          title: v.string(),
          icon: v.optional(v.string()),
          order: v.number(),
          content: v.string(),
        }))),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admins can update templates
    if (user.role !== 'admin') {
      throw new Error('Only administrators can update document templates');
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const updates: any = {};

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.category !== undefined) updates.category = args.category;
    if (args.thumbnailUrl !== undefined) updates.thumbnailUrl = args.thumbnailUrl;
    if (args.isPublic !== undefined) updates.isPublic = args.isPublic;
    if (args.snapshot !== undefined) updates.snapshot = args.snapshot;

    await ctx.db.patch(args.templateId, updates);
    return args.templateId;
  },
});

// Delete template (admin only)
export const deleteTemplate = mutation({
  args: { templateId: v.id('documentTemplates') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admins can delete templates
    if (user.role !== 'admin') {
      throw new Error('Only administrators can delete document templates');
    }

    const template = await ctx.db.get(args.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    await ctx.db.delete(args.templateId);
    return args.templateId;
  },
});