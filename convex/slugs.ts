import { internalMutation, internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Utility: Normalize string to uppercase letters only, strip non-letters
function toLetters(input: string): string {
  return (input || '')
    .normalize('NFKD')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase();
}

// Utility: Build key candidates based on client/department
function generateKeyCandidates(clientName: string, departmentName?: string): string[] {
  const c = toLetters(clientName);
  const d = departmentName ? toLetters(departmentName) : '';
  const bases = [c.slice(0, 5), c.slice(0, 4), c.slice(0, 3)].filter(Boolean);
  const candidates: string[] = [];
  for (const base of bases) {
    candidates.push(base);
  }
  if (d) {
    const deptInitials = d.split(/\s+/).map((w) => w[0]).join('').slice(0, 3);
    for (const base of bases) {
      candidates.push(`${base}${deptInitials}`);
    }
  }
  return Array.from(new Set(candidates)).filter(Boolean);
}

// Internal: Ensure unique project key, append number suffix if needed
async function ensureUniqueKey(ctx: any, baseKey: string): Promise<string> {
  let key = baseKey;
  let suffix = 0;
  while (true) {
    const existing = await ctx.db
      .query('projectKeys')
      .withIndex('by_key', (q: any) => q.eq('key', key))
      .first();
    if (!existing) return key;
    suffix += 1;
    key = `${baseKey}${suffix}`;
  }
}

// Helper: ensure a project key exists for given project and return it
async function ensureProjectKeyExists(ctx: any, projectId: any): Promise<any> {
  let pk = await ctx.db
    .query('projectKeys')
    .withIndex('by_project', (q: any) => q.eq('projectId', projectId))
    .first();
  if (pk) return pk;

  const project = await ctx.db.get(projectId);
  if (!project) throw new Error('Project not found');
  const client = await ctx.db.get(project.clientId);
  const department = await ctx.db.get(project.departmentId);
  const candidates = generateKeyCandidates(client?.name || 'CLIENT', department?.name || 'DEPT');
  const base = candidates[0] || 'PRJ';
  const uniqueKey = await ensureUniqueKey(ctx, base);
  const now = Date.now();
  const insertedId = await ctx.db.insert('projectKeys', {
    key: uniqueKey,
    projectId,
    nextNumber: 1,
    clientId: project.clientId,
    departmentId: project.departmentId,
    createdAt: now,
    updatedAt: now,
  });
  pk = await ctx.db.get(insertedId);
  return pk;
}

// Internal mutation: generate unique project key for a given project (from client/department names)
export const generateProjectKey = internalMutation({
  args: {
    projectId: v.id('projects'),
    clientName: v.string(),
    departmentName: v.string(),
    overrideKey: v.optional(v.string()), // optional override
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');

    // If a key already exists for this project, return it
    const existingForProject = await ctx.db
      .query('projectKeys')
      .withIndex('by_project', (q: any) => q.eq('projectId', args.projectId))
      .first();
    if (existingForProject) return existingForProject.key;

    // Build candidates
    const override = args.overrideKey?.toUpperCase().trim();
    const candidates = override ? [override] : generateKeyCandidates(args.clientName, args.departmentName);

    // Find a unique key
    let chosen: string | null = null;
    for (const cand of candidates) {
      const unique = await ensureUniqueKey(ctx, cand);
      if (unique === cand) {
        chosen = unique;
        break;
      }
    }
    if (!chosen) {
      // Fall back to first candidate plus numeric suffix
      const base = candidates[0] || 'PRJ';
      chosen = await ensureUniqueKey(ctx, base);
    }

    // Create projectKeys row
    const now = Date.now();
    await ctx.db.insert('projectKeys', {
      key: chosen,
      projectId: args.projectId,
      nextNumber: 1,
      clientId: project.clientId,
      departmentId: project.departmentId,
      createdAt: now,
      updatedAt: now,
    });

    return chosen;
  },
});

// Internal mutation: atomic increment for next task number per project key
export const getNextTaskNumber = internalMutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const pk = await ensureProjectKeyExists(ctx, args.projectId);
    const next = pk.nextNumber;
    await ctx.db.patch(pk._id, { nextNumber: next + 1, updatedAt: Date.now() });
    return next; // return current then incremented
  },
});

// Helper: build slugs
function formatTaskSlug(key: string, number: number): string {
  return `${key}-${number}`;
}
function formatProjectSlug(key: string, index: number): string {
  return `${key}-P${index}`;
}
function formatSprintSlug(key: string, index: number): string {
  return `${key}-S${index}`;
}

