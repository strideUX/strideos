import { mutation } from './_generated/server';
import { auth } from './auth';

// Migration to add lastProjectNumber field and simplify project slugs
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

    console.log('Starting project slug migration...');

    // Step 1: Update existing project keys to include lastProjectNumber field
    console.log('Adding lastProjectNumber field to existing project keys...');
    const projectKeys = await ctx.db.query('projectKeys').collect();
    
    for (const key of projectKeys) {
      if (!(key as any).lastProjectNumber && (key as any).lastProjectNumber !== 0) {
        await ctx.db.patch(key._id, {
          lastProjectNumber: 0,
          updatedAt: Date.now()
        });
        console.log(`Added lastProjectNumber to key: ${key.key}`);
      }
    }

    // Step 2: Update existing project slugs from RESP-P-2025-1 format to RESP-P-1 format
    console.log('Converting project slugs to simpler format...');
    const projects = await ctx.db.query('projects').collect();
    const projectsByKey = new Map<string, any[]>();
    
    // Group projects by their project key and sort by creation date
    for (const project of projects) {
      const key = project.projectKey || 'UNKNOWN';
      if (!projectsByKey.has(key)) {
        projectsByKey.set(key, []);
      }
      projectsByKey.get(key)!.push(project);
    }

    // Process each key group
    for (const [projectKey, projectList] of projectsByKey.entries()) {
      // Sort by creation date to maintain chronological order
      const sortedProjects = projectList.sort((a, b) => a.createdAt - b.createdAt);
      
      console.log(`Processing ${sortedProjects.length} projects for key: ${projectKey}`);
      
      // Find the project key record
      let keyRecord = await ctx.db
        .query('projectKeys')
        .withIndex('by_key', (q: any) => q.eq('key', projectKey))
        .first();

      let projectCounter = 0;
      
      for (const project of sortedProjects) {
        projectCounter++;
        const newSlug = `${projectKey}-P-${projectCounter}`;
        
        // Update the project with new slug
        await ctx.db.patch(project._id, {
          slug: newSlug,
          updatedAt: Date.now()
        });
        
        console.log(`Updated project ${project.title}: ${project.slug} -> ${newSlug}`);
      }
      
      // Update the project key record with the final counter
      if (keyRecord) {
        await ctx.db.patch(keyRecord._id, {
          lastProjectNumber: projectCounter,
          updatedAt: Date.now()
        });
        console.log(`Set lastProjectNumber for ${projectKey}: ${projectCounter}`);
      }
    }

    const totalProjects = projects.length;
    
    return {
      success: true,
      projectKeysUpdated: projectKeys.length,
      projectsUpdated: totalProjects,
      message: `Migration complete! Updated ${projectKeys.length} project keys and ${totalProjects} project slugs to simpler format.`
    };
  }
});