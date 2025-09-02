import { internalMutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

/**
 * CAUTION: This migration will permanently delete test data!
 * 
 * PRESERVES: clients, departments, users, organizations, passwordResets, templates, legacy tables
 * DELETES: projects, tasks, sprints, documents, comments, presence, attachments, and sync data
 * 
 * Run with: npx convex run migrations/clearTestData:clearAllTestData
 */
export const clearAllTestData = internalMutation({
  handler: async (ctx) => {
    console.log("🧹 Starting test data cleanup...");
    const results = {
      projects: 0,
      tasks: 0,
      sprints: 0,
      documents: 0,
      documentPages: 0,
      comments: 0,
      commentThreads: 0,
      presence: 0,
      documentStatusAudits: 0,
      projectDeletionAudits: 0,
      attachments: 0,
      weeklyUpdates: 0,
      notifications: 0,
      prosemirrorSnapshots: 0,
      prosemirrorOps: 0,
      prosemirrorState: 0,
    };

    try {
      // 1. Clear ProseMirror sync tables (if they exist - these are component tables)
      console.log("🔄 Clearing ProseMirror sync data...");
      
      // Try to clear ProseMirror tables - they may not exist if component isn't installed
      try {
        const snapshots = await ctx.db.query("prosemirror_snapshots" as any).collect();
        for (const snapshot of snapshots) {
          await ctx.db.delete(snapshot._id);
          results.prosemirrorSnapshots++;
        }
      } catch (e) {
        console.log("   ℹ️  prosemirror_snapshots table not found (component may not be installed)");
      }
      
      try {
        const ops = await ctx.db.query("prosemirror_ops" as any).collect();
        for (const op of ops) {
          await ctx.db.delete(op._id);
          results.prosemirrorOps++;
        }
      } catch (e) {
        console.log("   ℹ️  prosemirror_ops table not found (component may not be installed)");
      }
      
      try {
        const states = await ctx.db.query("prosemirror_state" as any).collect();
        for (const state of states) {
          await ctx.db.delete(state._id);
          results.prosemirrorState++;
        }
      } catch (e) {
        console.log("   ℹ️  prosemirror_state table not found (component may not be installed)");
      }

      // 2. Clear document-related data (order matters for foreign keys)
      console.log("📄 Clearing document data (preserving templates)...");
      
      // Clear comments first (reference documentPages)
      const comments = await ctx.db.query("comments").collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
        results.comments++;
      }
      
      const commentThreads = await ctx.db.query("commentThreads").collect();
      for (const thread of commentThreads) {
        await ctx.db.delete(thread._id);
        results.commentThreads++;
      }
      
      
      
      // Clear document status audits
      const statusAudits = await ctx.db.query("documentStatusAudits").collect();
      for (const audit of statusAudits) {
        await ctx.db.delete(audit._id);
        results.documentStatusAudits++;
      }
      
      // Clear weekly updates
      const weeklyUpdates = await ctx.db.query("weeklyUpdates").collect();
      for (const update of weeklyUpdates) {
        await ctx.db.delete(update._id);
        results.weeklyUpdates++;
      }
      
      // Clear document pages
      const documentPages = await ctx.db.query("documentPages").collect();
      for (const page of documentPages) {
        await ctx.db.delete(page._id);
        results.documentPages++;
      }
      
      // Clear documents
      const documents = await ctx.db.query("documents").collect();
      for (const doc of documents) {
        await ctx.db.delete(doc._id);
        results.documents++;
      }
      
      // NOTE: NOT clearing documentTemplates - preserving templates

      // 3. Clear task and project data
      console.log("📋 Clearing project and task data...");
      
      // Clear attachments (reference tasks/projects)
      const attachments = await ctx.db.query("attachments").collect();
      for (const attachment of attachments) {
        await ctx.db.delete(attachment._id);
        results.attachments++;
      }
      
      // Clear tasks
      const tasks = await ctx.db.query("tasks").collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
        results.tasks++;
      }
      
      // Clear sprints
      const sprints = await ctx.db.query("sprints").collect();
      for (const sprint of sprints) {
        await ctx.db.delete(sprint._id);
        results.sprints++;
      }
      
      // Clear project deletion audits
      const projectDeletionAudits = await ctx.db.query("projectDeletionAudits").collect();
      for (const audit of projectDeletionAudits) {
        await ctx.db.delete(audit._id);
        results.projectDeletionAudits++;
      }
      
      // Clear projects
      const projects = await ctx.db.query("projects").collect();
      for (const project of projects) {
        await ctx.db.delete(project._id);
        results.projects++;
      }

      // 4. Clear real-time data
      console.log("👥 Clearing presence and notification data...");
      
      const presence = await ctx.db.query("presence").collect();
      for (const p of presence) {
        await ctx.db.delete(p._id);
        results.presence++;
      }
      
      const notifications = await ctx.db.query("notifications").collect();
      for (const notification of notifications) {
        await ctx.db.delete(notification._id);
        results.notifications++;
      }

      console.log("✅ Test data cleanup completed successfully!");
      console.log("📊 Deletion Summary:");
      console.log(`   • Projects: ${results.projects}`);
      console.log(`   • Tasks: ${results.tasks}`);
      console.log(`   • Sprints: ${results.sprints}`);
      console.log(`   • Documents: ${results.documents}`);
      console.log(`   • Document Pages: ${results.documentPages}`);
      console.log(`   • Comments: ${results.comments}`);
      console.log(`   • Comment Threads: ${results.commentThreads}`);
      console.log(`   • Attachments: ${results.attachments}`);
      console.log(`   • Weekly Updates: ${results.weeklyUpdates}`);
      console.log(`   • ProseMirror Snapshots: ${results.prosemirrorSnapshots}`);
      console.log(`   • ProseMirror Ops: ${results.prosemirrorOps}`);
      console.log(`   • ProseMirror State: ${results.prosemirrorState}`);
      console.log(`   • Notifications: ${results.notifications}`);
      console.log(`   • Presence Records: ${results.presence}`);
      
      console.log("\n✨ PRESERVED:");
      console.log("   • All users, clients, departments, organizations");
      console.log("   • Document templates (documentTemplates)");
      console.log("   • All legacy tables (for backward compatibility)");
      console.log("   • Authentication data and password resets");
      console.log("   • User profiles and permissions");
      
      return results;
      
    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  },
});

