import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Sign in mutation
export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // For now, we'll implement a simple email/password check
    // In a real implementation, you'd want proper password hashing and validation
    
    // Check if user exists
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // In a real implementation, you'd verify the password hash here
    // For now, we'll just return success if the user exists
    return { success: true, userId: user._id };
  },
});

// Sign up mutation
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      email: args.email,
      name: args.name,
      role: 'pm', // Default role
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, userId };
  },
});

// Query to get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Get user from database by email
    if (!identity.email) {
      return null;
    }
    
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => 
        q.eq('email', identity.email!)
      )
      .first();

    return user;
  },
});

// Mutation to create or update user
export const createOrUpdateUser = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    const email = identity.email;
    if (!email) {
      throw new Error('Email is required');
    }
    
    const name = identity.name || email.split('@')[0] || 'Unknown User';

    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => 
        q.eq('email', email)
      )
      .first();

    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        email: email!,
        name,
        updatedAt: Date.now(),
      });
    } else {
      // Create new user
      return await ctx.db.insert('users', {
        email: email!,
        name,
        role: 'pm', // Default role
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  },
});

// Sign out mutation
export const signOut = mutation({
  handler: async (ctx) => {
    // In a real implementation, you'd invalidate the session
    // For now, we'll just return success
    return { success: true };
  },
});

// Query to get user by ID
export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Mutation to update user role (admin only)
export const updateUserRole = mutation({
  args: { 
    userId: v.id('users'),
    role: v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Not authenticated');
    }

    // Get current user to check if they're admin
    if (!identity.email) {
      throw new Error('Email is required');
    }
    
    const currentUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => 
        q.eq('email', identity.email!)
      )
      .first();

    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can update user roles');
    }

    return await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
}); 