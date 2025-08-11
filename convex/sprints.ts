import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Helper function to calculate sprint capacity from department workstream settings (in HOURS)
async function calculateSprintCapacity(ctx: any, departmentId: any, _duration: number): Promise<number> {
  const department = await ctx.db.get(departmentId);
  if (!department) throw new Error("Department not found");

  // Get organization settings for base capacity (hours per workstream per sprint)
  const org = await ctx.db.query("organizations").first();
  const baseCapacityPerSprint = org?.defaultWorkstreamCapacity ?? 32; // Default 32 hours

  const workstreamCount = department.workstreamCount || 1;

  // Total capacity in HOURS (locked at sprint creation)
  return workstreamCount * baseCapacityPerSprint;
}

// Convert task size to hours (fallback on legacy lowercase sizes)
function taskSizeToHoursLocal(size?: string | null): number {
  if (!size) return 0;
  const normalized = size.toUpperCase();
  const map: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
  return map[normalized] ?? 0;
}

// Query: List all sprints (admin only) - simplified for dashboard
export const listSprints = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");
    
    if (user.role !== 'admin') {
      throw new Error("Insufficient permissions to list all sprints");
    }

    const sprints = await ctx.db.query("sprints").collect();
    
    // Enrich sprints with basic related data
    const enrichedSprints = await Promise.all(
      sprints.map(async (sprint) => {
        const [client, department] = await Promise.all([
          ctx.db.get(sprint.clientId),
          ctx.db.get(sprint.departmentId),
        ]);

        return {
          ...sprint,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
        };
      })
    );

    return enrichedSprints;
  },
});

// Query: Get all sprints with filtering and sorting
export const getSprints = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("review"),
      v.literal("complete"),
      v.literal("cancelled")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Build query with filters
    let query = ctx.db.query("sprints");

    // Apply role-based filtering
    if (user.role === "client") {
      // Clients can only see their own client's sprints
      if (!user.clientId) throw new Error("Client user must have clientId");
      query = query.filter((q) => q.eq(q.field("clientId"), user.clientId));
    } else if (user.role === "task_owner") {
      // Task owners see sprints in their departments
      if (user.departmentIds && user.departmentIds.length > 0) {
        query = query.filter((q) => 
          q.or(
            ...user.departmentIds.map((deptId: any) => q.eq(q.field("departmentId"), deptId))
          )
        );
      }
    }

    // Apply additional filters
    if (args.clientId) {
      query = query.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    // Get sprints (we'll sort in JavaScript since Convex has limitations on ordering filtered queries)
    const sprints = await query.collect();

    // Sort by start date (newest first) and apply limit
    const sortedSprints = sprints.sort((a, b) => b.startDate - a.startDate);
    const limitedSprints = args.limit ? sortedSprints.slice(0, args.limit) : sortedSprints;

    // Enrich sprints with related data
    const enrichedSprints = await Promise.all(
      limitedSprints.map(async (sprint) => {
        const [client, department, sprintMaster, teamMembers] = await Promise.all([
          ctx.db.get(sprint.clientId),
          ctx.db.get(sprint.departmentId),
          sprint.sprintMasterId ? ctx.db.get(sprint.sprintMasterId) : null,
          sprint.teamMemberIds ? Promise.all(sprint.teamMemberIds.map((id: any) => ctx.db.get(id))) : [],
        ]);

        return {
          ...sprint,
          client,
          department,
          sprintMaster,
          teamMembers: teamMembers.filter(Boolean),
        };
      })
    );

    return enrichedSprints;
  },
});

// Query: Get single sprint by ID
export const getSprint = query({
  args: { id: v.id("sprints") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const sprint = await ctx.db.get(args.id);
    if (!sprint) throw new Error("Sprint not found");

    // Check permissions
    if (user.role === "client" && sprint.clientId !== user.clientId) {
      throw new Error("Permission denied");
    }

    // Enrich sprint with related data
    const [client, department, sprintMaster, teamMembers, tasks] = await Promise.all([
      ctx.db.get(sprint.clientId),
      ctx.db.get(sprint.departmentId),
      sprint.sprintMasterId ? ctx.db.get(sprint.sprintMasterId) : null,
      sprint.teamMemberIds ? Promise.all(sprint.teamMemberIds.map((id: any) => ctx.db.get(id))) : [],
      ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", args.id))
        .collect(),
    ]);

    return {
      ...sprint,
      client,
      department,
      sprintMaster,
      teamMembers: teamMembers.filter(Boolean),
      tasks,
    };
  },
});