/**
 * Safer version that only clears specific data types
 * Use if you want more granular control
 */
export const clearSpecificTestData = internalMutation({
  args: {},
  handler: async (ctx, args: {
    clearProjects?: boolean;
    clearDocuments?: boolean;
    clearTasks?: boolean;
    clearSprints?: boolean;
    clearComments?: boolean;
    clearProsemirror?: boolean;
  }) => {
    console.log("🧹 Starting selective test data cleanup...", args);
    const results: Record<string, number> = {};
    
    // Clear ProseMirror data if requested
    if (args.clearProsemirror) {
      console.log("🔄 Clearing ProseMirror data...");
      
      try {
        const snapshots = await ctx.db.query("prosemirror_snapshots" as any).collect();
        for (const snapshot of snapshots) {
          await ctx.db.delete(snapshot._id);
        }
        results.prosemirrorSnapshots = snapshots.length;
      } catch (e) {
        console.log("   ℹ️  prosemirror_snapshots table not found");
        results.prosemirrorSnapshots = 0;
      }
      
      try {
        const ops = await ctx.db.query("prosemirror_ops" as any).collect();
        for (const op of ops) {
          await ctx.db.delete(op._id);
        }
        results.prosemirrorOps = ops.length;
      } catch (e) {
        console.log("   ℹ️  prosemirror_ops table not found");
        results.prosemirrorOps = 0;
      }
      
      try {
        const states = await ctx.db.query("prosemirror_state" as any).collect();
        for (const state of states) {
          await ctx.db.delete(state._id);
        }
        results.prosemirrorState = states.length;
      } catch (e) {
        console.log("   ℹ️  prosemirror_state table not found");
        results.prosemirrorState = 0;
      }
    }
    
    // Clear comments if requested
    if (args.clearComments) {
      console.log("💬 Clearing comments...");
      const comments = await ctx.db.query("comments").collect();
      for (const comment of comments) {
        await ctx.db.delete(comment._id);
      }
      results.comments = comments.length;
      
      const threads = await ctx.db.query("commentThreads").collect();
      for (const thread of threads) {
        await ctx.db.delete(thread._id);
      }
      results.commentThreads = threads.length;
    }
    
    // Clear tasks if requested
    if (args.clearTasks) {
      console.log("📋 Clearing tasks...");
      const tasks = await ctx.db.query("tasks").collect();
      for (const task of tasks) {
        await ctx.db.delete(task._id);
      }
      results.tasks = tasks.length;
    }
    
    // Clear sprints if requested
    if (args.clearSprints) {
      console.log("🏃 Clearing sprints...");
      const sprints = await ctx.db.query("sprints").collect();
      for (const sprint of sprints) {
        await ctx.db.delete(sprint._id);
      }
      results.sprints = sprints.length;
    }
    
    // Clear documents if requested (preserving templates)
    if (args.clearDocuments) {
      console.log("📄 Clearing documents (preserving templates)...");
      
      
      // Clear pages
      const pages = await ctx.db.query("documentPages").collect();
      for (const page of pages) {
        await ctx.db.delete(page._id);
      }
      results.documentPages = pages.length;
      
      // Clear documents
      const docs = await ctx.db.query("documents").collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      results.documents = docs.length;
    }
    
    // Clear projects if requested (do this last as other entities reference it)
    if (args.clearProjects) {
      console.log("🗂️ Clearing projects...");
      const projects = await ctx.db.query("projects").collect();
      for (const project of projects) {
        await ctx.db.delete(project._id);
      }
      results.projects = projects.length;
    }
    
    console.log("✅ Selective cleanup completed:", results);
    return results;
  },
});

/**
 * Quick helper to just clear all sync data
 */
export const clearSyncDataOnly = internalMutation({
  handler: async (ctx) => {
    console.log("🔄 Clearing ONLY ProseMirror sync data...");
    let count = 0;
    
    try {
      const snapshots = await ctx.db.query("prosemirror_snapshots" as any).collect();
      for (const snapshot of snapshots) {
        await ctx.db.delete(snapshot._id);
        count++;
      }
    } catch (e) {
      console.log("   ℹ️  prosemirror_snapshots table not found");
    }
    
    try {
      const ops = await ctx.db.query("prosemirror_ops" as any).collect();
      for (const op of ops) {
        await ctx.db.delete(op._id);
        count++;
      }
    } catch (e) {
      console.log("   ℹ️  prosemirror_ops table not found");
    }
    
    try {
      const states = await ctx.db.query("prosemirror_state" as any).collect();
      for (const state of states) {
        await ctx.db.delete(state._id);
        count++;
      }
    } catch (e) {
      console.log("   ℹ️  prosemirror_state table not found");
    }
    
    console.log(`✅ Cleared ${count} sync records`);
    return { cleared: count };
  },
});