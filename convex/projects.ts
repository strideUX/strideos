import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Create a new project document
export const createProject = mutation({
  args: {
    title: v.string(),
    clientId: v.id('clients'),
    departmentId: v.id('departments'),
    description: v.optional(v.string()),
    template: v.union(
      v.literal('project_brief'),
      v.literal('technical_spec'),
      v.literal('marketing_campaign'),
      v.literal('client_onboarding'),
      v.literal('retrospective'),
      v.literal('custom')
    ),
    targetDueDate: v.optional(v.number()),
    visibility: v.union(
      v.literal('private'),
      v.literal('department'),
      v.literal('client'),
      v.literal('organization')
    ),
    projectManagerId: v.optional(v.id('users')),
    teamMemberIds: v.optional(v.array(v.id('users'))),
    templateSource: v.optional(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check permissions - admin and PM can create projects
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create projects');
    }

    const now = Date.now();
    
    // If creating from template, get template content
    let templateContent = null;
    let templateSections = null;
    
    if (args.templateSource) {
      const sourceProject = await ctx.db.get(args.templateSource);
      if (sourceProject && sourceProject.isTemplate) {
        templateContent = sourceProject.documentContent;
        templateSections = sourceProject.sections;
      }
    }

    const projectId = await ctx.db.insert('projects', {
      title: args.title,
      clientId: args.clientId,
      departmentId: args.departmentId,
      description: args.description,
      status: 'draft',
      template: args.template,
      targetDueDate: args.targetDueDate,
      documentContent: templateContent || getTemplateContent(args.template),
      sections: templateSections || getTemplateSections(args.template),
      visibility: args.visibility,
      projectManagerId: args.projectManagerId || user._id,
      teamMemberIds: args.teamMemberIds || [],
      templateSource: args.templateSource,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return projectId;
  },
});

// Update project document content
export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    documentContent: v.optional(v.any()),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      anchor: v.string(),
      level: v.number(),
      order: v.number()
    }))),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('review'),
      v.literal('complete'),
      v.literal('archived')
    )),
    targetDueDate: v.optional(v.number()),
    visibility: v.optional(v.union(
      v.literal('private'),
      v.literal('department'),
      v.literal('client'),
      v.literal('organization')
    )),
    teamMemberIds: v.optional(v.array(v.id('users'))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    // Check permissions
    const canEdit = user.role === 'admin' || 
                   user.role === 'pm' || 
                   project.projectManagerId === user._id ||
                   project.teamMemberIds?.includes(user._id);
    
    if (!canEdit) {
      throw new Error('Insufficient permissions to edit this project');
    }

    const updates: any = {
      updatedAt: Date.now(),
      version: (project.version || 1) + 1,
    };

    // Add provided updates
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.documentContent !== undefined) updates.documentContent = args.documentContent;
    if (args.sections !== undefined) updates.sections = args.sections;
    if (args.status !== undefined) updates.status = args.status;
    if (args.targetDueDate !== undefined) updates.targetDueDate = args.targetDueDate;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.teamMemberIds !== undefined) updates.teamMemberIds = args.teamMemberIds;

    // Handle status-specific updates
    if (args.status === 'active' && project.status === 'draft') {
      updates.actualStartDate = Date.now();
    }
    if (args.status === 'complete' && project.status !== 'complete') {
      updates.actualCompletionDate = Date.now();
    }

    await ctx.db.patch(args.projectId, updates);
    return args.projectId;
  },
});

// Get a single project with full details
export const getProject = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }

    // Check visibility permissions
    const canView = checkProjectVisibility(project, user);
    if (!canView) {
      throw new Error('Insufficient permissions to view this project');
    }

    // Get related data
    const client = await ctx.db.get(project.clientId);
    const department = await ctx.db.get(project.departmentId);
    const projectManager = await ctx.db.get(project.projectManagerId);
    const creator = await ctx.db.get(project.createdBy);

    // Get team members
    const teamMembers = project.teamMemberIds ? 
      await Promise.all(project.teamMemberIds.map(id => ctx.db.get(id))) : [];

    return {
      ...project,
      client,
      department,
      projectManager,
      creator,
      teamMembers: teamMembers.filter(Boolean),
    };
  },
});

