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

    // Get current organization
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();
    
    if (!organization) {
      throw new Error('Organization not found');
    }


    // Validate client assignment for client users
    if (args.role === 'client' && !args.clientId) {
      throw new Error('Client users must have a clientId assigned');
    }

    const now = Date.now();
    const userData = {
      email: args.email,
      name: args.name,
      role: args.role,
      status: (args.sendInvitation ? 'invited' : 'active') as 'active' | 'inactive' | 'invited',
      organizationId: organization._id,
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

    // Handle invitation email if requested
    if (args.sendInvitation) {
      try {
        // Generate token directly here since we can't call mutations from mutations
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48 hours

        // Store the token
        await ctx.db.insert('passwordResets', {
          userId: newUserId,
          token,
          expiresAt,
          used: false,
          createdAt: Date.now(),
        });
        
        // Schedule email sending action
        await ctx.scheduler.runAfter(0, 'email:sendInvitationEmail' as any, {
          userEmail: args.email,
          userName: args.name,
          inviterName: currentUser.name || 'Admin',
          invitationUrl: `${process.env.APP_URL || 'http://localhost:3000'}/auth/set-password?token=${token}`,
          organizationName: organization.name,
          primaryColor: organization.primaryColor,
          fromEmail: organization.emailFromAddress,
          fromName: organization.emailFromName,
        });
      } catch (error) {
        console.error('Failed to send invitation email:', error);
        // Don't fail the user creation if email fails
      }
    }

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

// Deactivate a user (admin only, soft delete)
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
      throw new Error('Insufficient permissions to deactivate users');
    }

    // Prevent admin from deactivating themselves
    if (args.userId === currentUserId) {
      throw new Error('Cannot deactivate your own account');
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
      throw new Error(`Cannot deactivate user: ${assignedTasks.length} tasks are assigned to this user`);
    }

    // Soft delete by setting status to inactive
    await ctx.db.patch(args.userId, {
      status: 'inactive',
      updatedAt: Date.now(),
    });

    return { message: 'User deactivated successfully' };
  },
});

// Permanently delete a user from database (admin only, hard delete)
export const purgeUser = mutation({
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
      throw new Error('Insufficient permissions to purge users');
    }

    // Prevent admin from purging themselves
    if (args.userId === currentUserId) {
      throw new Error('Cannot purge your own account');
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
      throw new Error(`Cannot purge user: ${assignedTasks.length} tasks are assigned to this user. Please reassign or delete tasks first.`);
    }

    // Clean up related records before deleting user

    // 1. Delete password reset tokens
    const passwordResets = await ctx.db
      .query('passwordResets')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    for (const reset of passwordResets) {
      await ctx.db.delete(reset._id);
    }

    // 2. Delete auth accounts (if any)
    const authAccounts = await ctx.db
      .query('authAccounts')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    for (const account of authAccounts) {
      await ctx.db.delete(account._id);
    }

    // 3. Delete auth sessions (if any)
    const authSessions = await ctx.db
      .query('authSessions')
      .filter((q) => q.eq(q.field('userId'), args.userId))
      .collect();

    for (const session of authSessions) {
      await ctx.db.delete(session._id);
    }

    // 4. Clean up any comments by this user (delete comments)
    const userComments = await ctx.db
      .query('comments')
      .withIndex('by_created_by', (q) => q.eq('createdBy', args.userId))
      .collect();

    for (const comment of userComments) {
      // Delete comments by this user
      await ctx.db.delete(comment._id);
    }

    // 5. Finally, delete the user record
    await ctx.db.delete(args.userId);

    return { message: 'User permanently deleted from system' };
  },
});

// Get the current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
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

// Get user dashboard KPIs
export const getUserDashboardKPIs = query({
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

    // Calculate this month's new users
    const now = Date.now();
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const newUsersThisMonth = allUsers.filter(u => u.createdAt >= oneMonthAgo).length;

    const kpis = {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(u => u.status === 'active').length,
      pendingInvitations: allUsers.filter(u => u.status === 'invited').length,
      clientUsers: allUsers.filter(u => u.role === 'client').length,
      newUsersThisMonth: newUsersThisMonth,
    };

    return kpis;
  },
});

