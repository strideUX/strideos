import { mutation, query } from './_generated/server'; // keep path relative to this file, as others do
import { v } from 'convex/values';
import { auth } from './auth';

function toKeyCandidate(input: string): string {
  const alnum = (input || '').toUpperCase().replace(/[^A-Z0-9]/g, ' ');
  const words = alnum.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  // Prefer acronym up to 6 chars; fallback to first 6 chars of joined string
  const acronym = words.map(w => w[0]).join('').slice(0, 6);
  if (acronym.length >= 2) return acronym;
  const joined = words.join('');
  return joined.slice(0, 6);
}

async function getCurrentUser(ctx: any) {
  const userId = await auth.getUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

async function findDefaultProjectKey(ctx: any, clientId: any, departmentId?: any) {
  if (departmentId) {
    const byDefault = await ctx.db
      .query('projectKeys')
      .withIndex('by_default', (q: any) => q.eq('clientId', clientId).eq('departmentId', departmentId).eq('isDefault', true))
      .first();
    if (byDefault) return byDefault;
  }
  const clientDefault = await ctx.db
    .query('projectKeys')
    .withIndex('by_default', (q: any) => q.eq('clientId', clientId).eq('departmentId', undefined as any).eq('isDefault', true))
    .first();
  return clientDefault || null;
}

export const generateProjectKey = mutation({
  args: {
    clientId: v.id('clients'),
    departmentId: v.optional(v.id('departments')),
    customKey: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error('Authentication required');
    if (!['admin', 'pm'].includes(user.role)) throw new Error('Permission denied');

    const client = await ctx.db.get(args.clientId);
    if (!client) throw new Error('Client not found');
    const department = args.departmentId ? await ctx.db.get(args.departmentId) : null;

    const baseKey = (args.customKey || toKeyCandidate(`${client.name}${department ? '-' + department.name : ''}`)).toUpperCase();
    if (!baseKey || baseKey.length < 2) throw new Error('Unable to generate a valid key');

    // Ensure uniqueness; if conflict, append numeric suffix
    let candidate = baseKey.slice(0, 6);
    let suffix = 0;
    // Limit attempts to prevent infinite loop
    while (true) {
      const existing = await ctx.db
        .query('projectKeys')
        .withIndex('by_key', (q: any) => q.eq('key', candidate))
        .first();
      if (!existing) break;
      suffix += 1;
      const next = `${baseKey}${suffix}`;
      candidate = next.slice(0, 8); // allow slightly longer when suffixed
      if (suffix > 9999) throw new Error('Failed to find unique key');
    }

    const now = Date.now();
    const keyId = await ctx.db.insert('projectKeys', {
      key: candidate,
      description: args.description,
      clientId: args.clientId,
      departmentId: args.departmentId,
      projectId: undefined,
      lastTaskNumber: 0,
      lastSprintNumber: 0,
      isDefault: args.isDefault ?? true,
      isActive: true,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // If isDefault true, ensure only one default per scope
    if (args.isDefault ?? true) {
      const others = await ctx.db
        .query('projectKeys')
        .withIndex('by_client', (q: any) => q.eq('clientId', args.clientId))
        .collect();
      for (const k of others) {
        if (k._id !== keyId && k.isDefault && k.departmentId === (args.departmentId || undefined)) {
          await ctx.db.patch(k._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    return keyId;
  }
});

export const generateTaskSlug = mutation({
  args: {
    projectId: v.id('projects'),
    taskId: v.id('tasks'),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');
    if (task.slug) return task.slug;

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    // Find default key for department, fallback to client
    let key = await findDefaultProjectKey(ctx, project.clientId, project.departmentId);
    if (!key) {
      // Create a default key on the fly (minimal fallback)
      const keyId = await ctx.db.insert('projectKeys', {
        key: toKeyCandidate('' + Date.now()),
        description: undefined,
        clientId: project.clientId,
        departmentId: project.departmentId,
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: project.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      key = await ctx.db.get(keyId);
    }
    if (!key) throw new Error('Failed to resolve project key');

    // Atomically increment counters by reading, then conditional patch
    // Loop to avoid race on concurrent writers
    // Note: Convex ensures each mutation is serializable, but we still re-read
    // in case of intermediate updates before patch
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const fresh: any = await ctx.db.get(key._id);
      if (!fresh) throw new Error('Project key disappeared');
      const nextNum = (fresh.lastTaskNumber ?? 0) + 1;
      try {
        await ctx.db.patch(fresh._id, { lastTaskNumber: nextNum, updatedAt: Date.now() });
        const slug = `${fresh.key}-${nextNum}`;
        await ctx.db.patch(args.taskId, { slug, slugKey: fresh.key, slugNumber: nextNum, updatedAt: Date.now() });
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

    // Resolve default key for client/department
    let key = await findDefaultProjectKey(ctx, sprint.clientId, sprint.departmentId);
    if (!key) {
      const keyId = await ctx.db.insert('projectKeys', {
        key: toKeyCandidate('' + Date.now()),
        description: undefined,
        clientId: sprint.clientId,
        departmentId: sprint.departmentId,
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: sprint.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      key = await ctx.db.get(keyId);
    }

    // Atomic increment for sprint number
    while (true) {
      const fresh: any = await ctx.db.get(key!._id);
      if (!fresh) throw new Error('Project key disappeared');
      const nextNum = (fresh.lastSprintNumber ?? 0) + 1;
      try {
        await ctx.db.patch(fresh._id, { lastSprintNumber: nextNum, updatedAt: Date.now() });
        const slug = `${fresh.key}-S-${nextNum}`;
        await ctx.db.patch(args.sprintId, { slug, slugKey: fresh.key, slugNumber: nextNum, updatedAt: Date.now() });
        return slug;
      } catch (_e) {
        // retry
      }
    }
  }
});

export const generateProjectSlug = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    if (project.slug) return project.slug;

    const dept = await ctx.db.get(project.departmentId);
    const year = new Date().getFullYear();
    // Basic project slug pattern; can be refined later
    let key = await findDefaultProjectKey(ctx, project.clientId, project.departmentId);
    if (!key) {
      const keyId = await ctx.db.insert('projectKeys', {
        key: toKeyCandidate('' + Date.now()),
        description: undefined,
        clientId: project.clientId,
        departmentId: project.departmentId,
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: project.createdBy,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      key = await ctx.db.get(keyId);
    }
    const base = `${key!.key}-P-${year}`;
    let candidate = base;
    let counter = 0;
    while (true) {
      const existing = await ctx.db.query('projects').withIndex('by_slug', (q: any) => q.eq('slug', candidate)).first();
      if (!existing) break;
      counter += 1;
      candidate = `${base}-${counter}`;
      if (counter > 9999) throw new Error('Failed to find unique project slug');
    }
    await ctx.db.patch(args.projectId, { slug: candidate, projectKey: key!.key, updatedAt: Date.now() });
    return candidate;
  }
});

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