import { mutation } from './_generated/server';

// Seed function to populate the database with test data
export const seed = mutation({
  handler: async (ctx) => {
    // Create some test counters
    await ctx.db.insert('counters', {
      name: 'test-counter',
      count: 42,
    });

    await ctx.db.insert('counters', {
      name: 'demo-counter',
      count: 100,
    });

    await ctx.db.insert('counters', {
      name: 'feature-counter',
      count: 7,
    });

    return { success: true, message: 'Database seeded with test data' };
  },
}); 