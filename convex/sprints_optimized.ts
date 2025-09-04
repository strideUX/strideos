import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Optimized query: Get sprints with pagination and minimal data
export const getSprintsPaginated = query({
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

    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    // Build base query with filters
    let query = ctx.db.query("sprints");

    // Apply role-based filtering
    if (user.role === "client") {
      if (!user.clientId) throw new Error("Client user must have clientId");
      query = query.filter((q) => q.eq(q.field("clientId"), user.clientId));
    } else if (user.role === "task_owner") {
      if (user.departmentIds && user.departmentIds.length > 0) {
        query = query.filter((q) =>
          q.or(...user.departmentIds.map((deptId: any) => q.eq(q.field("departmentId"), deptId)))
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

    // Get total count for pagination
    const totalCount = await query.collect();
    const totalSprints = totalCount.length;

    // Apply pagination - collect all and slice in memory since Convex doesn't support slice
    const allSprints = await query.collect();
    const sprints = allSprints.slice(offset, offset + limit);

    // Batch fetch related data to reduce individual queries
    const clientIds = [...new Set(sprints.map((s: any) => s.clientId))];
    const departmentIds = [...new Set(sprints.map((s: any) => s.departmentId))];
    
    const [clients, departments] = await Promise.all([
      Promise.all(clientIds.map((id: any) => ctx.db.get(id))),
      Promise.all(departmentIds.map((id: any) => ctx.db.get(id)))
    ]);

    // Create lookup maps for efficient data access
    const clientMap = new Map(clients.map((c: any) => [c?._id, c]));
    const departmentMap = new Map(departments.map((d: any) => [d?._id, d]));

    // Enrich sprints with minimal related data
    const enrichedSprints = sprints.map((sprint: any) => ({
      _id: sprint._id,
      name: sprint.name,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalCapacity: sprint.totalCapacity,
      slug: (sprint as any).slug,
      client: sprint.clientId ? {
        _id: sprint.clientId,
        name: clientMap.get(sprint.clientId)?.name || 'Unknown Client'
      } : null,
      department: sprint.departmentId ? {
        _id: sprint.departmentId,
        name: departmentMap.get(sprint.departmentId)?.name || 'Unknown Department'
      } : null,
    }));

    return {
      sprints: enrichedSprints,
      pagination: {
        total: totalSprints,
        limit,
        offset,
        hasMore: offset + limit < totalSprints
      }
    };
  },
});

// Optimized query: Get sprint stats with minimal data fetching
export const getSprintStatsOptimized = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Build base query with filters
    let sprintQuery = ctx.db.query("sprints");

    // Apply role-based filtering
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

    // Apply additional filters
    if (args.clientId) {
      sprintQuery = sprintQuery.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }
    if (args.departmentId) {
      sprintQuery = sprintQuery.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }

    const sprints = await sprintQuery.collect();
    
    // Calculate stats in memory to reduce database queries
    const totalSprints = sprints.length;
    const activeCount = sprints.filter((s) => s.status === "active").length;
    const completeCount = sprints.filter((s) => s.status === "complete").length;

    // Total capacity hours across active sprints
    const totalCapacityHours = sprints
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.totalCapacity || 0), 0);

    // Batch fetch task data for active sprints only
    const activeSprintIds = sprints
      .filter((s) => s.status === "active")
      .map(s => s._id);

    let totalCommittedHours = 0;
    if (activeSprintIds.length > 0) {
      // Use individual queries since Convex doesn't support inArray
      let allActiveSprintTasks: any[] = [];
      for (const sprintId of activeSprintIds) {
        const sprintTasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .collect();
        allActiveSprintTasks.push(...sprintTasks);
      }
      
      totalCommittedHours = allActiveSprintTasks.reduce((sum, t) => 
        sum + (((t as any).sizeHours ?? t.estimatedHours ?? 0) || 0), 0
      );
    }

    // Calculate velocity from completed sprints (limit to last 6 for performance)
    const completedSprints = sprints
      .filter((s) => s.status === "complete")
      .sort((a, b) => b.endDate - a.endDate)
      .slice(0, 6);

    let averageVelocity = 0;
    if (completedSprints.length > 0) {
      const completedSprintIds = completedSprints.map(s => s._id);
      
      // Batch fetch completed tasks
      let allCompletedTasks: any[] = [];
      for (const sprintId of completedSprintIds) {
        const sprintTasks = await ctx.db
          .query("tasks")
          .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
          .filter((q) => q.eq(q.field("status"), "done"))
          .collect();
        allCompletedTasks.push(...sprintTasks);
      }

      const velocities = completedSprintIds.map(sprintId => {
        const sprintTasks = allCompletedTasks.filter(t => t.sprintId === sprintId);
        return sprintTasks.reduce((sum, t) => 
          sum + (t.actualHours ?? (t as any).sizeHours ?? t.estimatedHours ?? 0), 0
        );
      });

      averageVelocity = velocities.length > 0 
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length 
        : 0;
    }

    const capacityUtilization = totalCapacityHours > 0 
      ? (totalCommittedHours / totalCapacityHours) * 100 
      : 0;

    return {
      totalSprints,
      activeSprints: activeCount,
      completedSprints: completeCount,
      averageVelocity,
      totalCapacityHours,
      committedHours: totalCommittedHours,
      capacityUtilization,
    } as const;
  },
});

