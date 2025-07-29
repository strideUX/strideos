import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { DataModel } from "./_generated/dataModel";
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

// Configure the Password provider with custom profile
const PasswordProvider = Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
      role: "pm", // Default role for new users
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
  validatePasswordRequirements(password) {
    if (password.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }
  },
});

// Export the Convex Auth configuration
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordProvider],
});

// Query to get current user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    
    return await ctx.db.get(userId);
  },
});

// Mutation to create or update user profile
export const createOrUpdateUser = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    // Get the current user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  },
});

// Query to get user by ID
export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
}); 