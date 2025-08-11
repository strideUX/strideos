import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Seed the default organization (run once)
export const seedOrganization = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can seed the organization');
    }

    // Check if organization already exists
    const existingOrg = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();

    if (existingOrg) {
      throw new Error('Organization already exists');
    }

    // Create the organization
    const orgId = await ctx.db.insert('organizations', {
      name: 'strideUX',
      slug: 'strideux',
      website: 'https://strideux.io/',
      timezone: 'America/New_York',
      
      // Sprint defaults
      defaultWorkstreamCapacity: 32, // 4 days per 2-week sprint
      defaultSprintDuration: 2, // 2-week sprints
      
      // Email configuration
      emailFromAddress: 'admin@strideux.io',
      emailFromName: 'strideUX',
      primaryColor: '#0E1828', // Dark blue/navy
      
      // Features
      features: {
        emailInvitations: true,
        slackIntegration: false,
        clientPortal: false,
      },
      
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { organizationId: orgId, message: 'Organization created successfully' };
  },
});

// Migrate existing users to have organizationId
export const migrateUsersToOrganization = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can run migrations');
    }

    // Get the organization
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();

    if (!organization) {
      throw new Error('Organization not found. Run seedOrganization first.');
    }

    // Get all users without organizationId
    const users = await ctx.db
      .query('users')
      .collect();

    let updatedCount = 0;
    for (const user of users) {
      if (!user.organizationId) {
        await ctx.db.patch(user._id, {
          organizationId: organization._id,
        });
        updatedCount++;
      }
    }

    return { 
      message: `Migration complete. Updated ${updatedCount} users.`,
      organizationId: organization._id,
      updatedCount,
    };
  },
});

// Get the current organization
export const getCurrentOrganization = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    // For now, return the single organization
    // In the future, this could be based on user.organizationId
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_slug', (q) => q.eq('slug', 'strideux'))
      .first();

    return organization;
  },
});

// Update organization settings (admin only)
export const updateOrganization = mutation({
  args: {
    organizationId: v.id('organizations'),
    name: v.optional(v.string()),
    website: v.optional(v.string()),
    timezone: v.optional(v.string()),
    defaultWorkstreamCapacity: v.optional(v.number()),
    defaultSprintDuration: v.optional(v.number()),
    emailFromAddress: v.optional(v.string()),
    emailFromName: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    features: v.optional(v.object({
      emailInvitations: v.boolean(),
      slackIntegration: v.boolean(),
      clientPortal: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update organization settings');
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    // Only update provided fields
    if (args.name !== undefined) updateData.name = args.name;
    if (args.website !== undefined) updateData.website = args.website;
    if (args.timezone !== undefined) updateData.timezone = args.timezone;
    if (args.defaultWorkstreamCapacity !== undefined) updateData.defaultWorkstreamCapacity = args.defaultWorkstreamCapacity;
    if (args.defaultSprintDuration !== undefined) updateData.defaultSprintDuration = args.defaultSprintDuration;
    if (args.emailFromAddress !== undefined) updateData.emailFromAddress = args.emailFromAddress;
    if (args.emailFromName !== undefined) updateData.emailFromName = args.emailFromName;
    if (args.primaryColor !== undefined) updateData.primaryColor = args.primaryColor;
    if (args.features !== undefined) updateData.features = args.features;

    await ctx.db.patch(args.organizationId, updateData);

    return { message: 'Organization updated successfully' };
  },
});

// Generate upload URL for organization logo
export const generateLogoUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can upload organization logos');
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Update organization logo
export const updateOrganizationLogo = mutation({
  args: {
    organizationId: v.id('organizations'),
    storageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can update organization logos');
    }

    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    await ctx.db.patch(args.organizationId, {
      logo: args.storageId,
      updatedAt: Date.now(),
    });

    return { message: 'Organization logo updated successfully' };
  },
});

// Get organization logo URL
export const getOrganizationLogoUrl = query({
  args: {
    storageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    if (!args.storageId) {
      return null;
    }

    return await ctx.storage.getUrl(args.storageId);
  },
});