import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Size to HOURS mapping - supports both legacy enum and free-form text
const SIZE_TO_HOURS: Record<string, number> = { XS: 4, S: 16, M: 32, L: 48, XL: 64 };
const sizeToHours = (size?: string | null): number => {
  if (!size) return 0;
  
  // Handle legacy enum values
  const upperSize = size.toUpperCase();
  if (SIZE_TO_HOURS[upperSize]) {
    return SIZE_TO_HOURS[upperSize];
  }
  
  // Handle free-form text patterns like "2d", "1w", "4h"
  const match = size.match(/^(\d+)([dwh])$/i);
  if (match) {
    const [, value, unit] = match;
    const numValue = parseInt(value, 10);
    switch (unit.toLowerCase()) {
      case 'd': return numValue * 8; // 8 hours per day
      case 'w': return numValue * 40; // 40 hours per week
      case 'h': return numValue; // Direct hours
      default: return 0;
    }
  }
  
  return 0;
};

// Query: List all tasks (admin only) - simplified for dashboard
export const listTasks = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");
    
    if (user.role !== 'admin') {
      throw new Error("Insufficient permissions to list all tasks");
    }

    const tasks = await ctx.db.query("tasks").collect();
    
    // Enrich tasks with basic related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [assignee, client, department] = await Promise.all([
          task.assigneeId ? ctx.db.get(task.assigneeId) : null,
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
        ]);

        return {
          ...task,
          assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Query: Get tasks by IDs (for BlockNote blocks)
export const getTasksByIds = query({
  args: {
    taskIds: v.array(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    if (args.taskIds.length === 0) return [];

    const tasks = await Promise.all(
      args.taskIds.map(async (taskId) => {
        const task = await ctx.db.get(taskId);
        if (!task) return null;
        
        // Check permissions
        if (!(await canUserViewTask(ctx, user, task))) {
          return null;
        }
        
        return task;
      })
    );

    return tasks.filter(Boolean);
  },
});

// Query: Get tasks by project ID
export const getTasksByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    // Filter tasks based on user permissions
    const visibleTasks = [];
    for (const task of tasks) {
      if (await canUserViewTask(ctx, user, task)) {
        visibleTasks.push(task);
      }
    }

    return visibleTasks;
  },
});

// Query: Get task aggregates for a set of projects
export const getTaskAggregatesForProjects = query({
  args: {
    projectIds: v.array(v.id('projects')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const results: Record<string, { totalTasks: number; totalHours: number }> = {};

    for (const projectId of args.projectIds) {
      const tasks = await ctx.db
        .query('tasks')
        .withIndex('by_project', (q) => q.eq('projectId', projectId))
        .collect();

      let totalTasks = 0;
      let totalHours = 0;
      for (const task of tasks) {
        if (await canUserViewTask(ctx, user, task)) {
          totalTasks += 1;
          const hours = (task as any).sizeHours ?? task.estimatedHours ?? 0;
          totalHours += hours || 0;
        }
      }

      results[projectId] = { totalTasks, totalHours };
    }

    return results;
  },
});

// Query: Get all tasks with filtering and sorting
export const getTasks = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    projectId: v.optional(v.id("projects")),
    assigneeId: v.optional(v.id("users")),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("archived")
    )),
    sprintId: v.optional(v.id("sprints")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Build query with filters
    let query = ctx.db.query("tasks");

    // Apply role-based filtering
    if (user.role === "client") {
      // Clients can only see their own client's tasks
      if (!user.clientId) throw new Error("Client user must have clientId");
      query = query.filter((q) => q.eq(q.field("clientId"), user.clientId));
    } else if (user.role === "task_owner") {
      // Task owners see tasks assigned to them or in their departments
      if (user.departmentIds && user.departmentIds.length > 0) {
        query = query.filter((q) => 
          q.or(
            q.eq(q.field("assigneeId"), user._id),
            ...user.departmentIds.map((deptId: any) => q.eq(q.field("departmentId"), deptId))
          )
        );
      } else {
        query = query.filter((q) => q.eq(q.field("assigneeId"), user._id));
      }
    }

    // Apply additional filters
    if (args.clientId) {
      query = query.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }
    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }
    if (args.assigneeId) {
      query = query.filter((q) => q.eq(q.field("assigneeId"), args.assigneeId));
    }
    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }
    if (args.sprintId) {
      query = query.filter((q) => q.eq(q.field("sprintId"), args.sprintId));
    }

    // Get tasks (we'll sort in JavaScript since Convex has limitations on ordering filtered queries)
    const tasks = await query.collect();

    // Sort by creation date (newest first) and apply limit
    const sortedTasks = tasks.sort((a, b) => b._creationTime - a._creationTime);
    const limitedTasks = args.limit ? sortedTasks.slice(0, args.limit) : sortedTasks;

    // Enrich tasks with related data
    const enrichedTasks = await Promise.all(
      limitedTasks.map(async (task) => {
        const [assignee, reporter, client, department, project, sprint] = await Promise.all([
          task.assigneeId ? ctx.db.get(task.assigneeId) : null,
          ctx.db.get(task.reporterId),
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
          task.projectId ? ctx.db.get(task.projectId) : null,
          task.sprintId ? ctx.db.get(task.sprintId) : null,
        ]);

        return {
          ...task,
          assignee,
          reporter,
          client,
          department,
          project,
          sprint,
        };
      })
    );

    return enrichedTasks;
  },
});