// Get user statistics (legacy - keeping for backward compatibility)
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
    const expiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48 hours
    
    // Store the new token
    await ctx.db.insert('passwordResets', {
      userId: args.userId,
      token: newToken,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });
    
    await ctx.db.patch(args.userId, {
      invitationToken: newToken,
      invitedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Get organization for email settings
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();
    
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Send resend invitation email
    try {
      await ctx.scheduler.runAfter(0, 'email:sendInvitationEmail' as any, {
        userEmail: user.email,
        userName: user.name,
        inviterName: currentUser.name || 'Admin',
        invitationUrl: `${process.env.APP_URL || 'http://localhost:3000'}/auth/set-password?token=${newToken}`,
        organizationName: organization.name,
        primaryColor: organization.primaryColor,
        fromEmail: organization.emailFromAddress,
        fromName: organization.emailFromName,
      });
    } catch (error) {
      console.error('Failed to resend invitation email:', error);
      // Don't fail the operation if email fails
    }

    return { message: 'Invitation resent successfully' };
  },
});

// Get team workload data for capacity planning
export const getTeamWorkload = query({
  args: {
    clientId: v.optional(v.id('clients')),
    departmentId: v.optional(v.id('departments')),
    includeInactive: v.optional(v.boolean()),
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

    // Role-based access control
    let users = await ctx.db.query('users').collect();

    // Filter based on user role
    if (currentUser.role === 'client') {
      // Clients can only see users in their client organization
      if (!currentUser.clientId) throw new Error('Client user must have clientId');
      users = users.filter(user => user.clientId === currentUser.clientId);
    } else if (currentUser.role === 'pm') {
      // PMs can see users in their departments
      if (currentUser.departmentIds && currentUser.departmentIds.length > 0) {
        users = users.filter(user => 
          user.departmentIds?.some(deptId => currentUser.departmentIds?.includes(deptId))
        );
      }
    }
    // Admin can see all users

    // Apply filters
    if (args.clientId) {
      users = users.filter(user => user.clientId === args.clientId);
    }
    if (args.departmentId) {
      users = users.filter(user => user.departmentIds?.includes(args.departmentId!));
    }
    if (!args.includeInactive) {
      users = users.filter(user => user.status === 'active');
    }

    // Get workload data for each user
    const teamWorkload = await Promise.all(
      users.map(async (user) => {
        // Get user's assigned tasks
        const assignedTasks = await ctx.db
          .query('tasks')
          .withIndex('by_assignee', (q) => q.eq('assigneeId', user._id))
          .collect();

        // Calculate workload metrics
        const totalTasks = assignedTasks.length;
        const activeTasks = assignedTasks.filter(task => 
          ['todo', 'in_progress', 'review'].includes(task.status)
        ).length;
        const completedTasks = assignedTasks.filter(task => task.status === 'done').length;
        const overdueTasks = assignedTasks.filter(task => 
          task.dueDate && task.dueDate < Date.now() && task.status !== 'done'
        ).length;

        // Calculate story points
        const totalStoryPoints = assignedTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        const activeStoryPoints = assignedTasks
          .filter(task => ['todo', 'in_progress', 'review'].includes(task.status))
          .reduce((sum, task) => sum + (task.storyPoints || 0), 0);

        // Get user's projects
        const userProjects = await Promise.all(
          [...new Set(assignedTasks.map(task => task.projectId).filter(Boolean))]
            .map(async (projectId) => {
              const project = await ctx.db.get(projectId!);
              return project ? { _id: project._id, title: project.title } : null;
            })
        );
        const projects = userProjects.filter(Boolean);

        // Get client and department info
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

        // Calculate capacity utilization (simplified)
        // This could be enhanced with more sophisticated capacity planning
        const currentWorkload = Math.min(100, (activeStoryPoints / 10) * 100); // Rough calculation
        const capacity = Math.min(100, (totalStoryPoints / 15) * 100); // Overall capacity

        // Determine status based on workload
        let status = 'available';
        if (currentWorkload >= 90) status = 'busy';
        else if (currentWorkload >= 75) status = 'busy';
        else if (user.status !== 'active') status = 'unavailable';

        return {
          ...user,
          client,
          departments,
          projects,
          workload: {
            totalTasks,
            activeTasks,
            completedTasks,
            overdueTasks,
            totalStoryPoints,
            activeStoryPoints,
            currentWorkload: Math.round(currentWorkload),
            capacity: Math.round(capacity),
            status,
          },
        };
      })
    );

    // Sort by name
    teamWorkload.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return teamWorkload;
  },
});