// Optimized query: Get tasks for active sprints with minimal data
export const getTasksForActiveSprintsOptimized = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const limit = args.limit ?? 50;

    // Get active sprints with filters
    let sprintQuery = ctx.db.query("sprints").filter((q) => q.eq(q.field("status"), "active"));

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

    const activeSprints = await sprintQuery.collect();
    const activeSprintIds = activeSprints.map(s => s._id);

    if (activeSprintIds.length === 0) {
      return [];
    }

    // Batch fetch tasks for all active sprints
    let allTasks: any[] = [];
    for (const sprintId of activeSprintIds) {
      const sprintTasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", sprintId))
        .collect();
      allTasks.push(...sprintTasks);
    }
    
    // Apply limit after collecting all tasks
    const tasks = allTasks.slice(0, limit);

    // Batch fetch related data
    const projectIds = [...new Set(tasks.map((t: any) => t.projectId).filter(Boolean))];
    const assigneeIds = [...new Set(tasks.map((t: any) => t.assigneeId).filter(Boolean))];
    const clientIds = [...new Set(activeSprints.map(s => s.clientId))];

    const [projects, assignees, clients] = await Promise.all([
      Promise.all(projectIds.map((id: any) => ctx.db.get(id))),
      Promise.all(assigneeIds.map((id: any) => ctx.db.get(id))),
      Promise.all(clientIds.map((id: any) => ctx.db.get(id)))
    ]);

    // Create lookup maps
    const projectMap = new Map(projects.map((p: any) => [p?._id, p]));
    const assigneeMap = new Map(assignees.map((a: any) => [a?._id, a]));
    const clientMap = new Map(clients.map((c: any) => [c?._id, c]));

    // Enrich tasks with minimal data
    const enrichedTasks = tasks.map((task: any) => {
      const sprint = activeSprints.find(s => s._id === task.sprintId);
      const project = task.projectId ? projectMap.get(task.projectId) : null;
      const assignee = task.assigneeId ? assigneeMap.get(task.assigneeId) : null;
      const client = sprint?.clientId ? clientMap.get(sprint.clientId) : null;

      return {
        _id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        size: task.size,
        sizeHours: (task as any).sizeHours,
        sprintId: task.sprintId,
        project: project ? { _id: project._id, title: (project as any).title } : null,
        assignee: assignee ? { 
          _id: assignee._id, 
          name: (assignee as any).name, 
          email: (assignee as any).email,
          image: (assignee as any).image 
        } : null,
        client: client ? { _id: client._id, name: (client as any).name } : null,
        sprint: sprint ? { 
          _id: sprint._id, 
          name: sprint.name,
          startDate: sprint.startDate,
          endDate: sprint.endDate
        } : null,
      };
    });

    return enrichedTasks;
  },
});