// Query: Get sprint statistics
export const getSprintStats = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    let sprintQuery = ctx.db.query("sprints");

    if (user.role === "client") {
      if (!user.clientId) throw new Error("Client user must have clientId");
      sprintQuery = sprintQuery.filter((q) => q.eq(q.field("clientId"), user.clientId));
    } else if (user.role === "task_owner") {
      if (user.departmentIds && user.departmentIds.length > 0) {
        sprintQuery = sprintQuery.filter((q) =>
          q.or(...user.departmentIds.map((deptId: any) => q.eq(q.field("departmentId"), deptId)))
        );
      }
    }

    if (args.clientId) {
      sprintQuery = sprintQuery.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }
    if (args.departmentId) {
      sprintQuery = sprintQuery.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }

    const sprints = await sprintQuery.collect();
    const totalSprints = sprints.length;
    const activeCount = sprints.filter((s) => s.status === "active").length;
    const completeCount = sprints.filter((s) => s.status === "complete").length;

    // Total capacity hours across active sprints (stored as totalCapacity)
    const totalCapacityHours = sprints
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.totalCapacity || 0), 0);

    // Total committed hours across active sprints (sum task hours)
    let totalCommittedHours = 0;
    for (const sprint of sprints.filter((s) => s.status === "active")) {
      const sprintTasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
        .collect();
      totalCommittedHours += sprintTasks.reduce((sum, t) => {
        const hours = t.estimatedHours ?? taskSizeToHoursLocal(t.size as string);
        return sum + (hours || 0);
      }, 0);
    }

    // Average velocity: completed HOURS per sprint for last 6 completed sprints
    const completedSprints = sprints
      .filter((s) => s.status === "complete")
      .sort((a, b) => b.endDate - a.endDate)
      .slice(0, 6);
    const velocities: number[] = [];
    for (const sprint of completedSprints) {
      const completedTasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
        .filter((q) => q.eq(q.field("status"), "done"))
        .collect();
      const completedHours = completedTasks.reduce((sum, t) => {
        const hours = t.actualHours ?? t.estimatedHours ?? taskSizeToHoursLocal(t.size as string);
        return sum + (hours || 0);
      }, 0);
      velocities.push(completedHours);
    }
    const averageVelocity = velocities.length
      ? velocities.reduce((a, b) => a + b, 0) / velocities.length
      : 0;

    const capacityUtilization = totalCapacityHours > 0 ? (totalCommittedHours / totalCapacityHours) * 100 : 0;

    return {
      totalSprints,
      activeSprints: activeCount,
      completedSprints: completeCount,
      averageVelocity,
      totalCapacityHours,
      totalCommittedHours,
      capacityUtilization,
    };
  },
});

