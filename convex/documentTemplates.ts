import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { auth } from './auth';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Default project brief template  
const projectBriefTemplate = {
  name: 'Project Brief',
  description: 'Standard project brief template for new page-based editor',
  documentType: 'project_brief' as const,
  defaultPages: [
    {
      title: 'Overview',
      icon: 'FileText',
      order: 0,
      defaultContent: [{
        id: 'overview-intro',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Project overview and goals will be documented here.' 
        }],
        children: []
      }]
    },
    {
      title: 'Tasks',
      icon: 'CheckSquare', 
      order: 1,
      defaultContent: [{
        id: 'tasks-intro',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Project tasks and deliverables will be managed here.' 
        }],
        children: []
      }]
    },
    {
      title: 'Assets',
      icon: 'FolderOpen',
      order: 2,
      defaultContent: [{
        id: 'assets-intro',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Project documents, assets and attachments will be listed here.' 
        }],
        children: []
      }]
    }
  ]
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
    documentType: v.union(
      v.literal('project_brief'),
      v.literal('blank')
    )
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    return await ctx.db
      .query('documentTemplates')
      .withIndex('by_type', (q) => q.eq('documentType', args.documentType))
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
    documentType: v.union(
      v.literal('project_brief'),
      v.literal('blank')
    ),
    defaultPages: v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      defaultContent: v.optional(v.any()),
      subpages: v.optional(v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        defaultContent: v.optional(v.any())
      })))
    })),
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
      documentType: args.documentType,
      defaultPages: args.defaultPages,
      isActive: true,
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

    // Check if project brief template already exists
    const existingTemplate = await ctx.db
      .query('documentTemplates')
      .withIndex('by_type', (q) => q.eq('documentType', 'project_brief'))
      .filter((q) => q.eq(q.field('name'), 'Project Brief'))
      .first();

    if (existingTemplate) {
      return existingTemplate._id;
    }

    const now = Date.now();

    // Create the default project brief template
    const templateId = await ctx.db.insert('documentTemplates', {
      name: projectBriefTemplate.name,
      description: projectBriefTemplate.description,
      documentType: projectBriefTemplate.documentType,
      defaultPages: projectBriefTemplate.defaultPages,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
    });

    return templateId;
  },
});

// Update template (admin only)
export const updateTemplate = mutation({
  args: {
    templateId: v.id('documentTemplates'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    defaultPages: v.optional(v.array(v.object({
      title: v.string(),
      icon: v.optional(v.string()),
      order: v.number(),
      defaultContent: v.optional(v.any()),
      subpages: v.optional(v.array(v.object({
        title: v.string(),
        icon: v.optional(v.string()),
        order: v.number(),
        defaultContent: v.optional(v.any())
      })))
    }))),
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
    if (args.defaultPages !== undefined) updates.defaultPages = args.defaultPages;

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