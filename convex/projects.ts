import { mutation, query } from './_generated/server';
import { createProjectBriefFromTemplateInternal } from './templates';
import { v } from 'convex/values';
import { auth } from './auth';
import { Id } from "./_generated/dataModel";

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Authentication required');
    }
    
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    // Check permissions - admin and PM can create projects
    if (!['admin', 'pm'].includes(user.role)) {
      throw new Error('Insufficient permissions to create projects');
    }

    const now = Date.now();

    // Ensure a default project key exists for this client/department
    try {
      await ctx.scheduler.runAfter(0, 'slugs:generateProjectKey' as any, {
        clientId: args.clientId,
        departmentId: args.departmentId,
      });
    } catch (_e) {
      // best-effort; slug generation will create as needed
    }
    
    // Get the project brief template
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
            id: 'overview-details-placeholder',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: '[Project Details Block will be inserted here]' 
            }],
            children: []
          }, {
            id: 'overview-goals-heading',
            type: 'heading',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left', level: 2 },
            content: [{ type: 'text', text: 'Goals' }],
            children: []
          }, {
            id: 'overview-goals-bullet',
            type: 'bulletListItem',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ type: 'text', text: 'Enter your project goals here' }],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        },
        {
          type: 'deliverables' as const,
          title: 'Tasks',
          icon: 'CheckSquare',
          order: 1,
          required: true,
          defaultContent: [{
            id: 'tasks-block',
            type: 'tasks',
            props: { 
              textColor: 'default', 
              backgroundColor: 'default', 
              textAlignment: 'left',
              projectId: '', // Will be updated after project creation
              title: 'Tasks',
              showCompleted: 'true',
              taskIds: '[]'
            },
            content: [],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        },
        {
          type: 'custom' as const,
          title: 'Assets',
          icon: 'FolderOpen',
          order: 2,
          required: true,
          defaultContent: [{
            id: 'assets-default',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Project documents, assets and attachments will be listed here' 
            }],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        },
        {
          type: 'feedback' as const,
          title: 'Feedback',
          icon: 'MessageSquare',
          order: 3,
          required: true,
          defaultContent: [{
            id: 'feedback-default',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Client feedback loop will go here' 
            }],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        },
        {
          type: 'weekly_status' as const,
          title: 'Weekly Status',
          icon: 'TrendingUp',
          order: 4,
          required: true,
          defaultContent: [{
            id: 'weekly-status-default',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Weekly project status updates will go here' 
            }],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        },
        {
          type: 'original_request' as const,
          title: 'Original Request',
          icon: 'MessageCircle',
          order: 5,
          required: true,
          defaultContent: [{
            id: 'original-request-default',
            type: 'paragraph',
            props: { textColor: 'default', backgroundColor: 'default', textAlignment: 'left' },
            content: [{ 
              type: 'text', 
              text: 'Original client request will go here' 
            }],
            children: []
          }],
          permissions: {
            canView: ['admin', 'pm', 'task_owner', 'client'],
            canEdit: ['admin', 'pm', 'task_owner', 'client'],
            canInteract: ['admin', 'pm', 'task_owner', 'client'],
            canReorder: ['admin', 'pm'],
            canDelete: ['admin'],
            clientVisible: true,
          }
        }
      ]
    };

    // Create document from template (fallback to blank if none)
    const { documentId } = await createProjectBriefFromTemplateInternal(ctx, {
      title: args.title,
      clientId: args.clientId,
      departmentId: args.departmentId,
    });

    const projectId = await ctx.db.insert('projects', {
      title: args.title,
      clientId: args.clientId,
      departmentId: args.departmentId,
      description: args.description,
      status: 'new',
      targetDueDate: args.targetDueDate,
      documentId: documentId, // Link to the created document
      visibility: args.visibility,
      projectManagerId: args.projectManagerId || user._id,
      teamMemberIds: args.teamMemberIds || [],
      templateSource: args.templateSource,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Update document with project reference (back-compat + metadata)
    const createdDoc = await ctx.db.get(documentId);
    const mergedMetadata = { ...(createdDoc as any)?.metadata, projectId } as any;
    await ctx.db.patch(documentId, { projectId, metadata: mergedMetadata });

    // Generate project slug (non-blocking)
    try {
      await ctx.scheduler.runAfter(0, 'slugsSimplified:generateProjectSlug' as any, { projectId });
    } catch (_e) {
      // ignore
    }

    // TODO: In the new page-based system, we'll handle task blocks differently
    // For now, skip the task section update since we're using the new document structure
    console.log('Skipping task section update for new document structure');
    const tasksSection = null; // Skip legacy document sections for new documents

    // Task section processing skipped for new document structure

    // Create notification for assigned project manager
    try {
      const assignedPmId = args.projectManagerId || user._id;
      if (assignedPmId) {
        await ctx.db.insert('notifications', {
          type: 'project_created',
          title: 'New Project Assigned',
          message: `You have been assigned as project manager for "${args.title}"`,
          userId: assignedPmId,
          isRead: false,
          priority: 'medium',
          // Use entity fields for project linkage
          entityType: 'project',
          entityId: projectId as unknown as string,
          relatedDocumentId: documentId,
          actionUrl: `/projects/${projectId}/details`,
          actionText: 'View Project',
          createdAt: Date.now(),
        });
      }
    } catch (e) {
      // Best-effort notification; do not fail project creation
      console.log('Failed to create project_created notification', e);
    }

    return { projectId, documentId };
  },
});

