import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Size to story points mapping
const SIZE_TO_POINTS = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 5,
  xl: 8,
} as const;

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
    projectId: v.optional(v.id("projects")),
    clientId: v.id("clients"),
    departmentId: v.id("departments"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    size: v.optional(v.union(
      v.literal("xs"),
      v.literal("sm"),
      v.literal("md"),
      v.literal("lg"),
      v.literal("xl")
    )),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    category: v.optional(v.union(
      v.literal("feature"),
      v.literal("bug"),
      v.literal("improvement"),
      v.literal("research"),
      v.literal("documentation"),
      v.literal("maintenance")
    )),
    visibility: v.optional(v.union(
      v.literal("private"),
      v.literal("team"),
      v.literal("department"),
      v.literal("client")
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Authentication required");

    // Check permissions - only admin and PM can create tasks
    if (!["admin", "pm"].includes(user.role)) {
      throw new Error("Only admins and PMs can create tasks");
    }

    // Calculate story points from size
    const storyPoints = args.size ? SIZE_TO_POINTS[args.size] : undefined;

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
      status: "todo",
      priority: args.priority,
      size: args.size,
      storyPoints,
      assigneeId: args.assigneeId,
      reporterId: user._id,
      dueDate: args.dueDate,
      labels: args.labels,
      category: args.category,
      visibility: args.visibility ?? "department",
      backlogOrder,
      createdBy: user._id,
      updatedBy: user._id,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

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
      v.literal("xs"),
      v.literal("sm"),
      v.literal("md"),
      v.literal("lg"),
      v.literal("xl")
    )),
    assigneeId: v.optional(v.id("users")),
    dueDate: v.optional(v.number()),
    labels: v.optional(v.array(v.string())),
    category: v.optional(v.union(
      v.literal("feature"),
      v.literal("bug"),
      v.literal("improvement"),
      v.literal("research"),
      v.literal("documentation"),
      v.literal("maintenance")
    )),
    visibility: v.optional(v.union(
      v.literal("private"),
      v.literal("team"),
      v.literal("department"),
      v.literal("client")
    )),
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
      updateData.storyPoints = SIZE_TO_POINTS[args.size];
    }
    if (args.clientId !== undefined) updateData.clientId = args.clientId;
    if (args.departmentId !== undefined) updateData.departmentId = args.departmentId;
    if (args.projectId !== undefined) updateData.projectId = args.projectId;
    if (args.assigneeId !== undefined) updateData.assigneeId = args.assigneeId;
    if (args.dueDate !== undefined) updateData.dueDate = args.dueDate;
    if (args.labels !== undefined) updateData.labels = args.labels;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.visibility !== undefined) updateData.visibility = args.visibility;
    if (args.estimatedHours !== undefined) updateData.estimatedHours = args.estimatedHours;
    if (args.actualHours !== undefined) updateData.actualHours = args.actualHours;

    await ctx.db.patch(args.id, updateData);
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

    // Check sprint capacity if assigning to sprint
    if (args.sprintId) {
      const sprint = await ctx.db.get(args.sprintId);
      if (!sprint) throw new Error("Sprint not found");
      
      // Calculate current committed points
      const sprintTasks = await ctx.db
        .query("tasks")
        .withIndex("by_sprint", (q) => q.eq("sprintId", args.sprintId))
        .collect();
      
      const currentCommitted = sprintTasks
        .filter((t) => t._id !== args.taskId) // Exclude current task
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
      
      const taskPoints = task.storyPoints ?? 0;
      
      if (currentCommitted + taskPoints > sprint.totalCapacity) {
        throw new Error("Sprint capacity exceeded");
      }
    }

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