// Query: Get task by ID
export const getTask = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    // Check permissions
    const canView = await canUserViewTask(ctx, user, task);
    if (!canView) throw new Error("Permission denied");

    // Enrich with related data
    const [assignee, reporter, client, department, project, sprint] = await Promise.all([
      task.assigneeId ? ctx.db.get(task.assigneeId) : null,
      ctx.db.get(task.reporterId),
      ctx.db.get(task.clientId),
      ctx.db.get(task.departmentId),
      task.projectId ? ctx.db.get(task.projectId) : null,
      task.sprintId ? ctx.db.get(task.sprintId) : null,
    ]);

    return {
      ...task,
      assignee,
      reporter,
      client,
      department,
      project,
      sprint,
    };
  },
});

// Mutation: Create new task
export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("archived")
    )),
    projectId: v.optional(v.id("projects")),
    clientId: v.id("clients"),
    departmentId: v.id("departments"),
    // Document integration fields
    documentId: v.optional(v.id("legacyDocuments")),
    sectionId: v.optional(v.id("legacyDocumentSections")),
    blockId: v.optional(v.string()),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    size: v.optional(v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL")
    )),
    // New hours-based sizing
    sizeHours: v.optional(v.number()),
    // Allow direct estimatedHours (e.g., from day selection * 8). If provided, it overrides size mapping
    estimatedHours: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Check permissions - only admin and PM can create tasks
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can create tasks");
    }

    // Calculate estimatedHours - prefer explicit value, else derive from sizeHours
    const estimatedHours =
      args.estimatedHours !== undefined
        ? args.estimatedHours
        : (args.sizeHours !== undefined ? args.sizeHours : undefined);

    // Get next backlog order
    const lastTask = await ctx.db
      .query("tasks")
      .withIndex("by_backlog_order", (q) => q.eq("departmentId", args.departmentId))
      .order("desc")
      .first();
    
    const backlogOrder = (lastTask?.backlogOrder ?? 0) + 1;

    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      projectId: args.projectId,
      clientId: args.clientId,
      departmentId: args.departmentId,
      // Document integration fields
      documentId: args.documentId,
      sectionId: args.sectionId,
      blockId: args.blockId,
      status: args.status || "todo",
      priority: args.priority,
      size: args.size,
      sizeHours: args.sizeHours,
      estimatedHours,
      assigneeId: args.assigneeId,
      reporterId: user._id,
      dueDate: args.dueDate,
      labels: [], // Default to empty array
      category: "feature", // Default to feature
      visibility: "department", // Default to department
      backlogOrder,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // Send assignment notification if task was created with an assignee
    if (args.assigneeId && args.assigneeId !== user._id) {
      try {
        const assignedByName = (user as any)?.name ?? (user as any)?.email ?? "Someone";
        await ctx.db.insert("notifications", {
          type: "task_assigned",
          title: "Task Assigned",
          message: `${assignedByName} assigned you a new task: ${args.title}`,
          userId: args.assigneeId,
          isRead: false,
          priority: "medium",
          relatedTaskId: taskId,
          taskId: taskId,
          actionUrl: `/tasks/${taskId}`,
          actionText: "View Task",
          createdAt: Date.now(),
        });
      } catch (_e) {
        // Non-blocking
      }
    }

    // Generate slug asynchronously if projectId exists
    if (args.projectId) {
      try {
        // Using string reference for scheduler to avoid import cycles
        await ctx.scheduler.runAfter(0, 'slugsSimplified:generateTaskSlug' as any, {
          projectId: args.projectId,
          taskId,
        });
      } catch (_e) {
        // Non-blocking
      }
    }

    return taskId;
  },
});

