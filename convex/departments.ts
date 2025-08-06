import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Department creation with team assignment
export const createDepartment = mutation({
  args: {
    name: v.string(),
    clientId: v.id('clients'),
    primaryContactId: v.id('users'),
    leadId: v.id('users'),
    teamMemberIds: v.array(v.id('users')),
    workstreamCount: v.number(),
    slackChannelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to create departments');
    }

    // Validate client exists and is active
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    if (client.status !== 'active') {
      throw new Error('Cannot create department for inactive client');
    }

    // Validate department name uniqueness within client
    const existingDepartment = await ctx.db
      .query('departments')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .filter((q) => q.eq(q.field('name'), args.name))
      .first();

    if (existingDepartment) {
      throw new Error('A department with this name already exists for this client');
    }

    // Validate workstream count
    if (args.workstreamCount <= 0) {
      throw new Error('Workstream count must be greater than 0');
    }

    // Validate user assignments
    const primaryContact = await ctx.db.get(args.primaryContactId);
    if (!primaryContact) {
      throw new Error('Primary contact not found');
    }

    const lead = await ctx.db.get(args.leadId);
    if (!lead) {
      throw new Error('Department lead not found');
    }

    // Validate team members
    for (const memberId of args.teamMemberIds) {
      const member = await ctx.db.get(memberId);
      if (!member) {
        throw new Error(`Team member with ID ${memberId} not found`);
      }
    }

    // Create the department
    const departmentId = await ctx.db.insert('departments', {
      name: args.name,
      clientId: args.clientId,
      primaryContactId: args.primaryContactId,
      leadId: args.leadId,
      teamMemberIds: args.teamMemberIds,
      workstreamCount: args.workstreamCount,
      slackChannelId: args.slackChannelId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return departmentId;
  },
});

// Update department with validation
export const updateDepartment = mutation({
  args: {
    departmentId: v.id('departments'),
    name: v.optional(v.string()),
    primaryContactId: v.optional(v.id('users')),
    leadId: v.optional(v.id('users')),
    teamMemberIds: v.optional(v.array(v.id('users'))),
    workstreamCount: v.optional(v.number()),
    slackChannelId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to update departments');
    }

    // Get existing department
    const existingDepartment = await ctx.db.get(args.departmentId);
    if (!existingDepartment) {
      throw new Error('Department not found');
    }

    // Validate name uniqueness if name is being changed
    if (args.name && args.name !== existingDepartment.name) {
      const nameConflict = await ctx.db
        .query('departments')
        .withIndex('by_client', (q) => q.eq('clientId', existingDepartment.clientId))
        .filter((q) => q.eq(q.field('name'), args.name!))
        .first();

      if (nameConflict) {
        throw new Error('A department with this name already exists for this client');
      }
    }

    // Validate workstream count
    if (args.workstreamCount !== undefined && args.workstreamCount <= 0) {
      throw new Error('Workstream count must be greater than 0');
    }

    // Validate user assignments if provided
    if (args.primaryContactId !== undefined) {
      const primaryContact = await ctx.db.get(args.primaryContactId);
      if (!primaryContact) {
        throw new Error('Primary contact not found');
      }
    }

    if (args.leadId !== undefined) {
      const lead = await ctx.db.get(args.leadId);
      if (!lead) {
        throw new Error('Department lead not found');
      }
    }

    if (args.teamMemberIds !== undefined) {
      for (const memberId of args.teamMemberIds) {
        const member = await ctx.db.get(memberId);
        if (!member) {
          throw new Error(`Team member with ID ${memberId} not found`);
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.primaryContactId !== undefined) updateData.primaryContactId = args.primaryContactId;
    if (args.leadId !== undefined) updateData.leadId = args.leadId;
    if (args.teamMemberIds !== undefined) updateData.teamMemberIds = args.teamMemberIds;
    if (args.workstreamCount !== undefined) updateData.workstreamCount = args.workstreamCount;
    if (args.slackChannelId !== undefined) updateData.slackChannelId = args.slackChannelId;

    await ctx.db.patch(args.departmentId, updateData);
    return args.departmentId;
  },
});

// Hard delete department with dependency checks
export const deleteDepartment = mutation({
  args: {
    departmentId: v.id('departments'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can delete departments');
    }

    // Check for active projects
    const activeProjects = await ctx.db
      .query('projects')
      .withIndex('by_department', (q) => q.eq('departmentId', args.departmentId))
      .filter((q) => q.neq(q.field('status'), 'complete'))
      .collect();

    if (activeProjects.length > 0) {
      throw new Error('Cannot delete department with active projects. Please complete projects first.');
    }

    // Hard delete the department
    await ctx.db.delete(args.departmentId);

    return args.departmentId;
  },
});

// Get single department by ID with team info
export const getDepartmentById = query({
  args: { departmentId: v.id('departments') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const department = await ctx.db.get(args.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    // Get department's client
    const client = await ctx.db.get(department.clientId);

    // Get department's projects
    const projects = await ctx.db
      .query('projects')
      .withIndex('by_department', (q) => q.eq('departmentId', args.departmentId))
      .collect();

    // Get user details
    const primaryContact = await ctx.db.get(department.primaryContactId);
    const lead = await ctx.db.get(department.leadId);
    const teamMembers = await Promise.all(
      department.teamMemberIds.map(id => ctx.db.get(id))
    );

    return {
      ...department,
      client: client,
      projects: projects,
      primaryContact: primaryContact,
      lead: lead,
      teamMembers: teamMembers.filter(Boolean),
      projectCount: projects.length,
      activeProjectCount: projects.filter(p => p.status === 'active').length,
    };
  },
});

// List all departments (admin only)
export const listDepartments = query({
  args: {},
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Insufficient permissions to list all departments');
    }

    const departments = await ctx.db
      .query('departments')
      .collect();

    // Get client and project counts for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (department) => {
        const client = await ctx.db.get(department.clientId);
        const projects = await ctx.db
          .query('projects')
          .withIndex('by_department', (q) => q.eq('departmentId', department._id))
          .collect();

        return {
          ...department,
          client: client ? { _id: client._id, name: client.name, status: client.status } : null,
          projectCount: projects.length,
          activeProjectCount: projects.filter(p => p.status === 'active').length,
        };
      })
    );

    return departmentsWithStats;
  },
});

