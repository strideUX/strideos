import { mutation } from "./_generated/server";

// One-time migration: pages -> documentPages
export const migratePagesToDocumentPages = mutation({
  handler: async (ctx) => {
    console.log("Starting migration: pages -> documentPages");
    
    try {
      // Get all pages from old table (using any to bypass TypeScript since table may not exist in schema)
      const oldPages = await (ctx.db as any).query("pages").collect();
      console.log(`Found ${oldPages.length} pages to migrate`);
      
      if (oldPages.length === 0) {
        return { migrated: 0, message: "No pages found to migrate" };
      }
      
      // Check if documentPages already has data (avoid double migration)
      const existingDocumentPages = await ctx.db.query("documentPages").collect();
      if (existingDocumentPages.length > 0) {
        return { 
          migrated: 0, 
          message: `documentPages already has ${existingDocumentPages.length} entries. Migration skipped to avoid duplicates.` 
        };
      }
      
      let migrated = 0;
      
      // Migrate each page
      for (const page of oldPages) {
        try {
          await ctx.db.insert("documentPages", {
            documentId: page.documentId,
            parentPageId: page.parentPageId,
            docId: page.docId,
            title: page.title,
            icon: page.icon || undefined,
            order: page.order,
            createdAt: page.createdAt
          });
          migrated++;
        } catch (error) {
          console.error(`Failed to migrate page ${page._id}:`, error);
        }
      }
      
      console.log(`Migration complete: ${migrated}/${oldPages.length} pages migrated`);
      
      return { 
        migrated, 
        total: oldPages.length,
        message: `Successfully migrated ${migrated} pages to documentPages table`
      };
    } catch (error) {
      console.error("Migration failed:", error);
      return { 
        migrated: 0, 
        error: "Old pages table not found or migration failed" 
      };
    }
  }
});

// Optional: Clean up old pages table after confirming migration worked
export const cleanupOldPagesTable = mutation({
  handler: async (ctx) => {
    try {
      const oldPages = await (ctx.db as any).query("pages").collect();
      
      for (const page of oldPages) {
        await (ctx.db as any).delete(page._id);
      }
      
      return { deleted: oldPages.length };
    } catch (error) {
      return { deleted: 0, error: "Old pages table not found" };
    }
  }
});