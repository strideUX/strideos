import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to generate invitation token
function generateInvitationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Create a new user (admin only)
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    ),
    jobTitle: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    clientId: v.optional(v.id('clients')),
    departmentIds: v.optional(v.array(v.id('departments'))),
    sendInvitation: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to create users');
    }

    // Validate email format
    if (!isValidEmail(args.email)) {
      throw new Error('Invalid email format');
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email))
      .first();
    
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Validate client assignment if provided
    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client) {
        throw new Error('Invalid client ID');
      }
    }

    // Validate department assignments if provided
    if (args.departmentIds && args.departmentIds.length > 0) {
      for (const deptId of args.departmentIds) {
        const department = await ctx.db.get(deptId);
        if (!department) {
          throw new Error(`Invalid department ID: ${deptId}`);
        }
        // Ensure department belongs to the assigned client
        if (args.clientId && department.clientId !== args.clientId) {
          throw new Error(`Department ${deptId} does not belong to the assigned client`);
        }
      }
    }

    const now = Date.now();
    const userData = {
      email: args.email,
      name: args.name,
      role: args.role,
      status: (args.sendInvitation ? 'invited' : 'active') as 'active' | 'inactive' | 'invited',
      jobTitle: args.jobTitle,
      bio: args.bio,
      timezone: args.timezone,
      preferredLanguage: args.preferredLanguage,
      clientId: args.clientId,
      departmentIds: args.departmentIds,
      invitedBy: args.sendInvitation ? userId : undefined,
      invitedAt: args.sendInvitation ? now : undefined,
      invitationToken: args.sendInvitation ? generateInvitationToken() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    const newUserId = await ctx.db.insert('users', userData);

    // TODO: Send invitation email if sendInvitation is true
    // This would integrate with an email service

    return {
      userId: newUserId,
      message: args.sendInvitation ? 'User invited successfully' : 'User created successfully',
    };
  },
});

// Update an existing user (admin only)
export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    name: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('invited')
    )),
    jobTitle: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    clientId: v.optional(v.id('clients')),
    departmentIds: v.optional(v.array(v.id('departments'))),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to update users');
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Prevent admin from deactivating themselves
    if (args.userId === currentUserId && args.status === 'inactive') {
      throw new Error('Cannot deactivate your own account');
    }

    // Validate client assignment if provided
    if (args.clientId) {
      const client = await ctx.db.get(args.clientId);
      if (!client) {
        throw new Error('Invalid client ID');
      }
    }

    // Validate department assignments if provided
    if (args.departmentIds && args.departmentIds.length > 0) {
      for (const deptId of args.departmentIds) {
        const department = await ctx.db.get(deptId);
        if (!department) {
          throw new Error(`Invalid department ID: ${deptId}`);
        }
        // Ensure department belongs to the assigned client
        if (args.clientId && department.clientId !== args.clientId) {
          throw new Error(`Department ${deptId} does not belong to the assigned client`);
        }
      }
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Only update provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.role !== undefined) updateData.role = args.role;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.jobTitle !== undefined) updateData.jobTitle = args.jobTitle;
    if (args.bio !== undefined) updateData.bio = args.bio;
    if (args.timezone !== undefined) updateData.timezone = args.timezone;
    if (args.preferredLanguage !== undefined) updateData.preferredLanguage = args.preferredLanguage;
    if (args.clientId !== undefined) updateData.clientId = args.clientId;
    if (args.departmentIds !== undefined) updateData.departmentIds = args.departmentIds;

    await ctx.db.patch(args.userId, updateData);

    return { message: 'User updated successfully' };
  },
});

// Delete a user (admin only, soft delete)
export const deleteUser = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to delete users');
    }

    // Prevent admin from deleting themselves
    if (args.userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check for dependencies (assigned tasks, etc.)
    const assignedTasks = await ctx.db
      .query('tasks')
      .withIndex('by_assignee', (q) => q.eq('assigneeId', args.userId))
      .collect();
    
    if (assignedTasks.length > 0) {
      throw new Error(`Cannot delete user: ${assignedTasks.length} tasks are assigned to this user`);
    }

    // Soft delete by setting status to inactive
    await ctx.db.patch(args.userId, {
      status: 'inactive',
      updatedAt: Date.now(),
    });

    return { message: 'User deactivated successfully' };
  },
});