// List departments by client
export const listDepartmentsByClient = query({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const departments = await ctx.db
      .query('departments')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    // Get project counts and user info for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (department) => {
        const projects = await ctx.db
          .query('projects')
          .withIndex('by_department', (q) => q.eq('departmentId', department._id))
          .collect();

        // Get user details
        const primaryContact = await ctx.db.get(department.primaryContactId);
        const lead = await ctx.db.get(department.leadId);
        const teamMembers = await Promise.all(
          department.teamMemberIds.map(id => ctx.db.get(id))
        );

        return {
          ...department,
          primaryContact: primaryContact ? { _id: primaryContact._id, name: primaryContact.name, email: primaryContact.email } : null,
          lead: lead ? { _id: lead._id, name: lead.name, email: lead.email } : null,
          teamMembers: teamMembers.filter(Boolean).map(user => ({ 
            _id: user!._id, 
            name: user!.name, 
            email: user!.email 
          })),
          projectCount: projects.length,
          activeProjectCount: projects.filter(p => p.status === 'active').length,
        };
      })
    );

    return departmentsWithStats;
  },
});





// List all departments (for admin use)
export const listAllDepartments = query({
  args: {},
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const departments = await ctx.db.query('departments').collect();
    return departments;
  },
});

// Get users for department assignment
export const getUsersForDepartmentAssignment = query({
  args: {
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get all users for this client
    const clientUsers = await ctx.db
      .query('users')
      .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
      .collect();

    // Get all admin/pm users (internal users)
    const internalUsers = await ctx.db
      .query('users')
      .withIndex('by_role_status', (q) => q.eq('role', 'admin').eq('status', 'active'))
      .collect();

    const pmUsers = await ctx.db
      .query('users')
      .withIndex('by_role_status', (q) => q.eq('role', 'pm').eq('status', 'active'))
      .collect();

    const allInternalUsers = [...internalUsers, ...pmUsers];

    return {
      clientUsers: clientUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
      internalUsers: allInternalUsers.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    };
  },
});

// Helper functions
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
} 