// Mutation: Update task
export const updateTask = mutation({
  args: {
    id: v.id("tasks"),
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    projectId: v.optional(v.id("projects")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("review"),
      v.literal("done"),
      v.literal("archived")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    size: v.optional(v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL")
    )),
    sizeHours: v.optional(v.number()),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    estimatedHours: v.optional(v.number()),
    actualHours: v.optional(v.number()),
    version: v.optional(v.number()), // For optimistic updates
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    // Check permissions
    const canEdit = await canUserEditTask(ctx, user, task);
    if (!canEdit) throw new Error("Permission denied");

    // Prepare update data
    const updateData: any = {
      updatedBy: user._id,
      updatedAt: Date.now(),
      version: (task.version ?? 1) + 1,
    };

    // Only update provided fields
    if (args.title !== undefined) updateData.title = args.title;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.status !== undefined) {
      updateData.status = args.status;
      // Set completion date when marking as done
      if (args.status === "done" && task.status !== "done") {
        updateData.completedDate = Date.now();
      }
      // Clear completion date if moving away from done
      if (args.status !== "done" && task.status === "done") {
        updateData.completedDate = undefined;
      }
    }
    if (args.priority !== undefined) updateData.priority = args.priority;
    if (args.size !== undefined) {
      updateData.size = args.size;
    }
    if (args.sizeHours !== undefined) {
      updateData.sizeHours = args.sizeHours;
      // If estimatedHours not explicitly provided in this update, sync it with sizeHours for consistency
      if (args.estimatedHours === undefined) {
        updateData.estimatedHours = args.sizeHours;
      }
    }
    if (args.clientId !== undefined) updateData.clientId = args.clientId;
    if (args.departmentId !== undefined) updateData.departmentId = args.departmentId;
    if (args.projectId !== undefined) updateData.projectId = args.projectId;
    if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.estimatedHours !== undefined) updateData.estimatedHours = args.estimatedHours;
    if (args.actualHours !== undefined) updateData.actualHours = args.actualHours;

    // Detect assignee change before patching
    const newAssigneeProvided = Object.prototype.hasOwnProperty.call(args, "assigneeId");
    const newAssigneeId = args.assigneeId;
    const assigneeChanged = newAssigneeProvided && newAssigneeId !== task.assigneeId && newAssigneeId !== undefined;

    // Apply updates
    await ctx.db.patch(args.id, updateData);

    // Create assignment notification for new assignee (skip self-assign)
    if (assigneeChanged && newAssigneeId && newAssigneeId !== user._id) {
      try {
        const assignedByName = (user as any)?.name ?? (user as any)?.email ?? "Someone";
        await ctx.db.insert("notifications", {
          type: "task_assigned",
          title: "Task Assigned",
          message: `${assignedByName} assigned you a task: ${task.title}`,
          userId: newAssigneeId,
          isRead: false,
          priority: "medium",
          relatedTaskId: args.id,
          taskId: args.id,
          actionUrl: `/tasks/${args.id}`,
          actionText: "View Task",
          createdAt: Date.now(),
        });
      } catch (_e) {
        // Non-blocking
      }
    }

    return args.id;
  },
});