// List projects with filtering and pagination
export const listProjects = query({
  args: {
    clientId: v.optional(v.id('clients')),
    departmentId: v.optional(v.id('departments')),
    status: v.optional(v.union(
      v.literal('draft'),
      v.literal('active'),
      v.literal('review'),
      v.literal('complete'),
      v.literal('archived')
    )),
    template: v.optional(v.union(
      v.literal('project_brief'),
      v.literal('technical_spec'),
      v.literal('marketing_campaign'),
      v.literal('client_onboarding'),
      v.literal('retrospective'),
      v.literal('custom')
    )),
    isTemplate: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    let projects;

    // Apply filters using appropriate indexes
    if (args.clientId) {
      projects = await ctx.db
        .query('projects')
        .withIndex('by_client', q => q.eq('clientId', args.clientId!))
        .collect();
    } else if (args.departmentId) {
      projects = await ctx.db
        .query('projects')
        .withIndex('by_department', q => q.eq('departmentId', args.departmentId!))
        .collect();
    } else if (args.status) {
      projects = await ctx.db
        .query('projects')
        .withIndex('by_status', q => q.eq('status', args.status!))
        .collect();
    } else {
      projects = await ctx.db.query('projects').collect();
    }

    // Apply additional filters
    if (args.template) {
      projects = projects.filter(p => p.template === args.template);
    }
    if (args.isTemplate !== undefined) {
      projects = projects.filter(p => Boolean(p.isTemplate) === args.isTemplate);
    }

    // Filter by visibility permissions
    projects = projects.filter(project => checkProjectVisibility(project, user));

    // Sort by updated date (most recent first)
    projects.sort((a, b) => b.updatedAt - a.updatedAt);

    // Apply limit
    if (args.limit) {
      projects = projects.slice(0, args.limit);
    }

    // Get related data for each project
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const client = await ctx.db.get(project.clientId);
        const department = await ctx.db.get(project.departmentId);
        const projectManager = await ctx.db.get(project.projectManagerId);
        
        return {
          ...project,
          client,
          department,
          projectManager,
        };
      })
    );

    return projectsWithData;
  },
});

