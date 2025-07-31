import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

// Helper function to get current user
async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

// Create a new personal todo
export const createTodo = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high')
    ),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    // Validate title
    if (!args.title.trim()) {
      throw new Error('Todo title is required');
    }

    // Get the next order number for this user
    const existingTodos = await ctx.db
      .query('todos')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    const nextOrder = existingTodos.length;

    const now = Date.now();
    const todoId = await ctx.db.insert('todos', {
      userId: user._id,
      title: args.title.trim(),
      description: args.description?.trim(),
      status: 'todo',
      priority: args.priority,
      dueDate: args.dueDate,
      completedAt: undefined,
      order: nextOrder,
      tags: args.tags || [],
      createdAt: now,
      updatedAt: now,
    });

    // Create user task order entry
    await ctx.db.insert('userTaskOrders', {
      userId: user._id,
      taskId: undefined,
      todoId: todoId,
      order: nextOrder,
      createdAt: now,
    });

    return todoId;
  },
});

// Get user's todos with filtering
export const getUserTodos = query({
  args: {
    status: v.optional(v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('done'),
      v.literal('archived')
    )),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high')
    )),
    includeArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    let todos;

    // Apply filters
    if (args.status) {
      todos = await ctx.db
        .query('todos')
        .withIndex('by_user_status', (q) => q.eq('userId', user._id).eq('status', args.status!))
        .collect();
    } else if (args.priority) {
      todos = await ctx.db
        .query('todos')
        .withIndex('by_user_priority', (q) => q.eq('userId', user._id).eq('priority', args.priority!))
        .collect();
    } else {
      todos = await ctx.db
        .query('todos')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
    }

    // Filter out archived unless specifically requested
    if (!args.includeArchived) {
      todos = todos.filter(todo => todo.status !== 'archived');
    }

    // Sort by order
    todos.sort((a, b) => a.order - b.order);

    return todos;
  },
});

// Update a todo
export const updateTodo = mutation({
  args: {
    todoId: v.id('todos'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('done'),
      v.literal('archived')
    )),
    priority: v.optional(v.union(
      v.literal('low'),
      v.literal('medium'),
      v.literal('high')
    )),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const todo = await ctx.db.get(args.todoId);
    if (!todo) throw new Error('Todo not found');
    if (todo.userId !== user._id) throw new Error('Not authorized to update this todo');

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) {
      if (!args.title.trim()) throw new Error('Todo title is required');
      updates.title = args.title.trim();
    }
    if (args.description !== undefined) {
      updates.description = args.description?.trim();
    }
    if (args.status !== undefined) {
      updates.status = args.status;
      if (args.status === 'done') {
        updates.completedAt = Date.now();
      } else {
        updates.completedAt = undefined;
      }
    }
    if (args.priority !== undefined) {
      updates.priority = args.priority;
    }
    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
    }
    if (args.tags !== undefined) {
      updates.tags = args.tags;
    }

    await ctx.db.patch(args.todoId, updates);
    return args.todoId;
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: {
    todoId: v.id('todos'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const todo = await ctx.db.get(args.todoId);
    if (!todo) throw new Error('Todo not found');
    if (todo.userId !== user._id) throw new Error('Not authorized to delete this todo');

    // Delete the todo
    await ctx.db.delete(args.todoId);

    // Delete from user task orders
    const orderEntry = await ctx.db
      .query('userTaskOrders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('todoId'), args.todoId))
      .first();

    if (orderEntry) {
      await ctx.db.delete(orderEntry._id);
    }

    return args.todoId;
  },
});