// Local helper for size to hours mapping
function taskSizeToHoursLocalForUsers(size?: string | null): number {
  if (!size) return 0;
  const normalized = size.toUpperCase();
  const map: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
  return map[normalized] ?? 0;
}

// Get team overview with workload calculations
export const getTeamOverview = query({
  args: {
    departmentId: v.optional(v.id("departments")),
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Authentication required");

    // Only admin and PM can view team overview
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Insufficient permissions");
    }

    // Get users based on filters
    let usersQuery = ctx.db.query("users");
    if (args.clientId) {
      usersQuery = usersQuery.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }

    const users = await usersQuery.collect();

    // Filter by department if specified
    let teamMembers = users;
    if (args.departmentId) {
      teamMembers = users.filter((u) => u.departmentIds?.includes(args.departmentId!));
    }

    // Calculate statistics
    const totalMembers = teamMembers.length;
    const activeMembers = teamMembers.filter((u) => u.status === "active").length;

    // Get all active projects
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_status", (q) => q.eq("status", "in_progress"))
      .collect();

    // Get departments
    const departments = await ctx.db.query("departments").collect();

    // Calculate workload for each member
    const membersWithWorkload = await Promise.all(
      teamMembers.map(async (member) => {
        // Get assigned tasks (non-done)
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_assignee", (q) => q.eq("assigneeId", member._id))
          .filter((q) => q.neq(q.field("status"), "done"))
          .collect();

        // Calculate workload (hours)
        const totalHours = tasks.reduce((sum, task) => {
          const hours = task.estimatedHours ?? taskSizeToHoursLocalForUsers(task.size as unknown as string);
          return sum + (hours || 0);
        }, 0);

        // Assuming 40 hours per week capacity
        const weeklyCapacity = 40;
        const workloadPercentage = Math.min(100, Math.round((totalHours / weeklyCapacity) * 100));

        // Get projects this member is working on
        const projectIds = new Set(tasks.map((t) => t.projectId).filter(Boolean) as any[]);
        const memberProjects = projects.filter((p) => projectIds.has(p._id));

        // Get department (pick first if multiple)
        const memberDepartment = departments.find((d) => member.departmentIds?.includes(d._id));

        return {
          ...member,
          totalTasks: tasks.length,
          inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
          totalHours,
          workloadPercentage,
          projects: memberProjects.length,
          department: memberDepartment || null,
        } as any;
      })
    );

    // Calculate average workload
    const averageWorkload =
      membersWithWorkload.length > 0
        ?
          membersWithWorkload.reduce((sum, m: any) => sum + (m.workloadPercentage || 0), 0) /
          membersWithWorkload.length
        : 0;

    // Calculate sprint and project metrics to support Team KPI cards
    // Active sprints
    const activeSprintsList = await ctx.db
      .query("sprints")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    // Completed sprints (for velocity)
    const completedSprintsList = await ctx.db
      .query("sprints")
      .withIndex("by_status", (q) => q.eq("status", "complete"))
      .collect();

    // Average velocity from last 3 completed sprints (hours as proxy for story points)
    const recentCompleted = completedSprintsList
      .sort((a, b) => b.endDate - a.endDate)
      .slice(0, 3);
    let avgVelocity = 0;
    if (recentCompleted.length > 0) {
      const velocities: number[] = [];
      for (const sprint of recentCompleted) {
        const doneTasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .filter((q) => q.eq(q.field("status"), "done"))
          .collect();
        const completedHours = doneTasks.reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? taskSizeToHoursLocalForUsers(t.size as unknown as string)), 0);
        velocities.push(completedHours);
      }
      avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    }

    // All projects: compute active and average progress
    const allProjects = await ctx.db.query("projects").collect();
    const activeProjectsList = allProjects.filter((p) => ["in_progress", "ready_for_work"].includes(p.status));

    // Compute average project progress from tasks
    const allTasks = await ctx.db.query("tasks").collect();
    let avgProjectProgress = 0;
    if (allProjects.length > 0) {
      const progressByProject = new Map<string, number>();
      const projectsWithTasks = new Set<string>();
      for (const project of allProjects) {
        const tasks = allTasks.filter((t) => t.projectId === project._id);
        projectsWithTasks.add(project._id as unknown as string);
        const total = tasks.length;
        const completed = tasks.filter((t) => t.status === "done").length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        progressByProject.set(project._id as unknown as string, progress);
      }
      const sumProgress = Array.from(progressByProject.values()).reduce((a, b) => a + b, 0);
      const denom = progressByProject.size || allProjects.length;
      avgProjectProgress = denom > 0 ? Math.round(sumProgress / denom) : 0;
    }

    // Capacity utilization across active sprints
    const totalCapacityHours = activeSprintsList.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);
    let committedHours = 0;
    for (const sprint of activeSprintsList) {
      const sprintTasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
        .collect();
      committedHours += sprintTasks.reduce((sum, t) => sum + (t.estimatedHours ?? taskSizeToHoursLocalForUsers(t.size as unknown as string)), 0);
    }
    const capacityUtilization = totalCapacityHours > 0 ? Math.round((committedHours / totalCapacityHours) * 100) : 0;

    return {
      stats: {
        // Preserve legacy fields if any consumer relies on them
        totalMembers,
        activeMembers,
        totalProjects: projects.length,
        averageWorkload,
        totalDepartments: departments.length,

        // New KPI metrics
        activeSprints: activeSprintsList.length,
        avgVelocity,
        activeProjects: activeProjectsList.length,
        avgProjectProgress,
        capacityUtilization,
        committedHours,
        totalCapacityHours,
      },
      members: membersWithWorkload,
    };
  },
});

