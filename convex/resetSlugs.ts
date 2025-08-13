import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { auth } from './auth';

// Helper to create a meaningful key from client/department names
function createMeaningfulKey(clientName: string, departmentName?: string): string {
  const cleanClient = (clientName || 'CLIENT').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanDept = (departmentName || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Try to create an acronym or abbreviation
  const clientWords = cleanClient.split(/(?=[A-Z])/);
  const deptWords = cleanDept.split(/(?=[A-Z])/);
  
  let key = '';
  
  // If client name is short (<=6 chars), use it directly
  if (cleanClient.length <= 6) {
    key = cleanClient;
  } else if (clientWords.length > 1) {
    // Use first letter of each word for multi-word names
    key = clientWords.map(w => w[0]).join('').slice(0, 4);
  } else {
    // Use first 4 chars for single long words
    key = cleanClient.slice(0, 4);
  }
  
  // Add department suffix if exists
  if (cleanDept) {
    if (deptWords.length > 1) {
      key += deptWords.map(w => w[0]).join('').slice(0, 2);
    } else {
      key += cleanDept.slice(0, 2);
    }
  }
  
  return key.slice(0, 6) || 'KEY';
}

export default mutation({
  args: {},
  handler: async (ctx) => {
    // For now, we'll bypass auth check for CLI execution
    // In production, this should be an internal mutation or require auth
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

    console.log('Starting slug reset...');

    // Step 1: Delete all existing project keys
    const existingKeys = await ctx.db.query('projectKeys').collect();
    console.log(`Deleting ${existingKeys.length} existing project keys...`);
    for (const key of existingKeys) {
      await ctx.db.delete(key._id);
    }

    // Step 2: Clear all existing slugs
    console.log('Clearing existing slugs from tasks...');
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

    console.log('Clearing existing slugs from projects...');
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

    console.log('Clearing existing slugs from sprints...');
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

    // Step 3: Create proper project keys for each client/department combination
    console.log('Creating new project keys...');
    const clients = await ctx.db.query('clients').collect();
    const keysCreated = [];
    
    for (const client of clients) {
      const departments = await ctx.db
        .query('departments')
        .withIndex('by_client', (q: any) => q.eq('clientId', client._id))
        .collect();

      if (departments.length === 0) {
        // Create a client-level default key
        const key = createMeaningfulKey(client.name);
        const keyId = await ctx.db.insert('projectKeys', {
          key,
          description: `Default key for ${client.name}`,
          clientId: client._id,
          departmentId: undefined,
          projectId: undefined,
          lastTaskNumber: 0,
          lastSprintNumber: 0,
          isDefault: true,
          isActive: true,
          createdBy: creatorId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        keysCreated.push({ clientName: client.name, key });
        console.log(`Created key: ${key} for client: ${client.name}`);
      } else {
        // Create a key for each department
        for (const dept of departments) {
          const key = createMeaningfulKey(client.name, dept.name);
          
          // Check for uniqueness and adjust if needed
          let finalKey = key;
          let suffix = 1;
          while (true) {
            const existing = await ctx.db
              .query('projectKeys')
              .withIndex('by_key', (q: any) => q.eq('key', finalKey))
              .first();
            if (!existing) break;
            finalKey = `${key}${suffix}`;
            suffix++;
            if (suffix > 99) {
              finalKey = `${key}${Math.floor(Math.random() * 100)}`;
              break;
            }
          }
          
          const keyId = await ctx.db.insert('projectKeys', {
            key: finalKey,
            description: `Default key for ${client.name} - ${dept.name}`,
            clientId: client._id,
            departmentId: dept._id,
            projectId: undefined,
            lastTaskNumber: 0,
            lastSprintNumber: 0,
            isDefault: true,
            isActive: true,
            createdBy: creatorId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          keysCreated.push({ clientName: client.name, departmentName: dept.name, key: finalKey });
          console.log(`Created key: ${finalKey} for ${client.name} - ${dept.name}`);
        }
      }
    }

    // Step 4: Regenerate slugs for all entities
    console.log('Regenerating slugs for projects...');
    for (const project of projects) {
      await ctx.scheduler.runAfter(0, 'slugs:generateProjectSlug' as any, { 
        projectId: project._id 
      });
    }

    console.log('Regenerating slugs for sprints...');
    for (const sprint of sprints) {
      await ctx.scheduler.runAfter(0, 'slugs:generateSprintSlug' as any, { 
        sprintId: sprint._id 
      });
    }

    console.log('Regenerating slugs for tasks (ordered by creation date)...');
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
        await ctx.scheduler.runAfter(0, 'slugs:generateTaskSlug' as any, {
          projectId: task.projectId,
          taskId: task._id,
        });
      }
    }

    return { 
      success: true,
      keysCreated: keysCreated.length,
      keys: keysCreated,
      message: `Reset complete! Created ${keysCreated.length} project keys and scheduled slug regeneration.`
    };
  }
});