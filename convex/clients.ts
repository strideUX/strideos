import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

// Generate upload URL for logo files
export const generateLogoUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to upload logos');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Update client logo
export const updateClientLogo = mutation({
  args: {
    clientId: v.id("clients"),
    storageId: v.optional(v.id("_storage")) // null removes logo
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to update client logos');
    }

    await ctx.db.patch(args.clientId, {
      logo: args.storageId,
      updatedAt: Date.now()
    });

    return args.clientId;
  },
});

// Client creation with validation
export const createClient = mutation({
  args: {
    name: v.string(),
    projectKey: v.string(), // Now required for new clients
    website: v.optional(v.string()),
    isInternal: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to create clients');
    }

    // Validate client name uniqueness
    const existingClient = await ctx.db
      .query('clients')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();

    if (existingClient) {
      throw new Error('A client with this name already exists');
    }

    // Validate project key format and uniqueness
    const projectKey = args.projectKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (projectKey.length < 4 || projectKey.length > 6) {
      throw new Error('Project key must be 4-6 alphanumeric characters');
    }

    const existingKey = await ctx.db
      .query('clients')
      .withIndex('by_project_key', (q) => q.eq('projectKey', projectKey))
      .first();

    if (existingKey) {
      throw new Error(`Project key "${projectKey}" is already in use`);
    }

    // Create the client
    const clientId = await ctx.db.insert('clients', {
      name: args.name,
      projectKey,
      website: args.website,
      isInternal: args.isInternal || false,
      status: 'active',
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Automatically create a default department for the new client
    await ctx.db.insert('departments', {
      name: 'Default',
      clientId: clientId,
      primaryContactId: userId, // Use the admin user as temporary primary contact
      leadId: userId, // Use the admin user as temporary lead
      teamMemberIds: [],
      workstreamCount: 1,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return clientId;
  },
});

// Update client with validation
export const updateClient = mutation({
  args: {
    clientId: v.id('clients'),
    name: v.optional(v.string()),
    projectKey: v.optional(v.string()),
    website: v.optional(v.string()),
    isInternal: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to update clients');
    }

    // Get existing client
    const existingClient = await ctx.db.get(args.clientId);
    if (!existingClient) {
      throw new Error('Client not found');
    }

    // Validate name uniqueness if name is being changed
    if (args.name && args.name !== existingClient.name) {
      const nameConflict = await ctx.db
        .query('clients')
        .withIndex('by_name', (q) => q.eq('name', args.name!))
        .first();

      if (nameConflict) {
        throw new Error('A client with this name already exists');
      }
    }

    // Validate project key if being changed
    if (args.projectKey && args.projectKey !== existingClient.projectKey) {
      const projectKey = args.projectKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (projectKey.length < 4 || projectKey.length > 6) {
        throw new Error('Project key must be 4-6 alphanumeric characters');
      }

      const keyConflict = await ctx.db
        .query('clients')
        .withIndex('by_project_key', (q) => q.eq('projectKey', projectKey))
        .first();

      if (keyConflict && keyConflict._id !== args.clientId) {
        throw new Error(`Project key "${projectKey}" is already in use`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.projectKey !== undefined) updateData.projectKey = args.projectKey.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (args.website !== undefined) updateData.website = args.website;
    if (args.isInternal !== undefined) updateData.isInternal = args.isInternal;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.clientId, updateData);
    return args.clientId;
  },
});

// Soft delete client with dependency checks
export const deleteClient = mutation({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete clients');
    }

    // Check for departments (departments inherit client status)
    const departments = await ctx.db
      .query('departments')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    if (departments.length > 0) {
      throw new Error('Cannot delete client with departments. Please delete departments first.');
    }

    // Check for active projects
    const activeProjects = await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .filter((q) => q.neq(q.field('status'), 'complete'))
      .collect();

    if (activeProjects.length > 0) {
      throw new Error('Cannot delete client with active projects. Please complete projects first.');
    }

    // Soft delete by setting status to archived
    await ctx.db.patch(args.clientId, {
      status: 'archived',
      updatedAt: Date.now(),
    });

    return args.clientId;
  },
});

// Get single client by ID with departments
export const getClientById = query({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Get client's departments
    const departments = await ctx.db
      .query('departments')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    return {
      ...client,
      departments: departments,
      departmentCount: departments.length,
      activeDepartmentCount: departments.length, // Departments inherit client status
    };
  },
});

