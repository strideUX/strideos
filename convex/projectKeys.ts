import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

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