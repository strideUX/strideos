import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple manual save storage - no schema conflicts
export const save = mutation({
  args: {
    docId: v.string(),
    content: v.string()
  },
  handler: async (ctx, { docId, content }) => {
    // Check if save already exists for this docId
    const existing = await ctx.db
      .query("manualSaves")
      .withIndex("by_docId", q => q.eq("docId", docId))
      .first();
    
    if (existing) {
      // Update existing save
      await ctx.db.patch(existing._id, {
        content,
        updatedAt: Date.now()
      });
    } else {
      // Create new save
      await ctx.db.insert("manualSaves", {
        docId,
        content,
        updatedAt: Date.now()
      });
    }
    
    return { success: true };
  }
});

export const get = query({
  args: { docId: v.string() },
  handler: async (ctx, { docId }) => {
    const save = await ctx.db
      .query("manualSaves")
      .withIndex("by_docId", q => q.eq("docId", docId))
      .first();
    
    return save ? {
      content: save.content,
      lastSaved: save.updatedAt
    } : null;
  }
});