import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Simplified slug generation - using client's projectKey directly
export const generateTaskSlug = mutation({
  args: {
    projectId: v.id('projects'),
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');
    if (task.slug) return task.slug; // Already has a slug

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    const client = await ctx.db.get(project.clientId);
    if (!client) throw new Error('Client not found');
    
    // Use client's project key, or generate one if missing (for migration)
    let projectKey = client.projectKey;
    if (!projectKey) {
      // For backwards compatibility during migration
      throw new Error('Client does not have a project key. Please update the client first.');
    }

    // Find or create the project key record
    let keyRecord = await ctx.db
      .query('projectKeys')
      .withIndex('by_key', (q: any) => q.eq('key', projectKey))
      .first();

    if (!keyRecord) {
      // Create a new project key record for this client
      const keyId = await ctx.db.insert('projectKeys', {
        key: projectKey,
        description: `Tasks for ${client.name}`,
        clientId: project.clientId,
        departmentId: undefined, // No longer using department scoping
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        lastProjectNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: project.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      keyRecord = await ctx.db.get(keyId);
    }

    if (!keyRecord) throw new Error('Failed to create project key record');

    // Atomically increment the task counter
    while (true) {
      const fresh: any = await ctx.db.get(keyRecord._id);
      if (!fresh) throw new Error('Project key disappeared');
      const nextNum = (fresh.lastTaskNumber ?? 0) + 1;
      try {
        await ctx.db.patch(fresh._id, { 
          lastTaskNumber: nextNum, 
          updatedAt: Date.now() 
        });
        const slug = `${fresh.key}-${nextNum}`;
        await ctx.db.patch(args.taskId, { 
          slug, 
          slugKey: fresh.key, 
          slugNumber: nextNum, 
          updatedAt: Date.now() 
        });
        return slug;
      } catch (_e) {
        // retry on conflict
      }
    }
  }
});

export const generateSprintSlug = mutation({
  args: {
    sprintId: v.id('sprints'),
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error('Sprint not found');
    if (sprint.slug) return sprint.slug;

    const client = await ctx.db.get(sprint.clientId);
    if (!client) throw new Error('Client not found');
    
    let projectKey = client.projectKey;
    if (!projectKey) {
      throw new Error('Client does not have a project key. Please update the client first.');
    }

    // Find or create the project key record
    let keyRecord = await ctx.db
      .query('projectKeys')
      .withIndex('by_key', (q: any) => q.eq('key', projectKey))
      .first();

    if (!keyRecord) {
      const keyId = await ctx.db.insert('projectKeys', {
        key: projectKey,
        description: `Sprints for ${client.name}`,
        clientId: sprint.clientId,
        departmentId: undefined,
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        lastProjectNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: sprint.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      keyRecord = await ctx.db.get(keyId);
    }

    // Atomic increment for sprint number
    while (true) {
      const fresh: any = await ctx.db.get(keyRecord!._id);
      if (!fresh) throw new Error('Project key disappeared');
      const nextNum = (fresh.lastSprintNumber ?? 0) + 1;
      try {
        await ctx.db.patch(fresh._id, { 
          lastSprintNumber: nextNum, 
          updatedAt: Date.now() 
        });
        const slug = `${fresh.key}-S-${nextNum}`;
        await ctx.db.patch(args.sprintId, { 
          slug, 
          slugKey: fresh.key, 
          slugNumber: nextNum, 
          updatedAt: Date.now() 
        });
        return slug;
      } catch (_e) {
        // retry
      }
    }
  }
});

export const generateProjectSlug = mutation({
  args: { 
    projectId: v.id('projects') 
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    if (project.slug) return project.slug;

    const client = await ctx.db.get(project.clientId);
    if (!client) throw new Error('Client not found');
    
    let projectKey = client.projectKey;
    if (!projectKey) {
      throw new Error('Client does not have a project key. Please update the client first.');
    }

    // Find or create the project key record
    let keyRecord = await ctx.db
      .query('projectKeys')
      .withIndex('by_key', (q: any) => q.eq('key', projectKey))
      .first();

    if (!keyRecord) {
      // Create a new project key record for this client
      const keyId = await ctx.db.insert('projectKeys', {
        key: projectKey,
        description: `Projects for ${client.name}`,
        clientId: project.clientId,
        departmentId: undefined,
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        lastProjectNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: project.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      keyRecord = await ctx.db.get(keyId);
    }

    if (!keyRecord) throw new Error('Failed to create project key record');

    // Atomically increment the project counter
    while (true) {
      const fresh: any = await ctx.db.get(keyRecord._id);
      if (!fresh) throw new Error('Project key disappeared');
      const nextNum = (fresh.lastProjectNumber ?? 0) + 1;
      try {
        await ctx.db.patch(fresh._id, { 
          lastProjectNumber: nextNum, 
          updatedAt: Date.now() 
        });
        const slug = `${fresh.key}-P-${nextNum}`;
        await ctx.db.patch(args.projectId, { 
          slug, 
          projectKey: fresh.key, 
          updatedAt: Date.now() 
        });
        return slug;
      } catch (_e) {
        // retry on conflict
      }
    }
  }
});

// Same getBySlug query as before
export const getBySlug = query({
  args: {
    slug: v.string(),
    type: v.optional(v.union(v.literal('task'), v.literal('project'), v.literal('sprint'))),
  },
  handler: async (ctx, args) => {
    const value = args.slug.trim().toUpperCase();
    if (!value) return null;

    const isSprint = /-S-/.test(value);
    const hasHyphenNumber = /-\d+$/.test(value);

    if (args.type === 'project') {
      const proj = await ctx.db.query('projects').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
      return proj || null;
    }

    if (args.type === 'sprint' || isSprint) {
      const s = await ctx.db.query('sprints').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
      return s || null;
    }

    if (args.type === 'task' || hasHyphenNumber) {
      const t = await ctx.db.query('tasks').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
      return t || null;
    }

    // Fallback: try in order task -> project -> sprint
    const t = await ctx.db.query('tasks').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
    if (t) return t;
    const p = await ctx.db.query('projects').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
    if (p) return p;
    const s = await ctx.db.query('sprints').withIndex('by_slug', (q: any) => q.eq('slug', value)).first();
    if (s) return s;

    return null;
  }
});