// Mutation: Delete task
export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const task = await ctx.db.get(args.id);
    if (!task) throw new Error("Task not found");

    // Only admin and PM can delete tasks
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can delete tasks");
    }

    // Additional check: PM can only delete tasks in their departments
    if (user.role === "pm" && user.departmentIds) {
      if (!user.departmentIds.includes(task.departmentId)) {
        throw new Error("Permission denied");
      }
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Mutation: Assign task to sprint
export const assignTaskToSprint = mutation({
  args: {
    taskId: v.id("tasks"),
    sprintId: v.optional(v.id("sprints")), // null to remove from sprint
    sprintOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Only admin and PM can assign tasks to sprints
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can assign tasks to sprints");
    }

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

  // Allow capacity overruns: we intentionally do NOT block assignment when over capacity.
  // Keep this section as documentation; if needed, re-enable in the future.
  // if (args.sprintId) {
  //   const sprint = await ctx.db.get(args.sprintId);
  //   if (!sprint) throw new Error("Sprint not found");
  //   const sprintTasks = await ctx.db
  //     .query("tasks")
  //     .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
  //     .collect();
  //   const currentCommitted = sprintTasks
  //     .filter((t) => t._id !== args.taskId)
  //     .reduce((sum, t) => sum + (t.estimatedHours ?? sizeToHours(t.size as unknown as string)), 0);
  //   const taskHours = task.estimatedHours ?? sizeToHours(task.size as unknown as string);
  //   // Previously: throw if currentCommitted + taskHours > sprint.totalCapacity
  // }

    // Get next sprint order if not provided
    let sprintOrder = args.sprintOrder;
    if (args.sprintId && !sprintOrder) {
      const lastSprintTask = await ctx.db
        .query("tasks")
        .withIndex("by_sprint_order", (q) => q.eq("sprintId", args.sprintId))
        .order("desc")
        .first();
      sprintOrder = (lastSprintTask?.sprintOrder ?? 0) + 1;
    }

    await ctx.db.patch(args.taskId, {
      sprintId: args.sprintId,
      sprintOrder: args.sprintId ? sprintOrder : undefined,
      updatedBy: user._id,
      updatedAt: Date.now(),
    });

    return args.taskId;
  },
});

// Helper function: Check if user can view task
async function canUserViewTask(ctx: any, user: any, task: any): Promise<boolean> {
  if (user.role === "admin") return true;
  
  if (user.role === "client") {
    return user.clientId === task.clientId;
  }
  
  if (user.role === "pm") {
    // PM can view tasks in their departments
    if (user.departmentIds?.includes(task.departmentId)) return true;
  }
  
  if (user.role === "task_owner") {
    // Task owners can view their assigned tasks
    if (task.assigneeId === user._id) return true;
    // And tasks in their departments (if visibility allows)
    if (user.departmentIds?.includes(task.departmentId) && 
        ["team", "department", "client"].includes(task.visibility)) {
      return true;
    }
  }
  
  return false;
}

// Helper function: Check if user can edit task
async function canUserEditTask(ctx: any, user: any, task: any): Promise<boolean> {
  if (user.role === "admin") return true;
  
  if (user.role === "pm") {
    // PM can edit tasks in their departments
    return user.departmentIds?.includes(task.departmentId) ?? false;
  }
  
  if (user.role === "task_owner") {
    // Task owners can only update status and time tracking on their assigned tasks
    return task.assigneeId === user._id;
  }
  
  return false;
}