// Update project document content
export const updateProject = mutation({
  args: {
    projectId: v.id('projects'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('new'),
      v.literal('planning'),
      v.literal('ready_for_work'),
      v.literal('in_progress'),
      v.literal('client_review'),
      v.literal('client_approved'),
      v.literal('complete')
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
    };

    // Add provided updates
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.targetDueDate !== undefined) updates.targetDueDate = args.targetDueDate;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    if (args.teamMemberIds !== undefined) updates.teamMemberIds = args.teamMemberIds;

    // Handle status-specific updates
    if (args.status === 'in_progress' && project.status !== 'in_progress') {
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
      projectKey: (project as any).projectKey,
      slug: (project as any).slug,
    };
  },
});

// List projects with filtering and pagination
export const listProjects = query({
  args: {
    clientId: v.optional(v.id('clients')),
    departmentId: v.optional(v.id('departments')),
    status: v.optional(v.union(
      v.literal('new'),
      v.literal('planning'),
      v.literal('ready_for_work'),
      v.literal('in_progress'),
      v.literal('client_review'),
      v.literal('client_approved'),
      v.literal('complete')
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
      // Filter by template is no longer supported since projects don't have templates
      // projects = projects.filter(p => p.template === args.template);
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

// Get project statistics for dashboard
export const getProjectStats = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error('Authentication required');
    }

    const projects = await ctx.db.query('projects').collect();
    
    // Filter by visibility permissions
    const visibleProjects = projects.filter(project => checkProjectVisibility(project, user));
    
    // Calculate stats
    const totalProjects = visibleProjects.length;
    const onTrackProjects = visibleProjects.filter(p => 
      ['ready_for_work', 'in_progress'].includes(p.status)
    ).length;
    const atRiskProjects = visibleProjects.filter(p => 
      p.status === 'client_review' || 
      (p.targetDueDate && p.targetDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000) // Due within 7 days
    ).length;
    
    // Calculate average progress from tasks
    const allTasks = await ctx.db.query('tasks').collect();
    const projectTasks = allTasks.filter(task => 
      task.projectId && visibleProjects.some(p => p._id === task.projectId)
    );
    
    const completedTasks = projectTasks.filter(task => task.status === 'done').length;
    const totalTaskCount = projectTasks.length;
    const avgProgress = totalTaskCount > 0 ? Math.round((completedTasks / totalTaskCount) * 100) : 0;
    
    return {
      totalProjects,
      onTrackProjects,
      atRiskProjects,
      avgProgress,
    };
  },
});

// Get project team composition
export const getProjectTeam = query({
  args: { projectId: v.id('projects') },
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
    const canView = checkProjectVisibility(project, user);
    if (!canView) {
      throw new Error('Insufficient permissions to view this project');
    }

    // Get department lead (internal PM)
    const department = await ctx.db.get(project.departmentId);
    const departmentLead = department ? await ctx.db.get(department.leadId) : null;
    
    // Get all client users from the project's department
    const clientUsers = department ? await Promise.all(
      department.teamMemberIds.map(id => ctx.db.get(id))
    ) : [];
    
    // Get any task_owner users assigned tasks in this project
    const projectTasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect();
    
    const taskOwnerIds = [...new Set(projectTasks
      .filter(task => task.assigneeId)
      .map(task => task.assigneeId!)
    )];
    
    const taskOwners = await Promise.all(
      taskOwnerIds.map(id => ctx.db.get(id))
    );
    
    // Combine all team members
    const allTeamMembers = [
      ...(departmentLead ? [departmentLead] : []),
      ...clientUsers.filter(Boolean),
      ...taskOwners.filter(Boolean)
    ];
    
    // Remove duplicates
    const uniqueTeamMembers = allTeamMembers.filter((member, index, arr) => 
      member && arr.findIndex(m => m && m._id === member._id) === index
    );
    
    return uniqueTeamMembers;
  },
});