// List clients with pagination and filters
export const listClients = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let clients;

    // Apply status filter
    if (args.status) {
      clients = await ctx.db
        .query('clients')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else {
      clients = await ctx.db.query('clients').collect();
    }

    // Apply limit
    if (args.limit) {
      clients = clients.slice(0, args.limit);
    }

    // Apply limit
    if (args.limit) {
      clients = clients.slice(0, args.limit);
    }

    // Get department counts for each client
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const departments = await ctx.db
          .query('departments')
          .withIndex('by_client', (q) => q.eq('clientId', client._id))
          .collect();

        const projects = await ctx.db
          .query('projects')
          .withIndex('by_client', (q) => q.eq('clientId', client._id))
          .collect();

        return {
          ...client,
          departmentCount: departments.length,
          activeDepartmentCount: departments.length, // Departments inherit client status
          projectCount: projects.length,
          activeProjectCount: projects.filter(p => ['ready_for_work', 'in_progress'].includes(p.status)).length,
        };
      })
    );

    return clientsWithStats;
  },
});

// Get client dashboard data with comprehensive metrics
export const getClientDashboard = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser) {
      throw new Error('User not found');
    }

    // Get clients with role-based filtering
    let clients;
    if (currentUser.role === 'client') {
      // Clients can only see their own data
      if (!currentUser.clientId) throw new Error('Client user must have clientId');
      const client = await ctx.db.get(currentUser.clientId);
      clients = client ? [client] : [];
    } else {
      // Admin and PM can see all clients
      if (args.status) {
        clients = await ctx.db
          .query('clients')
          .withIndex('by_status', (q) => q.eq('status', args.status!))
          .collect();
      } else {
        clients = await ctx.db.query('clients').collect();
      }
    }

    // Get comprehensive data for each client
    const clientsWithData = await Promise.all(
      clients.map(async (client) => {
        // Get departments
        const departments = await ctx.db
          .query('departments')
          .withIndex('by_client', (q) => q.eq('clientId', client._id))
          .collect();

        // Get projects
        const projects = await ctx.db
          .query('projects')
          .withIndex('by_client', (q) => q.eq('clientId', client._id))
          .collect();

        // Get team members (users assigned to this client)
        const teamMembers = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('clientId'), client._id))
          .collect();

        // Get tasks across all projects for this client
        const allTasks = await Promise.all(
          projects.map(async (project) => {
            return await ctx.db
              .query('tasks')
              .withIndex('by_project', (q) => q.eq('projectId', project._id))
              .collect();
          })
        );
        const tasks = allTasks.flat();

        // Calculate project metrics (simplified - could be enhanced with budget data)
        const totalBudget = 0; // Budget field doesn't exist in current schema

        // Get recent activity (last updated project or task)
        const allActivities = [
          ...projects.map(p => ({ type: 'project', date: p.updatedAt, name: p.title })),
          ...tasks.map(t => ({ type: 'task', date: t.updatedAt, name: t.title }))
        ];
        const recentActivity = allActivities
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

        // Calculate project status distribution (using correct schema status values)
        const projectsByStatus = {
          new: projects.filter(p => p.status === 'new').length,
          planning: projects.filter(p => p.status === 'planning').length,
          ready_for_work: projects.filter(p => p.status === 'ready_for_work').length,
          in_progress: projects.filter(p => p.status === 'in_progress').length,
          client_review: projects.filter(p => p.status === 'client_review').length,
          client_approved: projects.filter(p => p.status === 'client_approved').length,
          complete: projects.filter(p => p.status === 'complete').length,
        };

        return {
          ...client,
          departments,
          projects,
          teamMembers: teamMembers.filter(u => u.status === 'active'),
          metrics: {
            departmentCount: departments.length,
            activeDepartmentCount: departments.length, // Departments inherit client status
            projectCount: projects.length,
            activeProjectCount: projects.filter(p => ['ready_for_work', 'in_progress'].includes(p.status)).length,
            completedProjectCount: projects.filter(p => p.status === 'complete').length,
            teamMemberCount: teamMembers.filter(u => u.status === 'active').length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            totalBudget,
            projectsByStatus,
          },
          recentActivity,
          lastUpdated: Math.max(
            client.updatedAt,
            ...projects.map(p => p.updatedAt),
            ...tasks.map(t => t.updatedAt)
          ),
        };
      })
    );

    // Calculate overall dashboard stats
    const dashboardStats = {
      totalClients: clientsWithData.length,
      activeClients: clientsWithData.filter(c => c.status === 'active').length,
      totalProjects: clientsWithData.reduce((sum, c) => sum + c.metrics.projectCount, 0),
      activeProjects: clientsWithData.reduce((sum, c) => sum + c.metrics.activeProjectCount, 0),
      totalTeamMembers: clientsWithData.reduce((sum, c) => sum + c.metrics.teamMemberCount, 0),
      totalRevenue: clientsWithData.reduce((sum, c) => sum + c.metrics.totalBudget, 0),
    };

    return {
      clients: clientsWithData.sort((a, b) => b.lastUpdated - a.lastUpdated),
      dashboardStats,
    };
  },
});