// Get department-aggregated sprint data
export const getSprintsByDepartment = query({
  args: {
    clientId: v.optional(v.id("clients")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Get departments (optionally filter by client)
    let departments = await ctx.db.query("departments").collect();
    if (args.clientId) {
      departments = departments.filter((d) => d.clientId === args.clientId);
    }

    const results: any[] = [];
    for (const dept of departments) {
      const sprints = await ctx.db
        .query("sprints")
        .withIndex("by_department", (q) => q.eq("departmentId", dept._id))
        .collect();

      const planningSprints = sprints.filter((s) => s.status === "planning").length;
      const activeSprints = sprints.filter((s) => s.status === "active").length;
      const completedSprints = sprints.filter((s) => s.status === "complete").length;

      const totalCapacity = sprints.reduce((sum, s) => sum + (s.totalCapacity || 0), 0);

      // Committed hours across all dept sprints
      let totalCommitted = 0;
      for (const sprint of sprints) {
        const sprintTasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .collect();
        totalCommitted += sprintTasks.reduce((sum, t) => {
          const hours = t.estimatedHours ?? taskSizeToHoursLocal(t.size as string);
          return sum + (hours || 0);
        }, 0);
      }

      // Velocity: average of completed sprint hours (last 3 for this dept)
      const deptCompleted = sprints
        .filter((s) => s.status === "complete")
        .sort((a, b) => b.endDate - a.endDate)
        .slice(0, 3);
      const velocities: number[] = [];
      for (const sprint of deptCompleted) {
        const completedTasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
          .filter((q) => q.eq(q.field("status"), "done"))
          .collect();
        velocities.push(
          completedTasks.reduce((sum, t) => (sum + (t.actualHours ?? t.estimatedHours ?? taskSizeToHoursLocal(t.size as string))), 0)
        );
      }
      const aggregatedVelocity = velocities.length
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0;

      results.push({
        department: { _id: dept._id, name: dept.name, workstreamCount: dept.workstreamCount },
        planningSprints,
        activeSprints,
        completedSprints,
        totalCapacity,
        totalCommitted,
        aggregatedVelocity,
      });
    }

    return results;
  },
});

// Get ALL tasks from ALL projects in department for sprint planning
export const getDepartmentBacklog = query({
  args: {
    departmentId: v.id("departments"),
    excludeSprintId: v.optional(v.id("sprints")),
    currentSprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Get ALL projects in department
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();
    const allProjectIds = new Set(projects.map((p) => p._id));

    // Get unassigned tasks in department that belong to eligible projects
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_department", (q) => q.eq("departmentId", args.departmentId))
      .collect();

    const backlogTasks = tasks.filter((t) => {
      // Show tasks that are not in any sprint OR are in the current sprint (so selections remain visible)
      const isUnassigned = !t.sprintId;
      const isInCurrent = args.currentSprintId ? t.sprintId === args.currentSprintId : false;
      const includeBySprint = isUnassigned || isInCurrent;

      const isNotDone = t.status !== "done" && t.status !== "archived";
      const inDepartmentProject = t.projectId ? allProjectIds.has(t.projectId) : false;
      return includeBySprint && isNotDone && inDepartmentProject;
    });

    // Group by project
    const groupedByProjectMap = new Map<string, any>();
    for (const task of backlogTasks) {
      if (!task.projectId) continue;
      const projectId = task.projectId as string;
      if (!groupedByProjectMap.has(projectId)) {
        const project = projects.find((p) => p._id === task.projectId);
        groupedByProjectMap.set(projectId, {
          _id: project?._id,
          name: project?.title ?? "Untitled Project",
          tasks: [] as any[],
        });
      }
      // Enrich with assignee name for UX
      let assigneeName: string | undefined = undefined;
      if (task.assigneeId) {
        const assignee = await ctx.db.get(task.assigneeId);
        assigneeName = assignee?.name || assignee?.email || undefined;
      }
      groupedByProjectMap.get(projectId).tasks.push({
        _id: task._id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        size: task.size,
        hours: task.estimatedHours ?? taskSizeToHoursLocal(task.size as string),
        assigneeId: task.assigneeId,
        assigneeName,
      });
    }

    // Sort tasks by priority within each project (urgent > high > medium > low)
    const priorityOrder: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    const groupedByProject = Array.from(groupedByProjectMap.values()).map((proj) => {
      proj.tasks.sort((a: any, b: any) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0));
      return proj;
    });

    // Also return flat list if needed
    const flatTasks = Array.from(groupedByProjectMap.values()).flatMap((p: any) => p.tasks);

    return {
      groupedByProject,
      tasks: flatTasks,
    };
  },
});

// Detailed sprints list with computed hour-based metrics
export const getSprintsWithDetails = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    status: v.optional(
      v.union(v.literal("planning"), v.literal("active"), v.literal("review"), v.literal("complete"), v.literal("cancelled"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    let q = ctx.db.query("sprints");
    if (args.clientId) q = q.filter((qq) => qq.eq(qq.field("clientId"), args.clientId));
    if (args.departmentId) q = q.filter((qq) => qq.eq(qq.field("departmentId"), args.departmentId));
    if (args.status) q = q.filter((qq) => qq.eq(qq.field("status"), args.status));

    const sprints = await q.collect();
    const result: any[] = [];
    for (const sprint of sprints) {
      const [client, department] = await Promise.all([
        ctx.db.get(sprint.clientId),
        ctx.db.get(sprint.departmentId),
      ]);

      const tasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (qq) => qq.eq("sprintId", sprint._id))
        .collect();

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t) => t.status === "done").length;
      const committedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? taskSizeToHoursLocal(t.size as string)), 0);
      const completedHours = tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.actualHours ?? t.estimatedHours ?? taskSizeToHoursLocal(t.size as string)), 0);
      const capacityHours = sprint.totalCapacity || 0;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      result.push({
        ...sprint,
        client: client ? { _id: client._id, name: client.name } : null,
        department: department ? { _id: department._id, name: department.name } : null,
        totalTasks,
        completedTasks,
        committedHours,
        completedHours,
        capacityHours,
        progressPercentage,
      });
    }

    // Sort by startDate descending
    result.sort((a, b) => b.startDate - a.startDate);
    return result;
  },
});
// Query: Get department capacity information for sprint planning
export const getDepartmentCapacity = query({
  args: {
    departmentId: v.id("departments"),
    duration: v.optional(v.number()), // Sprint duration in weeks
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const department = await ctx.db.get(args.departmentId);
    if (!department) throw new Error("Department not found");

    // Check permissions
    if (user.role === "client" && department.clientId !== user.clientId) {
      throw new Error("Permission denied");
    }

    const duration = args.duration || 2; // Default 2 weeks, comes from global settings
    const capacity = await calculateSprintCapacity(ctx, args.departmentId, duration);

    return {
      department,
      workstreamCount: department.workstreamCount,
      calculatedCapacity: capacity,
      capacityPerWeek: capacity / duration,
      capacityPerWorkstream: capacity / department.workstreamCount,
    };
  },
});



