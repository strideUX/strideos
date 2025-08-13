import { mutation } from './_generated/server';
import { auth } from './auth';

// Update specific client keys as requested
export default mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    let user = null;
    if (userId) {
      user = await ctx.db.get(userId);
    }
    
    // Get first admin user for validation
    const adminUser = await ctx.db
      .query('users')
      .filter((q: any) => q.eq(q.field('role'), 'admin'))
      .first();
    
    const creatorId = userId || adminUser?._id;
    if (!creatorId) {
      throw new Error('No admin user found');
    }

    console.log('Updating specific client keys...');

    // Key mappings as requested
    const keyUpdates = [
      { oldKey: 'TASK', newKey: 'TSKRY', clientName: 'TaskRay' },
      { oldKey: 'INTEL', newKey: 'INTLL', clientName: 'IntelliShift' },
      { oldKey: 'DESIGN', newKey: 'STRDSN', clientName: 'Design Team' }
    ];

    const updates = [];

    for (const update of keyUpdates) {
      // Find client with the old key
      const client = await ctx.db
        .query('clients')
        .withIndex('by_project_key', (q: any) => q.eq('projectKey', update.oldKey))
        .first();

      if (!client) {
        console.log(`Client with key ${update.oldKey} not found`);
        continue;
      }

      // Check if new key is available
      const existingNewKey = await ctx.db
        .query('clients')
        .withIndex('by_project_key', (q: any) => q.eq('projectKey', update.newKey))
        .first();

      if (existingNewKey && existingNewKey._id !== client._id) {
        console.log(`Key ${update.newKey} already in use, skipping ${update.clientName}`);
        continue;
      }

      // Update the client
      await ctx.db.patch(client._id, {
        projectKey: update.newKey,
        updatedAt: Date.now()
      });

      // Update the project key record
      const keyRecord = await ctx.db
        .query('projectKeys')
        .withIndex('by_key', (q: any) => q.eq('key', update.oldKey))
        .first();

      if (keyRecord) {
        await ctx.db.patch(keyRecord._id, {
          key: update.newKey,
          description: `All items for ${(client as any).name}`,
          updatedAt: Date.now()
        });
      }

      updates.push({
        client: (client as any).name,
        oldKey: update.oldKey,
        newKey: update.newKey
      });

      console.log(`Updated ${(client as any).name}: ${update.oldKey} -> ${update.newKey}`);
    }

    // Now we need to update all existing slugs that use the old keys
    console.log('Updating existing slugs...');
    
    for (const update of updates) {
      // Update tasks
      const tasks = await ctx.db
        .query('tasks')
        .withIndex('by_slug_key', (q: any) => q.eq('slugKey', update.oldKey))
        .collect();

      for (const task of tasks) {
        if (task.slug && task.slugNumber) {
          const newSlug = `${update.newKey}-${task.slugNumber}`;
          await ctx.db.patch(task._id, {
            slug: newSlug,
            slugKey: update.newKey,
            updatedAt: Date.now()
          });
        }
      }

      // Update projects
      const projects = await ctx.db
        .query('projects')
        .filter((q: any) => q.eq(q.field('projectKey'), update.oldKey))
        .collect();

      for (const project of projects) {
        if (project.slug) {
          const newSlug = project.slug.replace(update.oldKey, update.newKey);
          await ctx.db.patch(project._id, {
            slug: newSlug,
            projectKey: update.newKey,
            updatedAt: Date.now()
          });
        }
      }

      // Update sprints
      const sprints = await ctx.db
        .query('sprints')
        .withIndex('by_slug_key', (q: any) => q.eq('slugKey', update.oldKey))
        .collect();

      for (const sprint of sprints) {
        if (sprint.slug && sprint.slugNumber) {
          const newSlug = `${update.newKey}-S-${sprint.slugNumber}`;
          await ctx.db.patch(sprint._id, {
            slug: newSlug,
            slugKey: update.newKey,
            updatedAt: Date.now()
          });
        }
      }
    }

    return {
      success: true,
      updates,
      message: `Updated ${updates.length} client keys and their associated slugs`
    };
  }
});