// Public Mutation: Assign slug to a task (idempotent; immutable once set)
export const assignTaskSlug = mutation({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Authentication required');

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');
    if (task.slug) return task.slug; // immutable
    if (!task.projectId) throw new Error('Task must belong to a project to assign slug');

    // Ensure project key exists and get it
    const pk = await ensureProjectKeyExists(ctx, task.projectId);

    // Atomically increment within this mutation
    const next = pk.nextNumber;
    await ctx.db.patch(pk._id, { nextNumber: next + 1, updatedAt: Date.now() });
    const slug = formatTaskSlug(pk.key, next);

    await ctx.db.patch(args.taskId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

// Public Mutation: Assign slug to a project (P-series; idempotent)
export const assignProjectSlug = mutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Authentication required');

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    if (project.slug) return project.slug;

    // Ensure key exists
    const pk = await ensureProjectKeyExists(ctx, args.projectId);

    const slug = formatProjectSlug(pk.key, 1);
    await ctx.db.patch(args.projectId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

// Public Mutation: Assign slug to a sprint (S-series; idempotent)
export const assignSprintSlug = mutation({
  args: { sprintId: v.id('sprints'), projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error('Authentication required');

    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error('Sprint not found');
    if (sprint.slug) return sprint.slug;

    // Ensure key exists
    const pk = await ensureProjectKeyExists(ctx, args.projectId);

    // Use sequential index based on existing sprints in department
    const sprintsInDept = await ctx.db
      .query('sprints')
      .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
      .collect();
    const index = (sprintsInDept?.filter((s: any) => Boolean(s.slug)).length || 0) + 1;

    const slug = formatSprintSlug(pk.key, index);
    await ctx.db.patch(args.sprintId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

// Internal variants for migration without auth
export const assignTaskSlugInternal = internalMutation({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error('Task not found');
    if (task.slug) return task.slug;
    if (!task.projectId) return null;

    const pk = await ensureProjectKeyExists(ctx, task.projectId);

    const next = pk.nextNumber;
    await ctx.db.patch(pk._id, { nextNumber: next + 1, updatedAt: Date.now() });
    const slug = formatTaskSlug(pk.key, next);
    await ctx.db.patch(args.taskId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

export const assignProjectSlugInternal = internalMutation({
  args: { projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error('Project not found');
    if (project.slug) return project.slug;

    const pk = await ensureProjectKeyExists(ctx, args.projectId);

    const slug = formatProjectSlug(pk.key, 1);
    await ctx.db.patch(args.projectId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

export const assignSprintSlugInternal = internalMutation({
  args: { sprintId: v.id('sprints'), projectId: v.id('projects') },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error('Sprint not found');
    if (sprint.slug) return sprint.slug;

    const pk = await ensureProjectKeyExists(ctx, args.projectId);

    const sprintsInDept = await ctx.db
      .query('sprints')
      .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
      .collect();
    const index = (sprintsInDept?.filter((s: any) => Boolean(s.slug)).length || 0) + 1;

    const slug = formatSprintSlug(pk.key, index);
    await ctx.db.patch(args.sprintId, { slug, updatedAt: Date.now() });
    return slug;
  },
});

// Query: search by slug across tasks, projects, sprints
export const searchBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const slug = args.slug.toUpperCase().trim();

    const task = await ctx.db
      .query('tasks')
      .withIndex('by_slug', (q: any) => q.eq('slug', slug))
      .first();
    if (task) return { type: 'task', entity: task };

    const project = await ctx.db
      .query('projects')
      .withIndex('by_slug', (q: any) => q.eq('slug', slug))
      .first();
    if (project) return { type: 'project', entity: project };

    const sprint = await ctx.db
      .query('sprints')
      .withIndex('by_slug', (q: any) => q.eq('slug', slug))
      .first();
    if (sprint) return { type: 'sprint', entity: sprint };

    return null;
  },
});

// Internal queries to list all ids for migration
export const listAllProjectIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db.query('projects').collect();
    return projects.map((p: any) => p._id);
  },
});

export const listAllTaskIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query('tasks').collect();
    return tasks.map((t: any) => t._id);
  },
});

export const listAllSprintIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const sprints = await ctx.db.query('sprints').collect();
    return sprints.map((s: any) => s._id);
  },
});

// Internal migration mutation to generate keys and assign slugs for existing data
export const migrateExistingData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Projects: ensure keys & project slugs
    const projects = await ctx.db.query('projects').collect();
    for (const project of projects) {
      await ensureProjectKeyExists(ctx, project._id);
      if (!project.slug) {
        const pk = await ensureProjectKeyExists(ctx, project._id);
        const slug = formatProjectSlug(pk.key, 1);
        await ctx.db.patch(project._id, { slug, updatedAt: Date.now() });
      }
    }

    // Tasks: assign slugs
    const tasks = await ctx.db.query('tasks').collect();
    for (const task of tasks) {
      if (!task.projectId) continue;
      if (!task.slug) {
        const pk = await ensureProjectKeyExists(ctx, task.projectId);
        const next = pk.nextNumber;
        await ctx.db.patch(pk._id, { nextNumber: next + 1, updatedAt: Date.now() });
        const slug = formatTaskSlug(pk.key, next);
        await ctx.db.patch(task._id, { slug, updatedAt: Date.now() });
      }
    }

    // Sprints: assign slugs
    const sprints = await ctx.db.query('sprints').collect();
    for (const sprint of sprints) {
      if (sprint.slug) continue;
      const project = await ctx.db
        .query('projects')
        .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
        .first();
      if (!project) continue;
      const pk = await ensureProjectKeyExists(ctx, project._id);
      const sprintsInDept = await ctx.db
        .query('sprints')
        .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
        .collect();
      const index = (sprintsInDept?.filter((s: any) => Boolean(s.slug)).length || 0) + 1;
      const slug = formatSprintSlug(pk.key, index);
      await ctx.db.patch(sprint._id, { slug, updatedAt: Date.now() });
    }

    return { success: true };
  },
});

// Helper internal mutation for action: assign sprint slug by resolving a project in same department
export const assignSprintSlugFromContext = internalMutation({
  args: { sprintId: v.id('sprints') },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) throw new Error('Sprint not found');
    if (sprint.slug) return sprint.slug;

    const project = await ctx.db
      .query('projects')
      .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
      .first();
    if (!project) return null;

    const pk = await ensureProjectKeyExists(ctx, project._id);
    const sprintsInDept = await ctx.db
      .query('sprints')
      .withIndex('by_department', (q: any) => q.eq('departmentId', sprint.departmentId))
      .collect();
    const index = (sprintsInDept?.filter((s: any) => Boolean(s.slug)).length || 0) + 1;

    const slug = formatSprintSlug(pk.key, index);
    await ctx.db.patch(args.sprintId, { slug, updatedAt: Date.now() });
    return slug;
  },
});