// Get client statistics
export const getClientStats = query({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    const departments = await ctx.db
      .query('departments')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    const projects = await ctx.db
      .query('projects')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    // Calculate total workstreams across all departments
    const totalWorkstreams = departments.reduce((sum, dept) => {
      return sum + dept.workstreamCount;
    }, 0);

    return {
      client,
      stats: {
        departmentCount: departments.length,
        activeDepartmentCount: departments.length, // Departments inherit client status
        projectCount: projects.length,
        activeProjectCount: projects.filter(p => ['ready_for_work', 'in_progress'].includes(p.status)).length,
        completedProjectCount: projects.filter(p => p.status === 'complete').length,
        totalWorkstreams: totalWorkstreams,
      },
    };
  },
});

// Get client dashboard KPIs
export const getClientDashboardKPIs = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to view client KPIs');
    }

    const clients = await ctx.db.query('clients').collect();
    const projects = await ctx.db.query('projects').collect();

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    return {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalProjects: projects.length,
      newClientsThisMonth: clients.filter(c => c.createdAt >= currentMonth.getTime()).length,
    };
  },
});

// Return counts of affected records for delete confirmation UI
export const getClientDeletionSummary = query({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') throw new Error('Insufficient permissions');

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error('Client not found');

    const projects = await ctx.db.query('projects').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const tasks = await ctx.db.query('tasks').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const users = await ctx.db.query('users').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();

    return {
      projectCount: projects.length,
      taskCount: tasks.length,
      teamMemberCount: users.length,
    };
  },
});

// Soft delete (archive) client. Hides from active lists and preserves relations
export const archiveClient = mutation({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') throw new Error('Only admins can archive clients');

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error('Client not found');

    await ctx.db.patch(args.clientId, { status: 'archived', updatedAt: Date.now() });

    const projects = await ctx.db.query('projects').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const tasks = await ctx.db.query('tasks').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const users = await ctx.db.query('users').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();

    await ctx.db.insert('clientDeletionAudits', {
      clientId: args.clientId,
      adminUserId: userId as Id<'users'>,
      action: 'archive',
      summary: { projectCount: projects.length, taskCount: tasks.length, teamMemberCount: users.length },
      timestamp: Date.now(),
    } as any);

    return { success: true } as const;
  },
});