// Get project tasks
export const getProjectTasks = query({
  args: { projectId: v.id('projects') },
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
    const canView = checkProjectVisibility(project, user);
    if (!canView) {
      throw new Error('Insufficient permissions to view this project');
    }

    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', q => q.eq('projectId', args.projectId))
      .collect();

    // Enrich tasks with assignee data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const assignee = task.assigneeId ? await ctx.db.get(task.assigneeId) : null;
        return {
          ...task,
          assignee: assignee ? { _id: assignee._id, name: (assignee as any).name, email: (assignee as any).email, image: (assignee as any).image } : null,
          slug: (task as any).slug,
          slugKey: (task as any).slugKey,
          slugNumber: (task as any).slugNumber,
        };
      })
    );

    return enrichedTasks;
  },
});

// Create project template
export const getOrCreateProjectDocument = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    // Check if user can view this project
    if (!['admin', 'pm'].includes(user.role) && project.createdBy !== user._id) {
      throw new Error('Insufficient permissions to view this project');
    }

    // Look for existing document linked to this project
    const existingDocument = await ctx.db
      .query('documents')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .first();

    if (existingDocument) {
      // Return existing document with pages (new system)
      const pages = await ctx.db
        .query('documentPages')
        .withIndex('by_document_order', (q) => q.eq('documentId', existingDocument._id))
        .collect();

      return {
        document: existingDocument,
        pages: pages.sort((a, b) => a.order - b.order)
      };
    }

    // If no document exists, we need to create one via a mutation
    // For now, return null to indicate document needs to be created
    return null;
  },
});

// Fetch the linked document for a project with error handling
export const getProjectDocument = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    if (!project.documentId) return null;

    const document = await ctx.db.get(project.documentId);
    if (!document) return null;

    const pages = await ctx.db
      .query('documentPages')
      .withIndex('by_document_order', (q) => q.eq('documentId', project.documentId))
      .collect();

    return { document, pages: pages.sort((a, b) => a.order - b.order) } as const;
  },
});

// Return counts of affected records for delete confirmation UI
export const getProjectDeletionSummary = query({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') throw new Error('Insufficient permissions');

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    // Count linked data
    const tasks = await ctx.db
      .query('tasks')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .collect();

    let documentCount = 0;
    let pageCount = 0;
    let commentCount = 0;

    if (project.documentId) {
      const doc = await ctx.db.get(project.documentId);
      if (doc) {
        documentCount = 1;
        const pages = await ctx.db
          .query('documentPages')
          .withIndex('by_document', (q) => q.eq('documentId', project.documentId))
          .collect();
        pageCount = pages.length;

        // Count comment threads/comments by docId string
        const docIdString = (project.documentId as unknown as string);
        const threads = await ctx.db
          .query('commentThreads')
          .withIndex('by_doc', (q) => q.eq('docId', docIdString))
          .collect();
        for (const thread of threads) {
          const comments = await ctx.db
            .query('comments')
            .withIndex('by_thread', (q) => q.eq('threadId', (thread as any).id))
            .collect();
          commentCount += comments.length;
        }
      }
    }

    return {
      taskCount: tasks.length,
      documentCount,
      pageCount,
      commentCount,
    } as const;
  },
});

