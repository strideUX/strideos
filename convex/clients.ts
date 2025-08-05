import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Client creation with validation
export const createClient = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal('startup'),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('enterprise')
    )),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
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

    // Validate email format if provided
    if (args.contactEmail && !isValidEmail(args.contactEmail)) {
      throw new Error('Invalid email format');
    }

    // Create the client
    const clientId = await ctx.db.insert('clients', {
      name: args.name,
      description: args.description,
      industry: args.industry,
      size: args.size,
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      website: args.website,
      address: args.address,
      status: 'active',
      timezone: args.timezone,
      currency: args.currency,
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
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal('startup'),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('enterprise')
    )),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    address: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
      country: v.optional(v.string()),
    })),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('archived')
    )),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
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

    // Validate email format if provided
    if (args.contactEmail && !isValidEmail(args.contactEmail)) {
      throw new Error('Invalid email format');
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.industry !== undefined) updateData.industry = args.industry;
    if (args.size !== undefined) updateData.size = args.size;
    if (args.contactEmail !== undefined) updateData.contactEmail = args.contactEmail;
    if (args.contactPhone !== undefined) updateData.contactPhone = args.contactPhone;
    if (args.website !== undefined) updateData.website = args.website;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.timezone !== undefined) updateData.timezone = args.timezone;
    if (args.currency !== undefined) updateData.currency = args.currency;

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

    // Check for active departments
    const activeDepartments = await ctx.db
      .query('departments')
      .withIndex('by_client_status', (q) => q.eq('clientId', args.clientId).eq('status', 'active'))
      .collect();

    if (activeDepartments.length > 0) {
      throw new Error('Cannot delete client with active departments. Please deactivate departments first.');
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
      activeDepartmentCount: departments.filter(d => d.status === 'active').length,
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
    industry: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal('startup'),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('enterprise')
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

    // Apply additional filters
    if (args.industry) {
      clients = clients.filter(c => c.industry === args.industry);
    }

    if (args.size) {
      clients = clients.filter(c => c.size === args.size);
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
          activeDepartmentCount: departments.filter(d => d.status === 'active').length,
          projectCount: projects.length,
          activeProjectCount: projects.filter(p => p.status === 'active').length,
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
    industry: v.optional(v.string()),
    size: v.optional(v.union(
      v.literal('startup'),
      v.literal('small'),
      v.literal('medium'),
      v.literal('large'),
      v.literal('enterprise')
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

    // Apply filters
    if (args.industry) {
      clients = clients.filter(c => c.industry === args.industry);
    }
    if (args.size) {
      clients = clients.filter(c => c.size === args.size);
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
          draft: projects.filter(p => p.status === 'draft').length,
          active: projects.filter(p => p.status === 'active').length,
          review: projects.filter(p => p.status === 'review').length,
          complete: projects.filter(p => p.status === 'complete').length,
          archived: projects.filter(p => p.status === 'archived').length,
        };

        return {
          ...client,
          departments,
          projects,
          teamMembers: teamMembers.filter(u => u.status === 'active'),
          metrics: {
            departmentCount: departments.length,
            activeDepartmentCount: departments.filter(d => d.status === 'active').length,
            projectCount: projects.length,
            activeProjectCount: projects.filter(p => p.status === 'active').length,
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
      availableIndustries: Array.from(new Set(clients.map(c => c.industry).filter(Boolean))),
      availableSizes: Array.from(new Set(clients.map(c => c.size).filter(Boolean))),
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

    // Calculate total capacity across all departments
    const totalCapacity = departments.reduce((sum, dept) => {
      return sum + (dept.workstreamCount * dept.workstreamCapacity);
    }, 0);

    return {
      client,
      stats: {
        departmentCount: departments.length,
        activeDepartmentCount: departments.filter(d => d.status === 'active').length,
        projectCount: projects.length,
        activeProjectCount: projects.filter(p => p.status === 'active').length,
        completedProjectCount: projects.filter(p => p.status === 'complete').length,
        totalCapacity: totalCapacity,
        averageSprintDuration: departments.length > 0 
          ? departments.reduce((sum, d) => sum + d.sprintDuration, 0) / departments.length 
          : 0,
      },
    };
  },
});

// Helper function for email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 