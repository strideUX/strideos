import { mutation } from './_generated/server';
import { auth } from './auth';

// Migration to set project keys on clients and regenerate all slugs
export default mutation({
  args: {},
  handler: async (ctx) => {
    // Check authentication
    const userId = await auth.getUserId(ctx);
    let user = null;
    if (userId) {
      user = await ctx.db.get(userId);
    }
    
    // Get first admin user for createdBy fields
    const adminUser = await ctx.db
      .query('users')
      .filter((q: any) => q.eq(q.field('role'), 'admin'))
      .first();
    
    const creatorId = userId || adminUser?._id;
    if (!creatorId) {
      throw new Error('No admin user found to attribute changes to');
    }

    console.log('Starting migration to client-based project keys...');

    // Step 1: Delete all existing project keys (they were department-scoped)
    const existingKeys = await ctx.db.query('projectKeys').collect();
    console.log(`Deleting ${existingKeys.length} existing project keys...`);
    for (const key of existingKeys) {
      await ctx.db.delete(key._id);
    }

    // Step 2: Clear all existing slugs
    console.log('Clearing existing slugs...');
    const tasks = await ctx.db.query('tasks').collect();
    for (const task of tasks) {
      if (task.slug) {
        await ctx.db.patch(task._id, { 
          slug: undefined,
          slugKey: undefined,
          slugNumber: undefined,
          updatedAt: Date.now() 
        });
      }
    }

    const projects = await ctx.db.query('projects').collect();
    for (const project of projects) {
      if (project.slug) {
        await ctx.db.patch(project._id, { 
          slug: undefined,
          projectKey: undefined,
          updatedAt: Date.now() 
        });
      }
    }

    const sprints = await ctx.db.query('sprints').collect();
    for (const sprint of sprints) {
      if (sprint.slug) {
        await ctx.db.patch(sprint._id, { 
          slug: undefined,
          slugKey: undefined,
          slugNumber: undefined,
          updatedAt: Date.now() 
        });
      }
    }

    // Step 3: Set project keys for existing clients
    console.log('Setting project keys for clients...');
    const clients = await ctx.db.query('clients').collect();
    const clientKeyMap = new Map();
    
    // Predefined keys for known clients (you can customize these)
    const predefinedKeys: Record<string, string> = {
      'Squirrels': 'SQRL',
      'Respondology': 'RESP',
      'TaskRay': 'TASK',
      'Stride': 'STRIDE',
      'QuantHub': 'QUANT',
      'IntelliShift': 'INTEL',
      'Aligned': 'ALIGN',
      'Design Team': 'DESIGN',
    };

    for (const client of clients) {
      // Skip if already has a project key
      if (client.projectKey) {
        console.log(`Client ${client.name} already has key: ${client.projectKey}`);
        clientKeyMap.set(client._id, client.projectKey);
        continue;
      }

      // Use predefined key or generate one
      let projectKey = predefinedKeys[client.name];
      
      if (!projectKey) {
        // Generate a simple key from the client name
        const words = client.name.toUpperCase().split(/\s+/);
        if (words.length > 1) {
          // Multi-word: use first letter of each word
          projectKey = words.map(w => w[0]).join('').slice(0, 4);
        } else {
          // Single word: use first 4 characters
          projectKey = client.name.toUpperCase().slice(0, 4);
        }
      }

      // Ensure uniqueness
      let finalKey = projectKey;
      let suffix = 1;
      while (clientKeyMap.has(finalKey) || 
             Array.from(clientKeyMap.values()).includes(finalKey)) {
        finalKey = `${projectKey}${suffix}`;
        suffix++;
      }

      // Update the client with the project key
      await ctx.db.patch(client._id, {
        projectKey: finalKey,
        updatedAt: Date.now()
      });

      clientKeyMap.set(client._id, finalKey);
      console.log(`Set key for ${client.name}: ${finalKey}`);
    }

    // Step 4: Create project key records for each client
    console.log('Creating project key records...');
    for (const [clientId, key] of clientKeyMap.entries()) {
      const client = await ctx.db.get(clientId);
      if (!client) continue;

      await ctx.db.insert('projectKeys', {
        key: key as string,
        description: `All items for ${(client as any).name}`,
        clientId: clientId,
        departmentId: undefined, // No longer using departments
        projectId: undefined,
        lastTaskNumber: 0,
        lastSprintNumber: 0,
        lastProjectNumber: 0,
        isDefault: true,
        isActive: true,
        createdBy: creatorId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Step 5: Update the existing slug generation to use the new simplified version
    // Note: We need to update the hooks in tasks.ts, projects.ts, and sprints.ts
    // to use slugsSimplified instead of slugs
    
    // Step 6: Regenerate all slugs using the new simplified system
    console.log('Scheduling slug regeneration...');
    
    for (const project of projects) {
      await ctx.scheduler.runAfter(0, 'slugsSimplified:generateProjectSlug' as any, { 
        projectId: project._id 
      });
    }

    for (const sprint of sprints) {
      await ctx.scheduler.runAfter(0, 'slugsSimplified:generateSprintSlug' as any, { 
        sprintId: sprint._id 
      });
    }

    // Generate task slugs in creation order per project
    const tasksByProject = new Map<string, any[]>();
    for (const task of tasks) {
      if (!task.projectId) continue;
      const key = task.projectId.toString();
      if (!tasksByProject.has(key)) tasksByProject.set(key, []);
      tasksByProject.get(key)!.push(task);
    }

    for (const [projId, taskList] of tasksByProject.entries()) {
      const ordered = taskList.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      for (const task of ordered) {
        await ctx.scheduler.runAfter(0, 'slugsSimplified:generateTaskSlug' as any, {
          projectId: task.projectId,
          taskId: task._id,
        });
      }
    }

    return { 
      success: true,
      clientsUpdated: clientKeyMap.size,
      keys: Array.from(clientKeyMap.entries()).map(([clientId, key]) => ({
        clientId,
        key
      })),
      message: `Migration complete! Updated ${clientKeyMap.size} clients with project keys.`
    };
  }
});