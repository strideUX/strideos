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
      status: "active" as const, // Default status for new users
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
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // For password provider, check if we have an existing user with this email
      // (created via admin invitation)
      if (args.type === 'credentials') {
        const existingUser = await ctx.db
          .query('users')
          .filter((q) => q.eq(q.field('email'), args.profile.email as string))
          .first();
        
        if (existingUser) {
          // Update the existing user with auth info and activate
          await ctx.db.patch(existingUser._id, {
            status: 'active',
            updatedAt: Date.now(),
          });
          return existingUser._id;
        }
      }

      // Create new user if none exists (normal sign-up flow)
      return await ctx.db.insert('users', {
        email: args.profile.email as string,
        name: args.profile.name as string,
        role: args.profile.role as any || 'pm',
        status: 'active',
        organizationId: undefined, // Will be set later if needed
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    },
  },
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

// Mutation to update user role (for development testing)
export const updateUserRole = mutation({
  args: { 
    role: v.union(
      v.literal('admin'),
      v.literal('pm'),
      v.literal('task_owner'),
      v.literal('client')
    )
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }
    
    // Update the user's role
    const updatedUser = await ctx.db.patch(userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
    
    return updatedUser;
  },
});

// Create password reset token for user invitation
export const createPasswordResetToken = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const currentUserId = await auth.getUserId(ctx);
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }

    // Get current user to check permissions
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'pm')) {
      throw new Error('Insufficient permissions to create password reset tokens');
    }

    // Get the user to create token for
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate secure token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + (48 * 60 * 60 * 1000); // 48 hours

    // Store the token
    const tokenId = await ctx.db.insert('passwordResets', {
      userId: args.userId,
      token,
      expiresAt,
      used: false,
      createdAt: Date.now(),
    });

    return {
      tokenId,
      token,
      expiresAt,
    };
  },
});

// Validate password reset token
export const validatePasswordResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const resetRecord = await ctx.db
      .query('passwordResets')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!resetRecord) {
      return { valid: false, error: 'Invalid token' };
    }

    if (resetRecord.used) {
      return { valid: false, error: 'Token already used' };
    }

    if (Date.now() > resetRecord.expiresAt) {
      return { valid: false, error: 'Token expired' };
    }

    // Get user info
    const user = await ctx.db.get(resetRecord.userId);
    if (!user) {
      return { valid: false, error: 'User not found' };
    }

    return {
      valid: true,
      userId: resetRecord.userId,
      user: {
        name: user.name,
        email: user.email,
      },
    };
  },
});

// Set password with token and activate user
export const setPasswordWithToken = mutation({
  args: {
    token: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate password requirements
    if (args.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate token
    const resetRecord = await ctx.db
      .query('passwordResets')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .first();

    if (!resetRecord) {
      throw new Error('Invalid token');
    }

    if (resetRecord.used) {
      throw new Error('Token already used');
    }

    if (Date.now() > resetRecord.expiresAt) {
      throw new Error('Token expired');
    }

    // Get user
    const user = await ctx.db.get(resetRecord.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // The auth account will be created automatically when the user calls signIn 
    // from the client-side with the password. The createOrUpdateUser callback will
    // find the existing user and activate them.

    // Mark token as used
    await ctx.db.patch(resetRecord._id, {
      used: true,
    });

    return {
      success: true,
      userId: resetRecord.userId,
    };
  },
});

// Helper function to validate password strength
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("One number");
  return { valid: errors.length === 0, errors };
}

 