// Query: Get task statistics
export const getTaskStats = query({
  args: {
    clientId: v.optional(v.id("clients")),
    departmentId: v.optional(v.id("departments")),
    projectId: v.optional(v.id("projects")),
    sprintId: v.optional(v.id("sprints")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Build base query with role-based filtering
    let query = ctx.db.query("tasks");

    if (user.role === "client") {
      if (!user.clientId) throw new Error("Client user must have clientId");
      query = query.filter((q) => q.eq(q.field("clientId"), user.clientId));
    } else if (user.role === "task_owner") {
      if (user.departmentIds && user.departmentIds.length > 0) {
        query = query.filter((q) => 
          q.or(
            q.eq(q.field("assigneeId"), user._id),
            ...user.departmentIds.map((deptId: any) => q.eq(q.field("departmentId"), deptId))
          )
        );
      } else {
        query = query.filter((q) => q.eq(q.field("assigneeId"), user._id));
      }
    }

    // Apply filters
    if (args.clientId) {
      query = query.filter((q) => q.eq(q.field("clientId"), args.clientId));
    }
    if (args.departmentId) {
      query = query.filter((q) => q.eq(q.field("departmentId"), args.departmentId));
    }
    if (args.projectId) {
      query = query.filter((q) => q.eq(q.field("projectId"), args.projectId));
    }
    if (args.sprintId) {
      query = query.filter((q) => q.eq(q.field("sprintId"), args.sprintId));
    }

    const tasks = await query.collect();

    // Calculate statistics
    const stats = {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter(t => t.status === "todo").length,
        in_progress: tasks.filter(t => t.status === "in_progress").length,
        review: tasks.filter(t => t.status === "review").length,
        done: tasks.filter(t => t.status === "done").length,
        archived: tasks.filter(t => t.status === "archived").length,
      },
      byPriority: {
        low: tasks.filter(t => t.priority === "low").length,
        medium: tasks.filter(t => t.priority === "medium").length,
        high: tasks.filter(t => t.priority === "high").length,
        urgent: tasks.filter(t => t.priority === "urgent").length,
      },
      totalStoryPoints: tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
      completedStoryPoints: tasks
        .filter(t => t.status === "done")
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
      overdueTasks: tasks.filter(t => 
        t.dueDate && t.dueDate < Date.now() && t.status !== "done"
      ).length,
    };

    return stats;
  },
});

// Query: Get tasks by document (for document-task integration)
export const getTasksByDocument = query({
  args: {
    documentId: v.id("legacyDocuments"),
    sectionId: v.optional(v.id("legacyDocumentSections")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Build query for tasks linked to this document
    let query = ctx.db.query("tasks").filter((q) => q.eq(q.field("documentId"), args.documentId));

    // If sectionId is provided, filter by section
    if (args.sectionId) {
      query = query.filter((q) => q.eq(q.field("sectionId"), args.sectionId));
    }

    const tasks = await query.collect();

    // Filter tasks based on user permissions
    const visibleTasks = tasks.filter(task => {
      // Admin can see all tasks
      if (user.role === "admin") return true;
      
      // PM can see tasks in their departments
      if (user.role === "pm") {
        return user.departmentIds?.includes(task.departmentId) ?? false;
      }
      
      // Task owners can see their assigned tasks or tasks in their departments
      if (user.role === "task_owner") {
                return task.assigneeId === user._id ||
               (user.departmentIds?.includes(task.departmentId) ?? false);
      }
      
      // Clients can see tasks for their client
      if (user.role === "client") {
        return user.clientId === task.clientId;
      }
      
      return false;
    });

    // Enrich tasks with related data
    const enrichedTasks = await Promise.all(
      visibleTasks.map(async (task) => {
        const [assignee, client, department, project] = await Promise.all([
          task.assigneeId ? ctx.db.get(task.assigneeId) : null,
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
          task.projectId ? ctx.db.get(task.projectId) : null,
        ]);

        return {
          ...task,
          assignee: assignee ? { _id: assignee._id, name: assignee.name, email: assignee.email } : null,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          project: project ? { _id: project._id, title: project.title } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Migration: Convert todos to tasks with taskType: 'personal'
// NOTE: This migration is no longer needed as todos table has been removed
// export const migrateTodosToTasks = mutation({
//   args: {},
//   handler: async (ctx, args) => {
//     // Migration code removed - todos table no longer exists
//     return { migratedCount: 0, errorCount: 0, totalTodos: 0 };
//   },
// });

// Query: Get current focus tasks (in-progress tasks for current user)
export const getMyCurrentFocus = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee_status", (q) => 
        q.eq("assigneeId", user._id).eq("status", "in_progress")
      )
      .order("asc")
      .collect();

    // Enrich with related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [client, department, project] = await Promise.all([
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
          task.projectId ? ctx.db.get(task.projectId) : null,
        ]);

        return {
          ...task,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          project: project ? { _id: project._id, title: project.title } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Query: Get active tasks (non-completed tasks for current user)
export const getMyActiveTasks = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Get all non-completed tasks assigned to user
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .filter((q) => q.neq(q.field("status"), "done"))
      .order("asc")
      .collect();

    // Enrich with related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [client, department, project] = await Promise.all([
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
          task.projectId ? ctx.db.get(task.projectId) : null,
        ]);

        return {
          ...task,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          project: project ? { _id: project._id, title: project.title } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Query: Get completed tasks (last 30 days)
export const getMyCompletedTasks = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("status"), "done"),
          q.gte(q.field("completedDate"), thirtyDaysAgo)
        )
      )
      .order("desc")
      .collect();

    // Enrich with related data
    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const [client, department, project] = await Promise.all([
          ctx.db.get(task.clientId),
          ctx.db.get(task.departmentId),
          task.projectId ? ctx.db.get(task.projectId) : null,
        ]);

        return {
          ...task,
          client: client ? { _id: client._id, name: client.name } : null,
          department: department ? { _id: department._id, name: department.name } : null,
          project: project ? { _id: project._id, title: project.title } : null,
        };
      })
    );

    return enrichedTasks;
  },
});