// Query: Get tasks available for sprint assignment (backlog)
export const getSprintBacklogTasks = query({
  args: {
    clientId: v.id("clients"),
    departmentId: v.optional(v.id("departments")), // Made optional to support client-only filtering
    projectId: v.optional(v.id("projects")), // Optional project filter
    sprintId: v.optional(v.id("sprints")), // If provided, exclude tasks already in this sprint
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Only admin and PM can view sprint backlog
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can view sprint backlog");
    }

    // Get tasks filtered by client, department (if provided), and optionally project
    let query = ctx.db.query("tasks").filter((q) => 
      q.and(
        q.eq(q.field("clientId"), args.clientId),
        q.eq(q.field("status"), "todo") // Only todo tasks are available for sprint assignment
      )
    );

    // Add department filter if provided
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }

    // Add project filter if specified
    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }

    if (args.sprintId) {
      // Exclude tasks already in this sprint
      query = query.filter((q) => 
        q.or(
          q.eq(q.field("sprintId"), null),
          q.neq(q.field("sprintId"), args.sprintId)
        )
      );
    } else {
      // Get only unassigned tasks
      query = query.filter((q) =>
        q.or(
          q.eq(q.field("sprintId"), null),
          q.eq(q.field("sprintId"), undefined)
        )
      );
    }

    const tasks = await query.collect();

    // Sort by priority and creation date
    const sortedTasks = tasks.sort((a, b) => {
      // Priority order: urgent > high > medium > low
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Then by creation date (newer first)
      return b.createdAt - a.createdAt;
    });

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedTasks = sortedTasks.slice(offset, offset + limit);

    // Enrich tasks with assignee and project information
    const enrichedTasks = await Promise.all(
      paginatedTasks.map(async (task) => {
        const [assignee, project] = await Promise.all([
          task.assigneeId ? ctx.db.get(task.assigneeId) : null,
          task.projectId ? ctx.db.get(task.projectId) : null,
        ]);

        return {
          ...task,
          assignee,
          project,
        };
      })
    );

    return {
      tasks: enrichedTasks,
      total: tasks.length,
      hasMore: offset + limit < tasks.length,
    };
  },
});

// Mutation: Create new sprint
export const createSprint = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    clientId: v.id("clients"),
    departmentId: v.id("departments"),
    startDate: v.number(),
    endDate: v.number(),
    duration: v.number(), // in weeks
    totalCapacity: v.optional(v.number()), // Optional - will be calculated from department settings if not provided
    goals: v.optional(v.array(v.string())),
    velocityTarget: v.optional(v.number()),
    sprintMasterId: v.optional(v.id("users")),
    teamMemberIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Only admin and PM can create sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can create sprints");
    }

    // Validate dates
    if (args.startDate >= args.endDate) {
      throw new Error("Start date must be before end date");
    }

    // Check for overlapping sprints in the same department
    const overlappingSprints = await ctx.db
      .query("sprints")
      .withIndex("by_department_status", (q) => 
        q.eq("departmentId", args.departmentId)
          .eq("status", "active")
      )
      .filter((q) => 
        q.or(
          q.and(
            q.lte(q.field("startDate"), args.startDate),
            q.gte(q.field("endDate"), args.startDate)
          ),
          q.and(
            q.lte(q.field("startDate"), args.endDate),
            q.gte(q.field("endDate"), args.endDate)
          )
        )
      )
      .collect();

    if (overlappingSprints.length > 0) {
      throw new Error("Sprint dates overlap with existing active sprint");
    }

    // Calculate capacity from department workstream settings if not provided
    let totalCapacity = args.totalCapacity;
    if (!totalCapacity) {
      totalCapacity = await calculateSprintCapacity(ctx, args.departmentId, args.duration);
    }

    const sprintId = await ctx.db.insert("sprints", {
      name: args.name,
      description: args.description,
      clientId: args.clientId,
      departmentId: args.departmentId,
      startDate: args.startDate,
      endDate: args.endDate,
      duration: args.duration,
      status: "planning",
      totalCapacity,
      committedPoints: 0,
      completedPoints: 0,
      goals: args.goals || [],
      velocityTarget: args.velocityTarget,
      actualVelocity: 0,
      sprintMasterId: args.sprintMasterId,
      teamMemberIds: args.teamMemberIds || [],
      sprintReviewDate: undefined,
      sprintRetrospectiveDate: undefined,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sprintId;
  },
});

