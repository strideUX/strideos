import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Query to get a counter by name
export const get = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    
    return counter ?? { name: args.name, count: 0 };
  },
});

// Query to list all counters
export const list = query({
  handler: async (ctx) => {
    const counters = await ctx.db.query('counters').collect();
    return counters;
  },
});

// Mutation to increment a counter
export const increment = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    
    if (counter) {
      // Update existing counter
      await ctx.db.patch(counter._id, { count: counter.count + 1 });
      return counter._id;
    } else {
      // Create new counter
      return await ctx.db.insert('counters', {
        name: args.name,
        count: 1,
      });
    }
  },
});

// Mutation to set a counter value
export const set = mutation({
  args: { name: v.string(), count: v.number() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    
    if (counter) {
      // Update existing counter
      await ctx.db.patch(counter._id, { count: args.count });
      return counter._id;
    } else {
      // Create new counter
      return await ctx.db.insert('counters', {
        name: args.name,
        count: args.count,
      });
    }
  },
});

// Mutation to delete a counter
export const remove = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const counter = await ctx.db
      .query('counters')
      .withIndex('by_name', (q) => q.eq('name', args.name))
      .first();
    
    if (counter) {
      await ctx.db.delete(counter._id);
      return true;
    }
    return false;
  },
}); 