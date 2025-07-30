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
  description: 'Standard project brief template with comprehensive sections',
  documentType: 'project_brief' as const,
  defaultSections: [
    {
      type: 'overview' as const,
      title: 'Overview',
      icon: 'FileText',
      order: 0,
      required: true,
      defaultContent: [{
        id: 'overview-default',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'This section provides a high-level overview of the project goals, scope, and key objectives.' 
        }],
        children: []
      }],
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm'],
        canInteract: ['admin', 'pm'],
        canReorder: ['admin', 'pm'],
        canDelete: ['admin'],
        clientVisible: true,
      }
    },
    {
      type: 'deliverables' as const,
      title: 'Deliverables',
      icon: 'CheckSquare',
      order: 1,
      required: true,
      defaultContent: [{
        id: 'deliverables-default',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Project deliverables, tasks, and milestones will be tracked in this section.' 
        }],
        children: []
      }],
      permissions: {
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
      }
    },
    {
      type: 'timeline' as const,
      title: 'Timeline',
      icon: 'Calendar',
      order: 2,
      required: false,
      defaultContent: [{
        id: 'timeline-default',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Project timeline, milestones, and sprint schedule will be managed here.' 
        }],
        children: []
      }],
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm'],
        canInteract: ['admin', 'pm'],
        canReorder: ['admin', 'pm'],
        canDelete: ['admin'],
        clientVisible: true,
      }
    },
    {
      type: 'team' as const,
      title: 'Team',
      icon: 'Users',
      order: 3,
      required: false,
      defaultContent: [{
        id: 'team-default',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Team members, stakeholders, and project roles are documented here.' 
        }],
        children: []
      }],
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm'],
        canInteract: ['admin', 'pm'],
        canReorder: ['admin', 'pm'],
        canDelete: ['admin'],
        clientVisible: true,
      }
    },
    {
      type: 'feedback' as const,
      title: 'Feedback',
      icon: 'MessageSquare',
      order: 4,
      required: false,
      defaultContent: [{
        id: 'feedback-default',
        type: 'paragraph',
        props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
        content: [{ 
          type: 'text', 
          text: 'Client feedback, reviews, and communication will be tracked in this section.' 
        }],
        children: []
      }],
      permissions: {
        canView: ['admin', 'pm', 'task_owner', 'client'],
        canEdit: ['admin', 'pm', 'client'],
        canInteract: ['admin', 'pm', 'client'],
        canReorder: ['admin', 'pm'],
        canDelete: ['admin'],
        clientVisible: true,
      }
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
      .withIndex('by_active', (q) => q.eq('isActive', true))
      .collect();
  },
});

// Get templates by document type
export const getTemplatesByType = query({
  args: { 
    documentType: v.union(
      v.literal('project_brief'),
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective')
    )
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    return await ctx.db
      .query('documentTemplates')
      .withIndex('by_document_type', (q) => q.eq('documentType', args.documentType))
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
      v.literal('meeting_notes'),
      v.literal('wiki_article'),
      v.literal('resource_doc'),
      v.literal('retrospective')
    ),
    defaultSections: v.array(v.object({
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
      order: v.number(),
      required: v.boolean(),
      defaultContent: v.optional(v.any()),
      permissions: v.object({
        canView: v.array(v.string()),
        canEdit: v.array(v.string()),
        canInteract: v.array(v.string()),
        canReorder: v.array(v.string()),
        canDelete: v.array(v.string()),
        clientVisible: v.boolean(),
        fieldPermissions: v.optional(v.object({}))
      })
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
      defaultSections: args.defaultSections,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
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
      .withIndex('by_document_type', (q) => q.eq('documentType', 'project_brief'))
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
      defaultSections: projectBriefTemplate.defaultSections,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
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
    defaultSections: v.optional(v.array(v.object({
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
      order: v.number(),
      required: v.boolean(),
      defaultContent: v.optional(v.any()),
      permissions: v.object({
        canView: v.array(v.string()),
        canEdit: v.array(v.string()),
        canInteract: v.array(v.string()),
        canReorder: v.array(v.string()),
        canDelete: v.array(v.string()),
        clientVisible: v.boolean(),
        fieldPermissions: v.optional(v.object({}))
      })
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

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.defaultSections !== undefined) updates.defaultSections = args.defaultSections;

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