// Query: Get tasks across all active sprints (aggregated Kanban view)
export const getTasksForActiveSprints = query({
  args: {},
  handler: async (ctx, _args) => {
      const user = await getCurrentUser(ctx);
      if (!user) throw new Error("Authentication required");

      // Get all active sprints with role-based filtering
      let activeSprints = await ctx.db
        .query("sprints")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();

      if (user.role === "client") {
        if (!user.clientId) throw new Error("Client user must have clientId");
        activeSprints = activeSprints.filter((s) => s.clientId === user.clientId);
      } else if (user.role === "pm") {
        // PM can view sprints in their departments
        const departmentIds: string[] = (user.departmentIds ?? []) as unknown as string[];
        activeSprints = activeSprints.filter((s) => departmentIds.includes(s.departmentId as unknown as string));
      }

      if (activeSprints.length === 0) return [];

      // Load tasks for each active sprint
      const tasksBySprint = await Promise.all(
        activeSprints.map(async (sprint) => {
          const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_sprint", (q) => q.eq("sprintId", sprint._id))
            .collect();
          // Filter out archived tasks for Kanban
          return tasks.filter((t) => t.status !== "archived");
        })
      );

      const allTasks = tasksBySprint.flat();

      // Apply task-level role permissions for task_owner specifically
      const visibleTasks = [] as any[];
      for (const task of allTasks) {
        if (await canUserViewTask(ctx, user, task)) {
          visibleTasks.push(task);
        }
      }

      // Enrich with related entities for compact card display
      const enrichedTasks = await Promise.all(
        visibleTasks.map(async (task) => {
          const [assignee, reporter, client, department, project, sprint] = await Promise.all([
            task.assigneeId ? ctx.db.get(task.assigneeId) : null,
            ctx.db.get(task.reporterId),
            ctx.db.get(task.clientId),
            ctx.db.get(task.departmentId),
            task.projectId ? ctx.db.get(task.projectId) : null,
            task.sprintId ? ctx.db.get(task.sprintId) : null,
          ]);

          return {
            ...task,
            assignee,
            reporter,
            client: client
              ? { _id: client._id, name: (client as any).name, logo: (client as any).logo }
              : null,
            department,
            project: project ? { _id: project._id, title: (project as any).title } : null,
            sprint: sprint ? { _id: sprint._id, name: (sprint as any).name } : null,
          };
        })
      );

      // Return sorted by updatedAt desc for stable ordering
      return enrichedTasks.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  },
});