// Permanently delete client and cascade according to strict order
export const deleteClientPermanently = mutation({
  args: { clientId: v.id('clients') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') throw new Error('Only admins can permanently delete clients');

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error('Client not found');

    // Build summary up-front
    const projects = await ctx.db.query('projects').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const tasks = await ctx.db.query('tasks').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
    const users = await ctx.db.query('users').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();

    try {
      // Order:
      // 1) Delete all prose_syncs linked to project_briefs → in our system, ProseMirror docs are managed by sync API.
      //    We ensure cleanup by deleting documentPages and documents; ProseMirror store cleans up by orphan detection.
      // 2) Delete all pages linked to project_briefs (documentPages)
      // 3) Delete all project_briefs documents
      for (const project of projects) {
        if (project.documentId) {
          const docRecord = await ctx.db.get(project.documentId);
          // Delete document pages
          const pages = await ctx.db
            .query('documentPages')
            .withIndex('by_document', (q) => q.eq('documentId', project.documentId))
            .collect();
          for (const page of pages) {
            // Also delete manual saves for this page's docId
            if (page.docId) {
              const saves = await ctx.db.query('manualSaves').withIndex('by_docId', (q) => q.eq('docId', page.docId)).collect();
              for (const save of saves) await ctx.db.delete(save._id);
            }
            await ctx.db.delete(page._id);
          }

          // Delete document status audits
          const audits = await ctx.db.query('documentStatusAudits').withIndex('by_document', (q) => q.eq('documentId', project.documentId)).collect();
          for (const audit of audits) await ctx.db.delete(audit._id);

          // Delete comment threads and comments for this document
          const docIdString = (project.documentId as unknown as string);
          const threads = await ctx.db.query('commentThreads').withIndex('by_doc', (q) => q.eq('docId', docIdString)).collect();
          for (const thread of threads) {
            const comments = await ctx.db.query('comments').withIndex('by_thread', (q) => q.eq('threadId', thread.id)).collect();
            for (const c of comments) await ctx.db.delete(c._id);
            await ctx.db.delete(thread._id);
          }

          // Finally delete the document if it still exists
          if (docRecord) {
            await ctx.db.delete(project.documentId);
          }
        }
      }

      // 4) Delete all tasks associated with the client's projects
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }

      // 5) Delete all projects associated with the client
      for (const project of projects) {
        await ctx.db.delete(project._id);
      }

      // 6) Unlink (not delete) any users associated with the client
      for (const u of users) {
        await ctx.db.patch(u._id, { clientId: undefined, updatedAt: Date.now() });
      }

      // Also delete departments for the client
      const departments = await ctx.db.query('departments').withIndex('by_client', (q) => q.eq('clientId', args.clientId)).collect();
      for (const dept of departments) {
        await ctx.db.delete(dept._id);
      }

      // 7) Delete the client record
      await ctx.db.delete(args.clientId);

      // Log
      await ctx.db.insert('clientDeletionAudits', {
        clientId: args.clientId,
        adminUserId: userId as Id<'users'>,
        action: 'delete',
        summary: { projectCount: projects.length, taskCount: tasks.length, teamMemberCount: users.length },
        timestamp: Date.now(),
      } as any);

      return { success: true } as const;
    } catch (error) {
      console.error('Failed to permanently delete client:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to permanently delete client');
    }
  },
});





// Get only external clients
export const listExternalClients = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const allClients = await ctx.db.query('clients').collect();
    const externalClients = allClients.filter(client => !client.isInternal);

    if (args.status) {
      return externalClients.filter(client => client.status === args.status);
    }

    return externalClients;
  },
});

// Get only internal clients
export const listInternalClients = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const allClients = await ctx.db.query('clients').collect();
    const internalClients = allClients.filter(client => client.isInternal);

    if (args.status) {
      return internalClients.filter(client => client.status === args.status);
    }

    return internalClients;
  },
});