// Get a single user by ID
export const getUserById = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get client and department details
    let client = null;
    let departments: any[] = [];

    if (user.clientId) {
      client = await ctx.db.get(user.clientId);
    }

    if (user.departmentIds && user.departmentIds.length > 0) {
      departments = await Promise.all(
        user.departmentIds.map(async (deptId) => {
          const dept = await ctx.db.get(deptId);
          return dept ? { ...dept, _id: deptId } : null;
        })
      );
      departments = departments.filter(Boolean);
    }

    return {
      ...user,
      client,
      departments,
    };
  },
});

// List all users with optional filters
export const listUsers = query({
  args: {
    role: v.optional(v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('invited')
    )),
    clientId: v.optional(v.id('clients')),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to view users');
    }

    let users = await ctx.db.query('users').collect();

    // Apply filters
    if (args.role) {
      users = users.filter(user => user.role === args.role);
    }

    if (args.status) {
      users = users.filter(user => user.status === args.status);
    }

    if (args.clientId) {
      users = users.filter(user => user.clientId === args.clientId);
    }

    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      users = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.jobTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by name
    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Get client and department details for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        let client = null;
        let departments: any[] = [];

        if (user.clientId) {
          client = await ctx.db.get(user.clientId);
        }

        if (user.departmentIds && user.departmentIds.length > 0) {
          departments = await Promise.all(
            user.departmentIds.map(async (deptId) => {
              const dept = await ctx.db.get(deptId);
              return dept ? { ...dept, _id: deptId } : null;
            })
          );
          departments = departments.filter(Boolean);
        }

        return {
          ...user,
          client,
          departments,
        };
      })
    );

    return usersWithDetails;
  },
});

// Get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const currentUser = await ctx.db.get(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to view user statistics');
    }

    const allUsers = await ctx.db.query('users').collect();

    const stats = {
      total: allUsers.length,
      active: allUsers.filter(u => u.status === 'active').length,
      inactive: allUsers.filter(u => u.status === 'inactive').length,
      invited: allUsers.filter(u => u.status === 'invited').length,
      byRole: {
        admin: allUsers.filter(u => u.role === 'admin').length,
        pm: allUsers.filter(u => u.role === 'pm').length,
        task_owner: allUsers.filter(u => u.role === 'task_owner').length,
        client: allUsers.filter(u => u.role === 'client').length,
      },
      assignedToClients: allUsers.filter(u => u.clientId).length,
      assignedToDepartments: allUsers.filter(u => u.departmentIds && u.departmentIds.length > 0).length,
    };

    return stats;
  },
});

// Resend invitation to user
export const resendInvitation = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions to resend invitations');
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.status !== 'invited') {
      throw new Error('User is not in invited status');
    }

    // Generate new invitation token
    const newToken = generateInvitationToken();
    
    await ctx.db.patch(args.userId, {
      invitationToken: newToken,
      invitedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // TODO: Send invitation email with new token
    // This would integrate with an email service

    return { message: 'Invitation resent successfully' };
  },
});

// Bulk operations
export const bulkUpdateUsers = mutation({
  args: {
    userIds: v.array(v.id('users')),
    updates: v.object({
      role: v.optional(v.union(
        v.literal('admin'),
        v.literal('pm'),
        v.literal('task_owner'),
        v.literal('client')
      )),
      status: v.optional(v.union(
        v.literal('active'),
        v.literal('inactive'),
        v.literal('invited')
      )),
      clientId: v.optional(v.id('clients')),
    }),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Insufficient permissions for bulk operations');
    }

    // Prevent bulk operations on self
    if (args.userIds.includes(currentUserId as Id<'users'>)) {
      throw new Error('Cannot perform bulk operations on your own account');
    }

    const updateData = {
      ...args.updates,
      updatedAt: Date.now(),
    };

    // Update each user
    for (const userId of args.userIds) {
      await ctx.db.patch(userId, updateData);
    }

    return { 
      message: `Updated ${args.userIds.length} users successfully`,
      updatedCount: args.userIds.length,
    };
  },
}); 