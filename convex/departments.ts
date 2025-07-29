import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Department creation with workstream validation
export const createDepartment = mutation({
  args: {
    name: v.string(),
    clientId: v.id('clients'),
    description: v.optional(v.string()),
    workstreamCount: v.number(),
    workstreamCapacity: v.number(),
    sprintDuration: v.number(),
    workstreamLabels: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
    workingHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
      daysOfWeek: v.array(v.number()),
    })),
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

    // Validate workstream configuration
    if (args.workstreamCount <= 0) {
      throw new Error('Workstream count must be greater than 0');
    }

    if (args.workstreamCapacity <= 0) {
      throw new Error('Workstream capacity must be greater than 0');
    }

    if (args.sprintDuration < 1 || args.sprintDuration > 4) {
      throw new Error('Sprint duration must be between 1 and 4 weeks');
    }

    // Validate workstream labels if provided
    if (args.workstreamLabels && args.workstreamLabels.length !== args.workstreamCount) {
      throw new Error('Number of workstream labels must match workstream count');
    }

    // Validate working hours if provided
    if (args.workingHours) {
      const { start, end, daysOfWeek } = args.workingHours;
      if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) {
        throw new Error('Invalid time format. Use HH:MM format (e.g., "09:00")');
      }
      if (daysOfWeek.some(day => day < 0 || day > 6)) {
        throw new Error('Days of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Create the department
    const departmentId = await ctx.db.insert('departments', {
      name: args.name,
      clientId: args.clientId,
      description: args.description,
      workstreamCount: args.workstreamCount,
      workstreamCapacity: args.workstreamCapacity,
      sprintDuration: args.sprintDuration,
      workstreamLabels: args.workstreamLabels,
      timezone: args.timezone,
      workingHours: args.workingHours,
      velocityHistory: [],
      status: 'active',
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
    description: v.optional(v.string()),
    workstreamCount: v.optional(v.number()),
    workstreamCapacity: v.optional(v.number()),
    sprintDuration: v.optional(v.number()),
    workstreamLabels: v.optional(v.array(v.string())),
    timezone: v.optional(v.string()),
    workingHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
      daysOfWeek: v.array(v.number()),
    })),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive')
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

    // Validate workstream configuration
    if (args.workstreamCount !== undefined && args.workstreamCount <= 0) {
      throw new Error('Workstream count must be greater than 0');
    }

    if (args.workstreamCapacity !== undefined && args.workstreamCapacity <= 0) {
      throw new Error('Workstream capacity must be greater than 0');
    }

    if (args.sprintDuration !== undefined && (args.sprintDuration < 1 || args.sprintDuration > 4)) {
      throw new Error('Sprint duration must be between 1 and 4 weeks');
    }

    // Validate workstream labels if provided
    const finalWorkstreamCount = args.workstreamCount ?? existingDepartment.workstreamCount;
    if (args.workstreamLabels && args.workstreamLabels.length !== finalWorkstreamCount) {
      throw new Error('Number of workstream labels must match workstream count');
    }

    // Validate working hours if provided
    if (args.workingHours) {
      const { start, end, daysOfWeek } = args.workingHours;
      if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) {
        throw new Error('Invalid time format. Use HH:MM format (e.g., "09:00")');
      }
      if (daysOfWeek.some(day => day < 0 || day > 6)) {
        throw new Error('Days of week must be between 0 (Sunday) and 6 (Saturday)');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.workstreamCount !== undefined) updateData.workstreamCount = args.workstreamCount;
    if (args.workstreamCapacity !== undefined) updateData.workstreamCapacity = args.workstreamCapacity;
    if (args.sprintDuration !== undefined) updateData.sprintDuration = args.sprintDuration;
    if (args.workstreamLabels !== undefined) updateData.workstreamLabels = args.workstreamLabels;
    if (args.timezone !== undefined) updateData.timezone = args.timezone;
    if (args.workingHours !== undefined) updateData.workingHours = args.workingHours;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.departmentId, updateData);
    return args.departmentId;
  },
});

// Soft delete department with dependency checks
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

    // Soft delete by setting status to inactive
    await ctx.db.patch(args.departmentId, {
      status: 'inactive',
      updatedAt: Date.now(),
    });

    return args.departmentId;
  },
});