// Create document for project (mutation)
export const createProjectDocument = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    // Check if user can create documents for this project
    if (!['admin', 'pm'].includes(user.role) && project.createdBy !== user._id) {
      throw new Error('Insufficient permissions to create document for this project');
    }

    // Check if document already exists
    const existingDocument = await ctx.db
      .query('documents')
      .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
      .first();

    if (existingDocument) {
      throw new Error('Document already exists for this project');
    }

    const now = Date.now();

    // Create a new document for this project
    const documentId = await ctx.db.insert('documents', {
      title: project.title,
      projectId: args.projectId,
      clientId: project.clientId,
      departmentId: project.departmentId,
      status: 'published', // Project briefs are published when project is created
      documentType: 'project_brief',
      permissions: {
        canView: ['admin', 'pm', 'task_owner'],
        canEdit: ['admin', 'pm'],
        clientVisible: project.visibility === 'client' || project.visibility === 'organization'
      },
      createdBy: project.createdBy,
      updatedBy: user._id,
      lastModified: now,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Create default sections for the project brief
    const defaultSections = [
      {
        type: 'overview' as const,
        title: 'Project Overview',
        icon: 'FileText',
        order: 1,
        required: true,
        content: [],
        permissions: {
          canView: ['admin', 'pm', 'task_owner'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin', 'pm'],
          clientVisible: true,
        },
        createdBy: project.createdBy,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'deliverables' as const,
        title: 'Tasks & Deliverables',
        icon: 'CheckCircle',
        order: 2,
        required: true,
        content: [],
        permissions: {
          canView: ['admin', 'pm', 'task_owner'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm', 'task_owner'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin', 'pm'],
          clientVisible: true,
        },
        createdBy: project.createdBy,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'weekly_status' as const,
        title: 'Updates & Progress',
        icon: 'Calendar',
        order: 3,
        required: false,
        content: [],
        permissions: {
          canView: ['admin', 'pm', 'task_owner'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm', 'task_owner'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin', 'pm'],
          clientVisible: true,
        },
        createdBy: project.createdBy,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'team' as const,
        title: 'Team & Stakeholders',
        icon: 'Users',
        order: 4,
        required: false,
        content: [],
        permissions: {
          canView: ['admin', 'pm', 'task_owner'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin', 'pm'],
          clientVisible: true,
        },
        createdBy: project.createdBy,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      },
      {
        type: 'custom' as const,
        title: 'Project Settings',
        icon: 'Settings',
        order: 5,
        required: false,
        content: [],
        permissions: {
          canView: ['admin', 'pm'],
          canEdit: ['admin', 'pm'],
          canInteract: ['admin', 'pm'],
          canReorder: ['admin', 'pm'],
          canDelete: ['admin', 'pm'],
          clientVisible: false,
        },
        createdBy: project.createdBy,
        updatedBy: user._id,
        createdAt: now,
        updatedAt: now,
      }
    ];

    // Create default pages for the new document (using page-based structure)
    const pageDocId = `doc_${documentId}_${crypto.randomUUID()}`;
    await ctx.db.insert('documentPages', {
      documentId,
      docId: pageDocId,
      title: 'Project Brief',
      order: 0,
      createdAt: now
    });

    return documentId;
  },
});

// Admin-only delete with cascade
export const deleteProject = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== 'admin') {
      throw new Error('Only administrators can delete projects');
    }

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    try {
      // Build summary counts up-front
      const tasks = await ctx.db
        .query('tasks')
        .withIndex('by_project', (q) => q.eq('projectId', args.projectId))
        .collect();

      let documentCount = 0;
      let pageCount = 0;
      let commentCount = 0;

      // 1) Delete all comments linked to documents (via commentThreads -> comments using docId string)
      if (project.documentId) {
        const docRecord = await ctx.db.get(project.documentId);
        if (docRecord) {
          documentCount = 1;
          const docIdString = (project.documentId as unknown as string);
          const threads = await ctx.db
            .query('commentThreads')
            .withIndex('by_doc', (q) => q.eq('docId', docIdString))
            .collect();
          for (const thread of threads) {
            const comments = await ctx.db
              .query('comments')
              .withIndex('by_thread', (q) => q.eq('threadId', (thread as any).id))
              .collect();
            commentCount += comments.length;
            for (const c of comments) await ctx.db.delete(c._id);
            await ctx.db.delete(thread._id);
          }

          // Also delete document status audits
          const audits = await ctx.db
            .query('documentStatusAudits')
            .withIndex('by_document', (q) => q.eq('documentId', project.documentId))
            .collect();
          for (const audit of audits) await ctx.db.delete(audit._id);

          // 2) List pages linked to project_briefs
          const pages = await ctx.db
            .query('documentPages')
            .withIndex('by_document', (q) => q.eq('documentId', project.documentId))
            .collect();
          pageCount = pages.length;

          // 3) Delete all pages linked to project_briefs
          for (const page of pages) {
            await ctx.db.delete(page._id);
          }

          // 4) Delete the project_brief document itself
          await ctx.db.delete(project.documentId);
        }
      }

      // 5) Delete all tasks linked to project
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }

      // 6) Delete the project record
      await ctx.db.delete(args.projectId);

      // Log audit
      try {
        await ctx.db.insert('projectDeletionAudits', {
          projectId: args.projectId,
          adminUserId: user._id as Id<'users'>,
          action: 'delete',
          summary: { documentCount, pageCount, taskCount: tasks.length, commentCount },
          timestamp: Date.now(),
        } as any);
      } catch (_e) {
        // best-effort logging
      }

      return { success: true, deletedProjectId: args.projectId } as const;
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw new Error('Failed to delete project and associated data');
    }
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

 
 