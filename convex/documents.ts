import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        return ctx.db.query("documents").withIndex("by_created", q => q.gt("createdAt", 0)).order("desc").collect();
    },
});

export const create = mutation({
    args: {
        title: v.string(),
        documentType: v.optional(v.union(
            v.literal("project_brief"),
            v.literal("meeting_notes"),
            v.literal("wiki_article"),
            v.literal("resource_doc"),
            v.literal("retrospective"),
            v.literal("blank")
        )),
        metadata: v.optional(v.object({
            projectId: v.optional(v.id("projects")),
            clientId: v.optional(v.id("clients")),
            departmentId: v.optional(v.id("departments")),
        })),
    },
    handler: async (ctx, { title, documentType, metadata }) => {
        console.log("🆕 CREATING DOCUMENT:", {
            title,
            timestamp: new Date().toISOString()
        });
        
        const identity = await ctx.auth.getUserIdentity();
        const now = Date.now();
        const id = await ctx.db.insert("documents", {
            title,
            createdAt: now,
            updatedAt: now,
            ownerId: identity?.subject,
            documentType: documentType ?? "blank",
            projectId: metadata?.projectId,
            clientId: metadata?.clientId,
            departmentId: metadata?.departmentId,
        });
        
        console.log("✅ DOCUMENT CREATED:", {
            documentId: id,
            title,
            timestamp: new Date().toISOString()
        });

        // Create a default page for this document
        const pageId = await ctx.db.insert("pages", {
            title,
            documentId: id,
            order: 0,
            parentPageId: undefined,
            docId: "", // Will be updated after ProseMirror doc creation
            createdAt: now,
        });
        
        console.log("✅ DEFAULT PAGE CREATED:", {
            pageId,
            documentId: id,
            title,
            timestamp: new Date().toISOString()
        });

        // Create a ProseMirror document for this page
        const docId = randomId();
        await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
        
        console.log("✅ PROSEMIRROR DOC CREATED:", {
            docId,
            pageId,
            documentId: id,
            timestamp: new Date().toISOString()
        });

        // Update the page with the docId
        await ctx.db.patch(pageId, { docId });
        
        console.log("✅ PAGE UPDATED WITH DOCID:", {
            pageId,
            docId,
            documentId: id,
            timestamp: new Date().toISOString()
        });

        return { documentId: id, pageId, docId };
    },
});

export const rename = mutation({
    args: { documentId: v.id("documents"), title: v.string() },
    handler: async (ctx, { documentId, title }) => {
        await ctx.db.patch(documentId, { title });
    },
});

export const remove = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        await ctx.db.delete(documentId);
        // Optional: also cascade delete pages; left as a follow-up
    },
});


