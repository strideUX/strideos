import { internalMutation } from '../_generated/server';

export const migrateExistingSlugs = internalMutation({
  args: {},
  handler: async (ctx: any) => {
    const now = Date.now();

    // Create default project keys for each client/department
    const clients = await ctx.db.query('clients').collect();
    for (const client of clients) {
      const departments = await ctx.db
        .query('departments')
        .withIndex('by_client', (q: any) => q.eq('clientId', client._id))
        .collect();

      for (const dept of departments) {
        const existingDefault = await ctx.db
          .query('projectKeys')
          .withIndex('by_default', (q: any) => q.eq('clientId', client._id).eq('departmentId', dept._id).eq('isDefault', true))
          .first();
        if (!existingDefault) {
          await ctx.scheduler.runAfter(0, 'slugs:generateProjectKey' as any, {
            clientId: client._id,
            departmentId: dept._id,
          });
        }
      }
    }

    // Assign slugs to existing projects without slug
    const projects = await ctx.db.query('projects').collect();
    for (const p of projects) {
      if (!p.slug) {
        await ctx.scheduler.runAfter(0, 'slugs:generateProjectSlug' as any, { projectId: p._id });
      }
    }

    // Assign slugs to existing sprints without slug
    const sprints = await ctx.db.query('sprints').collect();
    for (const s of sprints) {
      if (!s.slug) {
        await ctx.scheduler.runAfter(0, 'slugs:generateSprintSlug' as any, { sprintId: s._id });
      }
    }

    // Assign slugs to existing tasks without slug, in creation date order per project
    const tasks = await ctx.db.query('tasks').collect();
    const tasksByProject = new Map<string, any[]>();
    for (const t of tasks) {
      if (!t.projectId) continue;
      const key = t.projectId.id || String(t.projectId);
      if (!tasksByProject.has(key)) tasksByProject.set(key, []);
      tasksByProject.get(key)!.push(t);
    }

    for (const [projId, list] of tasksByProject.entries()) {
      const ordered = list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      for (const t of ordered) {
        if (!t.slug) {
          await ctx.scheduler.runAfter(0, 'slugs:generateTaskSlug' as any, {
            projectId: t.projectId,
            taskId: t._id,
          });
        }
      }
    }

    return { success: true, at: now };
  }
});