// Mutation: Reorder tasks and optionally update status
export const reorderMyTasks = mutation({
  args: {
    taskIds: v.array(v.id("tasks")),
    targetStatus: v.optional(v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('review'),
      v.literal('done'),
      v.literal('archived')
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Verify all tasks belong to current user
    const tasks = await Promise.all(
      args.taskIds.map(async (taskId) => {
        const task = await ctx.db.get(taskId);
        if (!task || task.assigneeId !== user._id) {
          throw new Error(`Task ${taskId} not found or not assigned to user`);
        }
        return task;
      })
    );

    // Update each task with new order and optionally status
    for (let i = 0; i < args.taskIds.length; i++) {
      const taskId = args.taskIds[i];
      const updateData: any = {
        personalOrderIndex: i,
        updatedBy: user._id,
        updatedAt: Date.now(),
      };

      // If targetStatus is provided, update status
      if (args.targetStatus) {
        updateData.status = args.targetStatus;
        
        // Set completedDate if marking as done
        if (args.targetStatus === 'done') {
          updateData.completedDate = Date.now();
        } else {
          updateData.completedDate = undefined;
        }
      }

      await ctx.db.patch(taskId, updateData);
    }

    return { success: true, reorderedCount: args.taskIds.length };
  },
});

// Mutation: Create personal todo
export const createPersonalTodo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high'),
      v.literal('urgent')
    ),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Get the next order number for this user
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_assignee", (q) => q.eq("assigneeId", user._id))
      .collect();

    const nextOrder = existingTasks.length;

    // Get default client and department for personal todos
    const userData = await ctx.db.get(user._id);
    if (!userData) {
      throw new Error("User not found");
    }
    
    // Type assertion to access user-specific fields
    const userRecord = userData as any;
    let defaultClientId = userRecord.clientId;
    let defaultDepartmentId = userRecord.departmentIds?.[0];

    const now = Date.now();
    
    // If user doesn't have client/department assigned, create or use default ones
    if (!defaultClientId) {
      // Create a default "Personal" client for this user
      defaultClientId = await ctx.db.insert("clients", {
        name: "Personal",
        status: "active",
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
      
      // Update user with the new client
      await ctx.db.patch(user._id, {
        clientId: defaultClientId,
        updatedAt: now,
      });
    }

    if (!defaultDepartmentId) {
      // Create a default "Personal" department for this user
      defaultDepartmentId = await ctx.db.insert("departments", {
        name: "Personal",
        clientId: defaultClientId,
        primaryContactId: user._id,
        leadId: user._id,
        teamMemberIds: [],
        workstreamCount: 1,
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      });
      
      // Update user with the new department
      await ctx.db.patch(user._id, {
        departmentIds: [defaultDepartmentId],
        updatedAt: now,
      });
    }
    const taskId = await ctx.db.insert("tasks", {
      title: args.title.trim(),
      description: args.description?.trim(),
      status: "todo",
      priority: args.priority,
      dueDate: args.dueDate,
      taskType: "personal",
      personalOrderIndex: nextOrder,
      
      // Required fields
      clientId: defaultClientId,
      departmentId: defaultDepartmentId,
      reporterId: user._id,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
      
      // Assignment
      assigneeId: user._id,
      visibility: "private",
    });

    return taskId;
  },
});

// Migration: Update existing task sizes to new format
export const migrateTaskSizes = mutation({
  args: {},
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");
    
    if (user.role !== 'admin') {
      throw new Error("Insufficient permissions to run migration");
    }

    // Get all tasks with old size values
    const tasks = await ctx.db.query("tasks").collect();
    
    let updatedCount = 0;
    let errorCount = 0;

    for (const task of tasks) {
      try {
        if (task.size) {
          let newSize: string;
          
          // Map old sizes to new sizes (using string comparison)
          const oldSize = task.size as string;
          switch (oldSize) {
            case 'xs':
              newSize = 'XS';
              break;
            case 'sm':
              newSize = 'S';
              break;
            case 'md':
              newSize = 'M';
              break;
            case 'lg':
              newSize = 'L';
              break;
            case 'xl':
              newSize = 'XL';
              break;
            default:
              // Skip if already in new format
              continue;
          }

          // Update the task with new size
          await ctx.db.patch(task._id, {
            size: newSize as any,
            updatedAt: Date.now(),
          });
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`Failed to update task ${task._id}:`, error);
        errorCount++;
      }
    }

    return {
      updatedCount,
      errorCount,
      totalTasks: tasks.length,
    };
  },
});