// Get single department by ID with capacity info
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

    // Calculate capacity info
    const totalCapacity = department.workstreamCount * department.workstreamCapacity;
    const averageVelocity = calculateAverageVelocity(department.velocityHistory || []);

    return {
      ...department,
      client: client,
      projects: projects,
      projectCount: projects.length,
      activeProjectCount: projects.filter(p => p.status === 'active').length,
      totalCapacity: totalCapacity,
      averageVelocity: averageVelocity,
    };
  },
});

// List departments by client
export const listDepartmentsByClient = query({
  args: {
    clientId: v.id('clients'),
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let departments;

    // Apply status filter
    if (args.status) {
      departments = await ctx.db
        .query('departments')
        .withIndex('by_client_status', (q) => q.eq('clientId', args.clientId).eq('status', args.status!))
        .collect();
    } else {
      departments = await ctx.db
        .query('departments')
        .withIndex('by_client', (q) => q.eq('clientId', args.clientId))
        .collect();
    }

    // Get project counts and capacity info for each department
    const departmentsWithStats = await Promise.all(
      departments.map(async (department) => {
        const projects = await ctx.db
          .query('projects')
          .withIndex('by_department', (q) => q.eq('departmentId', department._id))
          .collect();

        const totalCapacity = department.workstreamCount * department.workstreamCapacity;
        const averageVelocity = calculateAverageVelocity(department.velocityHistory || []);

        return {
          ...department,
          projectCount: projects.length,
          activeProjectCount: projects.filter(p => p.status === 'active').length,
          totalCapacity: totalCapacity,
          averageVelocity: averageVelocity,
        };
      })
    );

    return departmentsWithStats;
  },
});

// Calculate department capacity
export const calculateDepartmentCapacity = query({
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

    const totalCapacity = department.workstreamCount * department.workstreamCapacity;
    const averageVelocity = calculateAverageVelocity(department.velocityHistory || []);
    const capacityUtilization = averageVelocity > 0 ? (averageVelocity / totalCapacity) * 100 : 0;

    return {
      workstreamCount: department.workstreamCount,
      workstreamCapacity: department.workstreamCapacity,
      totalCapacity: totalCapacity,
      sprintDuration: department.sprintDuration,
      averageVelocity: averageVelocity,
      capacityUtilization: Math.round(capacityUtilization),
      workstreamLabels: department.workstreamLabels || [],
    };
  },
});

// Add velocity data to department
export const addVelocityData = mutation({
  args: {
    departmentId: v.id('departments'),
    sprintId: v.optional(v.string()),
    sprintEndDate: v.number(),
    completedPoints: v.number(),
    plannedPoints: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // Get user to check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'pm')) {
      throw new Error('Insufficient permissions to add velocity data');
    }

    const department = await ctx.db.get(args.departmentId);
    if (!department) {
      throw new Error('Department not found');
    }

    const velocityEntry = {
      sprintId: args.sprintId,
      sprintEndDate: args.sprintEndDate,
      completedPoints: args.completedPoints,
      plannedPoints: args.plannedPoints,
    };

    const updatedHistory = [...(department.velocityHistory || []), velocityEntry];

    // Keep only the last 10 sprints for performance
    const trimmedHistory = updatedHistory.slice(-10);

    await ctx.db.patch(args.departmentId, {
      velocityHistory: trimmedHistory,
      updatedAt: Date.now(),
    });

    return args.departmentId;
  },
});

// List all departments (for admin use)
export const listAllDepartments = query({
  args: {
    status: v.optional(v.union(
      v.literal('active'),
      v.literal('inactive')
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    let departments;

    // Apply status filter
    if (args.status) {
      departments = await ctx.db
        .query('departments')
        .withIndex('by_status', (q) => q.eq('status', args.status!))
        .collect();
    } else {
      departments = await ctx.db.query('departments').collect();
    }

    return departments;
  },
});

// Helper functions
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function calculateAverageVelocity(velocityHistory: Array<{
  sprintId?: string;
  sprintEndDate: number;
  completedPoints: number;
  plannedPoints: number;
}>): number {
  if (velocityHistory.length === 0) return 0;
  
  const totalCompleted = velocityHistory.reduce((sum, entry) => sum + entry.completedPoints, 0);
  return Math.round(totalCompleted / velocityHistory.length);
} 