// Create project template
export const createTemplate = mutation({
  args: {
    title: v.string(),
    template: v.union(
      v.literal('project_brief'),
      v.literal('technical_spec'),
      v.literal('marketing_campaign'),
      v.literal('client_onboarding'),
      v.literal('retrospective'),
      v.literal('custom')
    ),
    documentContent: v.any(),
    sections: v.optional(v.array(v.object({
      id: v.string(),
      title: v.string(),
      anchor: v.string(),
      level: v.number(),
      order: v.number()
    }))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Only admin and PM can create templates
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create templates');
    }

    // Create a dummy client/department for templates
    const systemClient = await ctx.db
      .query('clients')
      .filter(q => q.eq(q.field('name'), 'System Templates'))
      .first();
    
    if (!systemClient) {
      throw new Error('System templates client not found');
    }

    const systemDepartment = await ctx.db
      .query('departments')
      .withIndex('by_client', q => q.eq('clientId', systemClient._id))
      .first();

    if (!systemDepartment) {
      throw new Error('System templates department not found');
    }

    const now = Date.now();
    const templateId = await ctx.db.insert('projects', {
      title: args.title,
      clientId: systemClient._id,
      departmentId: systemDepartment._id,
      status: 'complete',
      template: args.template,
      documentContent: args.documentContent,
      sections: args.sections,
      visibility: 'organization',
      projectManagerId: user._id,
      isTemplate: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return templateId;
  },
});

// Helper function to check project visibility permissions
function checkProjectVisibility(project: any, user: any): boolean {
  // Admin can see everything
  if (user.role === 'admin') return true;
  
  // Project manager and team members can always see their projects
  if (project.projectManagerId === user._id) return true;
  if (project.teamMemberIds?.includes(user._id)) return true;
  
  // Check visibility levels
  switch (project.visibility) {
    case 'private':
      return false; // Already checked above
    case 'department':
      return user.departmentIds?.includes(project.departmentId) || false;
    case 'client':
      return user.clientId === project.clientId;
    case 'organization':
      return true;
    default:
      return false;
  }
}

// Helper function to get default template content
function getTemplateContent(template: string): any {
  const templates = {
    'project_brief': {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Project Brief' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Project Overview' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Describe the project goals and objectives...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Scope & Deliverables' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Define what will be delivered...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Timeline & Milestones' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Key dates and milestones...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Team & Resources' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Team members and required resources...' }]
        }
      ]
    },
    'technical_spec': {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Technical Specification' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Requirements' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Technical requirements and constraints...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Architecture' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'System architecture and design...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Implementation Plan' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Development approach and timeline...' }]
        }
      ]
    },
    'marketing_campaign': {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Marketing Campaign' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Campaign Goals' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Define campaign objectives and KPIs...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Target Audience' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Audience demographics and personas...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Campaign Strategy' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Marketing channels and tactics...' }]
        }
      ]
    },
    'client_onboarding': {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Client Onboarding' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Client Information' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Client background and context...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Onboarding Checklist' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Steps to complete onboarding...' }]
        }
      ]
    },
    'retrospective': {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Project Retrospective' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'What Went Well' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Positive outcomes and successes...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'What Could Be Improved' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Areas for improvement...' }]
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Action Items' }]
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Next steps and improvements...' }]
        }
      ]
    }
  };

  return templates[template as keyof typeof templates] || templates['project_brief'];
}

// Helper function to get default template sections
function getTemplateSections(template: string): any[] {
  const sections = {
    'project_brief': [
      { id: '1', title: 'Project Overview', anchor: 'project-overview', level: 2, order: 1 },
      { id: '2', title: 'Scope & Deliverables', anchor: 'scope-deliverables', level: 2, order: 2 },
      { id: '3', title: 'Timeline & Milestones', anchor: 'timeline-milestones', level: 2, order: 3 },
      { id: '4', title: 'Team & Resources', anchor: 'team-resources', level: 2, order: 4 }
    ],
    'technical_spec': [
      { id: '1', title: 'Requirements', anchor: 'requirements', level: 2, order: 1 },
      { id: '2', title: 'Architecture', anchor: 'architecture', level: 2, order: 2 },
      { id: '3', title: 'Implementation Plan', anchor: 'implementation-plan', level: 2, order: 3 }
    ],
    'marketing_campaign': [
      { id: '1', title: 'Campaign Goals', anchor: 'campaign-goals', level: 2, order: 1 },
      { id: '2', title: 'Target Audience', anchor: 'target-audience', level: 2, order: 2 },
      { id: '3', title: 'Campaign Strategy', anchor: 'campaign-strategy', level: 2, order: 3 }
    ],
    'client_onboarding': [
      { id: '1', title: 'Client Information', anchor: 'client-information', level: 2, order: 1 },
      { id: '2', title: 'Onboarding Checklist', anchor: 'onboarding-checklist', level: 2, order: 2 }
    ],
    'retrospective': [
      { id: '1', title: 'What Went Well', anchor: 'what-went-well', level: 2, order: 1 },
      { id: '2', title: 'What Could Be Improved', anchor: 'what-could-be-improved', level: 2, order: 2 },
      { id: '3', title: 'Action Items', anchor: 'action-items', level: 2, order: 3 }
    ]
  };

  return sections[template as keyof typeof sections] || sections['project_brief'];
} 