// Get storage URL for client logo
export const getLogoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const getClientDashboardById = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error("Client not found");

    // Clients can only see their own data
    if (user.role === "client" && user.clientId !== args.clientId) {
      throw new Error("Permission denied");
    }

    // Departments for client
    const departments = await ctx.db
      .query("departments")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Projects for client
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => [
      "ready_for_work",
      "in_progress",
    ].includes(p.status));
    const upcomingProjects = projects.filter((p) => ["new", "planning"].includes(p.status));

    // Compute average progress based on tasks per project
    const allTasks = await ctx.db.query("tasks").withIndex("by_client", (q) => q.eq("clientId", args.clientId)).collect();
    const tasksByProject = new Map<string, { total: number; done: number }>();
    for (const task of allTasks) {
      const projectId = (task.projectId as any) as string | undefined;
      if (!projectId) continue;
      const current = tasksByProject.get(projectId) || { total: 0, done: 0 };
      current.total += 1;
      if (task.status === "done") current.done += 1;
      tasksByProject.set(projectId, current);
    }
    const projectProgressValues: number[] = [];
    for (const p of projects) {
      const stats = tasksByProject.get((p._id as any) as string);
      if (stats && stats.total > 0) {
        projectProgressValues.push((stats.done / stats.total) * 100);
      }
    }
    const averageProgress = projectProgressValues.length > 0
      ? projectProgressValues.reduce((sum, v) => sum + v, 0) / projectProgressValues.length
      : 0;

    // Sprints for client (use by_client index)
    const allSprints = await ctx.db
      .query("sprints")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    const activeSprints = allSprints.filter((s) => s.status === "active");
    const planningSprints = allSprints.filter((s) => s.status === "planning");

    // Team members: users assigned to this client
    const teamMembers = await ctx.db
      .query("users")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    return {
      client,
      departments,
      stats: {
        totalProjects,
        activeProjectsCount: activeProjects.length,
        atRiskProjects: projects.filter((p) => p.status === 'client_review' || (p.targetDueDate && p.targetDueDate < Date.now() + 7 * 24 * 60 * 60 * 1000)).length,
        activeSprintCapacityHours: allSprints.filter((s) => s.status === 'active').reduce((sum, s) => sum + (s.totalCapacity || 0), 0),
        activeSprintCommittedHours: 0,
        upcomingProjectsCount: upcomingProjects.length,
        averageProgress,
        totalTeamMembers: teamMembers.filter((u) => u.status === "active").length,
        activeSprintsCount: activeSprints.length,
        planningSprintsCount: planningSprints.length,
      },
      activeProjects: activeProjects.slice(0, 5),
      upcomingProjects: upcomingProjects.slice(0, 5),
      activeSprints: activeSprints.slice(0, 5),
      planningSprints: planningSprints.slice(0, 5),
    };
  },
});

// Get active items for a client (projects and sprints)
export const getClientActiveItems = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.role === "client" && user.clientId !== args.clientId) {
      throw new Error("Permission denied");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const activeProjects = projects.filter((p) => ["ready_for_work", "in_progress"].includes(p.status));

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const activeSprints = sprints.filter((s) => s.status === "active");

    // Enrich with progress for projects
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const tasksByProject = new Map<string, { total: number; done: number }>();
    for (const task of tasks) {
      const pid = (task.projectId as any) as string | undefined;
      if (!pid) continue;
      const agg = tasksByProject.get(pid) || { total: 0, done: 0 };
      agg.total += 1;
      if (task.status === "done") agg.done += 1;
      tasksByProject.set(pid, agg);
    }

    const activeProjectsEnriched = await Promise.all(
      activeProjects.map(async (p) => {
        const department = await ctx.db.get(p.departmentId);
        const progressStats = tasksByProject.get((p._id as any) as string);
        const progress = progressStats && progressStats.total > 0
          ? Math.round((progressStats.done / progressStats.total) * 100)
          : 0;
        return { ...p, department, progress } as any;
      })
    );

    const activeSprintsEnriched = await Promise.all(
      activeSprints.map(async (s) => {
        const department = await ctx.db.get(s.departmentId);
        return { ...s, department } as any;
      })
    );

    return {
      projects: activeProjectsEnriched,
      sprints: activeSprintsEnriched,
    };
  },
});

// Get upcoming items for a client
export const getClientUpcomingItems = query({
  args: {
    clientId: v.id("clients"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (user.role === "client" && user.clientId !== args.clientId) {
      throw new Error("Permission denied");
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const upcomingProjects = projects.filter((p) => ["new", "planning"].includes(p.status));

    const sprints = await ctx.db
      .query("sprints")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
    const planningSprints = sprints.filter((s) => s.status === "planning");

    const upcomingProjectsEnriched = await Promise.all(
      upcomingProjects.map(async (p) => {
        const department = await ctx.db.get(p.departmentId);
        return { ...p, department } as any;
      })
    );

    const planningSprintsEnriched = await Promise.all(
      planningSprints.map(async (s) => {
        const department = await ctx.db.get(s.departmentId);
        return { ...s, department } as any;
      })
    );

    return {
      projects: upcomingProjectsEnriched,
      sprints: planningSprintsEnriched,
    };
  },
});