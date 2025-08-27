import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';
import { Id } from './_generated/dataModel';

async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export const create = mutation({
  args: {
    description: v.optional(v.string()),
    departmentId: v.optional(v.id('departments')),
    isDefault: v.optional(v.boolean()),
    customKey: v.optional(v.string()),
    clientId: v.id('clients'),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');
    if (user.role !== 'admin') throw new Error('Permission denied');

    // Generate a unique key if not provided
    let key = args.customKey;
    if (!key) {
      // Generate from client name or use a default
      const client = await ctx.db.get(args.clientId);
      if (!client) throw new Error('Client not found');
      
      key = client.name.substring(0, 3).toUpperCase();
      if (key.length < 3) key = key.padEnd(3, 'X');
    }

    // Check if key already exists
    const existingKey = await ctx.db
      .query('projectKeys')
      .withIndex('by_key', (q) => q.eq('key', key))
      .first();

    if (existingKey) {
      throw new Error(`Project key "${key}" already exists`);
    }

    // Create the project key
    const projectKeyId = await ctx.db.insert('projectKeys', {
      key,
      description: args.description,
      clientId: args.clientId,
      departmentId: args.departmentId,
      lastTaskNumber: 0,
      lastSprintNumber: 0,
      lastProjectNumber: 0,
      isDefault: args.isDefault || false,
      isActive: true,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return projectKeyId;
  },
});

export const list = query({
  args: {
    clientId: v.optional(v.id('clients')),
    departmentId: v.optional(v.id('departments')),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');
    if (user.role !== 'admin') throw new Error('Permission denied');

    let keys: any[] = [];
    if (args.clientId) {
      keys = await ctx.db
        .query('projectKeys')
        .withIndex('by_client', (qi: any) => qi.eq('clientId', args.clientId))
        .collect();
    } else {
      keys = await ctx.db.query('projectKeys').collect();
    }

    return keys
      .filter((k) => (args.departmentId ? k.departmentId === args.departmentId : true))
      .filter((k) => (args.isActive !== undefined ? k.isActive === args.isActive : true))
      .sort((a, b) => a.key.localeCompare(b.key));
  },
});

export const update = mutation({
  args: {
    id: v.id('projectKeys'),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');
    if (user.role !== 'admin') throw new Error('Permission denied');

    const pk = await ctx.db.get(args.id);
    if (!pk) throw new Error('Project key not found');

    const updates: any = { updatedAt: Date.now() };
    if (args.description !== undefined) updates.description = args.description;
    if (args.isActive !== undefined) updates.isActive = args.isActive;
    if (args.isDefault !== undefined) updates.isDefault = args.isDefault;

    await ctx.db.patch(args.id, updates);

    // Ensure only one default per scope
    if (args.isDefault) {
      const siblings = await ctx.db
        .query('projectKeys')
        .withIndex('by_client', (qi: any) => qi.eq('clientId', pk.clientId))
        .collect();
      for (const s of siblings) {
        if (s._id !== args.id && s.isDefault && s.departmentId === pk.departmentId) {
          await ctx.db.patch(s._id, { isDefault: false, updatedAt: Date.now() });
        }
      }
    }

    return args.id;
  },
});