// Mutation: Update sprint
export const updateSprint = mutation({
  args: {
    id: v.id("sprints"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    duration: v.optional(v.number()),
    status: v.optional(v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("review"),
      v.literal("complete"),
      v.literal("cancelled")
    )),
    totalCapacity: v.optional(v.number()),
    goals: v.optional(v.array(v.string())),
    velocityTarget: v.optional(v.number()),
    sprintMasterId: v.optional(v.id("users")),
    teamMemberIds: v.optional(v.array(v.id("users"))),
    sprintReviewDate: v.optional(v.number()),
    sprintRetrospectiveDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const sprint = await ctx.db.get(args.id);
    if (!sprint) throw new Error("Sprint not found");

    // Only admin and PM can update sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can update sprints");
    }

    // Prepare update data
    const updateData: any = {
      updatedBy: user._id,
      updatedAt: Date.now(),
    };

    // Only update provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.startDate !== undefined) updateData.startDate = args.startDate;
    if (args.endDate !== undefined) updateData.endDate = args.endDate;
    if (args.duration !== undefined) updateData.duration = args.duration;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.totalCapacity !== undefined) updateData.totalCapacity = args.totalCapacity;
    if (args.goals !== undefined) updateData.goals = args.goals;
    if (args.velocityTarget !== undefined) updateData.velocityTarget = args.velocityTarget;
    if (args.sprintMasterId !== undefined) updateData.sprintMasterId = args.sprintMasterId;
    if (args.teamMemberIds !== undefined) updateData.teamMemberIds = args.teamMemberIds;
    if (args.sprintReviewDate !== undefined) updateData.sprintReviewDate = args.sprintReviewDate;
    if (args.sprintRetrospectiveDate !== undefined) updateData.sprintRetrospectiveDate = args.sprintRetrospectiveDate;

    await ctx.db.patch(args.id, updateData);
    return args.id;
  },
});

// Mutation: Delete sprint
export const deleteSprint = mutation({
  args: { id: v.id("sprints") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const sprint = await ctx.db.get(args.id);
    if (!sprint) throw new Error("Sprint not found");

    // Only admin and PM can delete sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can delete sprints");
    }

    // Check if sprint has assigned tasks
    const assignedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.id))
      .collect();

    if (assignedTasks.length > 0) {
      throw new Error("Cannot delete sprint with assigned tasks. Please reassign or remove tasks first.");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Mutation: Start sprint
export const startSprint = mutation({
  args: { id: v.id("sprints") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const sprint = await ctx.db.get(args.id);
    if (!sprint) throw new Error("Sprint not found");

    // Only admin and PM can start sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can start sprints");
    }

    if (sprint.status !== "planning") {
      throw new Error("Only planning sprints can be started");
    }

    // Check if there are other active sprints in the same department
    const activeSprints = await ctx.db
      .query("sprints")
      .withIndex("by_department_status", (q) => 
        q.eq("departmentId", sprint.departmentId)
          .eq("status", "active")
      )
      .collect();

    if (activeSprints.length > 0) {
      throw new Error("Cannot start sprint while another sprint is active in the same department");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      updatedBy: user._id,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Mutation: Complete sprint
export const completeSprint = mutation({
  args: { id: v.id("sprints") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const sprint = await ctx.db.get(args.id);
    if (!sprint) throw new Error("Sprint not found");

    // Only admin and PM can complete sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can complete sprints");
    }

    if (sprint.status !== "active") {
      throw new Error("Only active sprints can be completed");
    }

    // Calculate actual velocity from completed tasks (HOURS)
    const completedTasks = await ctx.db
      .query("tasks")
      .withIndex("by_sprint", (q) => q.eq("sprintId", args.id))
      .filter((q) => q.eq(q.field("status"), "done"))
      .collect();

    const actualVelocity = completedTasks.reduce((sum, task) => {
      const hours = task.actualHours ?? task.estimatedHours ?? taskSizeToHoursLocal(task.size as string);
      return sum + (hours || 0);
    }, 0);

    await ctx.db.patch(args.id, {
      status: "complete",
      completedPoints: actualVelocity, // now represents HOURS
      actualVelocity,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });

    return args.id;
  },
}); 