// Get individual team member details
export const getTeamMemberDetails = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const member = await ctx.db.get(args.userId);
    if (!member) throw new Error("User not found");

    // Get current focus (in-progress tasks)
    const inProgressTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .filter((q) => q.eq(q.field("status"), "in_progress"))
      .collect();

    // Get assigned but not started tasks
    const todoTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", args.userId))
      .filter((q) => q.eq(q.field("status"), "todo"))
      .collect();

    // Enrich tasks with project and sprint info
    const enrichTasks = async (tasks: any[]) => {
      return Promise.all(
        tasks.map(async (task) => {
          const project = task.projectId ? await ctx.db.get(task.projectId) : null;
          const sprint = task.sprintId ? await ctx.db.get(task.sprintId) : null;
          return {
            ...task,
            project: project ? { _id: project._id, name: (project as any).title } : null,
            sprint: sprint ? { _id: sprint._id, name: (sprint as any).name } : null,
            hours: task.estimatedHours ?? taskSizeToHoursLocalForUsers(task.size as unknown as string),
          };
        })
      );
    };

    const currentFocus = await enrichTasks(inProgressTasks);
    const upcomingWork = await enrichTasks(todoTasks);

    // Calculate capacity breakdown
    const totalInProgressHours = currentFocus.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
    const totalUpcomingHours = upcomingWork.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);
    const totalHours = totalInProgressHours + totalUpcomingHours;

    return {
      member,
      currentFocus,
      upcomingWork,
      capacityBreakdown: {
        totalHours,
        inProgressHours: totalInProgressHours,
        upcomingHours: totalUpcomingHours,
        weeklyCapacity: 40,
        utilizationPercentage: Math.round(((totalHours || 0) / 40) * 100),
      },
    };
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

// Real-time presence tracking
export const updatePresence = mutation({
  args: {
    page: v.string(),
    lastActive: v.number(),
    status: v.union(v.literal('active'), v.literal('away'), v.literal('busy'), v.literal('offline')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Update user's presence information
    await ctx.db.patch(userId, {
      lastActive: args.lastActive,
      currentPage: args.page,
      presenceStatus: args.status,
    });

    return { success: true };
  },
});

export const getActiveUsers = query({
  args: {
    page: v.optional(v.string()),
    excludeCurrentUser: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000; // 5 minutes
    
    let users = await ctx.db
      .query('users')
      .filter((q) => 
        q.and(
          q.gte(q.field('lastActive'), fiveMinutesAgo),
          q.neq(q.field('presenceStatus'), 'offline')
        )
      )
      .collect();

    // Filter by page if specified
    if (args.page) {
      users = users.filter(user => user.currentPage === args.page);
    }

    // Exclude current user if requested
    if (args.excludeCurrentUser) {
      users = users.filter(user => user._id !== userId);
    }

    return users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: user.presenceStatus || 'active',
      lastActive: user.lastActive,
      currentPage: user.currentPage,
    }));
  },
});