// Reorder todos
export const reorderTodos = mutation({
  args: {
    todoIds: v.array(v.id('todos')),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    // Verify all todos belong to the user
    const todos = await Promise.all(
      args.todoIds.map(id => ctx.db.get(id))
    );

    for (const todo of todos) {
      if (!todo || todo.userId !== user._id) {
        throw new Error('Not authorized to reorder these todos');
      }
    }

    // Update order for each todo
    const updates = args.todoIds.map((todoId, index) => 
      ctx.db.patch(todoId, { order: index, updatedAt: Date.now() })
    );

    await Promise.all(updates);

    // Update user task orders
    const orderEntries = await ctx.db
      .query('userTaskOrders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.or(...args.todoIds.map(id => q.eq(q.field('todoId'), id))))
      .collect();

    const orderUpdates = orderEntries.map((entry, index) => 
      ctx.db.patch(entry._id, { order: index })
    );

    await Promise.all(orderUpdates);

    return args.todoIds;
  },
});

// Get unified task/todo list for user
export const getUnifiedTaskList = query({
  args: {
    status: v.optional(v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('done'),
      v.literal('archived')
    )),
    filter: v.optional(v.union(
      v.literal('all'),
      v.literal('tasks'),
      v.literal('todos')
    )),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const filter = args.filter || 'all';
    const status = args.status;

    let tasks: any[] = [];
    let todos: any[] = [];

    // Get tasks if needed
    if (filter === 'all' || filter === 'tasks') {
      let taskQuery = ctx.db.query('tasks');
      
      // Apply role-based filtering
      if (user.role === 'task_owner') {
        taskQuery = taskQuery.filter((q) => q.eq(q.field('assigneeId'), user._id));
      }
      
      if (status) {
        taskQuery = taskQuery.filter((q) => q.eq(q.field('status'), status));
      }
      
      tasks = await taskQuery.collect();
    }

    // Get todos if needed
    if (filter === 'all' || filter === 'todos') {
      let todoQuery = ctx.db.query('todos').withIndex('by_user', (q) => q.eq('userId', user._id));
      
      if (status) {
        todoQuery = ctx.db.query('todos').withIndex('by_user_status', (q) => 
          q.eq('userId', user._id).eq('status', status)
        );
      }
      
      todos = await todoQuery.collect();
    }

    // Get user task orders for unified ordering
    const userTaskOrders = await ctx.db
      .query('userTaskOrders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    // Create unified list with order information
    const unifiedList = [];

    // Add tasks with order info
    for (const task of tasks) {
      const orderEntry = userTaskOrders.find(entry => entry.taskId === task._id);
      unifiedList.push({
        id: task._id,
        type: 'task',
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignee: task.assigneeId,
        dueDate: task.dueDate,
        order: orderEntry?.order ?? 999999, // Default high order for unordered items
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        data: task,
      });
    }

    // Add todos with order info
    for (const todo of todos) {
      const orderEntry = userTaskOrders.find(entry => entry.todoId === todo._id);
      unifiedList.push({
        id: todo._id,
        type: 'todo',
        title: todo.title,
        description: todo.description,
        status: todo.status,
        priority: todo.priority,
        assignee: null, // Todos are personal
        dueDate: todo.dueDate,
        order: orderEntry?.order ?? todo.order,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt,
        data: todo,
      });
    }

    // Sort by order
    unifiedList.sort((a, b) => a.order - b.order);

    return unifiedList;
  },
});

// Update unified task/todo order
export const updateUnifiedOrder = mutation({
  args: {
    items: v.array(v.object({
      id: v.string(),
      type: v.union(v.literal('task'), v.literal('todo')),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');

    const now = Date.now();

    for (const item of args.items) {
      if (item.type === 'todo') {
        // Update todo order
        await ctx.db.patch(item.id as Id<'todos'>, { 
          order: item.order, 
          updatedAt: now 
        });
      }

      // Update or create user task order entry
      const existingOrder = await ctx.db
        .query('userTaskOrders')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .filter((q) => 
          item.type === 'task' 
            ? q.eq(q.field('taskId'), item.id)
            : q.eq(q.field('todoId'), item.id)
        )
        .first();

      if (existingOrder) {
        await ctx.db.patch(existingOrder._id, { order: item.order });
      } else {
        await ctx.db.insert('userTaskOrders', {
          userId: user._id,
          taskId: item.type === 'task' ? item.id as Id<'tasks'> : undefined,
          todoId: item.type === 'todo' ? item.id as Id<'todos'> : undefined,
          order: item.order,
          createdAt: now,
        });
      }
    }

    return args.items;
  },
}); 