// Get assigned tasks count for a user (for delete confirmation)
export const getAssignedTasksCount = query({
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
      throw new Error('Insufficient permissions');
    }

    const assignedTasks = await ctx.db
      .query('tasks')
      .withIndex('by_assignee', (q) => q.eq('assigneeId', args.userId))
      .collect();
    
    return {
      count: assignedTasks.length,
      tasks: assignedTasks.map(task => ({
        _id: task._id,
        title: task.title,
        status: task.status,
      })),
    };
  },
});

// Ensure organization exists with proper email settings
export const ensureOrganization = mutation({
  handler: async (ctx) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can manage organization settings');
    }

    // Check if organization exists
    let organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();

    if (!organization) {
      // Create organization if it doesn't exist
      const organizationId = await ctx.db.insert('organizations', {
        name: 'strideUX',
        slug: 'strideux',
        timezone: 'America/New_York',
        defaultWorkstreamCapacity: 40,
        defaultSprintDuration: 2,
        emailFromAddress: 'admin@strideux.io',
        emailFromName: 'strideUX',
        primaryColor: '#0E1828',
        features: {
          emailInvitations: true,
          slackIntegration: false,
          clientPortal: true,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      
      organization = await ctx.db.get(organizationId);
    } else {
      // Update organization with proper email settings if they're missing
      const updateData: any = {
        updatedAt: Date.now(),
      };

      if (!organization.emailFromAddress) {
        updateData.emailFromAddress = 'admin@strideux.io';
      }
      if (!organization.emailFromName) {
        updateData.emailFromName = 'strideUX';
      }

      if (Object.keys(updateData).length > 1) { // More than just updatedAt
        await ctx.db.patch(organization._id, updateData);
        organization = await ctx.db.get(organization._id);
      }
    }

    return organization;
  },
});

// Self-service: update current user's profile
export const updateUserProfile = mutation({
  args: {
    name: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    preferences: v.optional(v.object({
      timezone: v.optional(v.string()),
      preferredLanguage: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.jobTitle !== undefined) updateData.jobTitle = args.jobTitle;
    if (args.preferences) {
      if (args.preferences.timezone !== undefined) updateData.timezone = args.preferences.timezone;
      if (args.preferences.preferredLanguage !== undefined) updateData.preferredLanguage = args.preferences.preferredLanguage;
    }

    await ctx.db.patch(userId, updateData);
    return { message: 'Profile updated' };
  },
});

// Self-service: update current user's avatar using Convex storage id stored in `image`
export const uploadUserAvatar = mutation({
  args: {
    storageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    let imageUrl: string | undefined = undefined;
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId);
      if (!url) {
        throw new Error('Failed to generate avatar URL');
      }
      imageUrl = url as string;
    }

    await ctx.db.patch(userId, { image: imageUrl, updatedAt: Date.now() });
    return { message: 'Avatar updated' };
  },
});

// Self-service: change password (requires current password)
export const updateUserPassword = mutation({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    // Basic password validation mirroring auth.validatePassword
    if (args.newPassword.length < 8 || !/[A-Z]/.test(args.newPassword) || !/[a-z]/.test(args.newPassword) || !/[0-9]/.test(args.newPassword)) {
      throw new Error('Password does not meet requirements');
    }

    // Invalidate existing reset tokens
    const existing = await ctx.db.query('passwordResets').withIndex('by_user', (q) => q.eq('userId', userId)).collect();
    for (const rec of existing) {
      await ctx.db.delete(rec._id);
    }

    // Create a reset token
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    await ctx.db.insert('passwordResets', { userId, token, expiresAt, used: false, createdAt: Date.now() });

    return { token, expiresAt };
  },
});

export const generateAvatarUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    return await ctx.storage.generateUploadUrl();
  },
}); 

// Self-service: update theme preference for the current user
export const updateThemePreference = mutation({
  args: {
    theme: v.union(
      v.literal('light'),
      v.literal('dark'),
      v.literal('system')
    ),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.patch(userId, {
      themePreference: args.theme,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
}); 