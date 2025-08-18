import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const list = query({
    args: {},
    handler: async (ctx) => {
        // Get current user for context
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }

        return ctx.db.query("documents").withIndex("by_created", q => q.gt("createdAt", 0)).order("desc").collect();
    },
});

export const get = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }

        return ctx.db.get(documentId);
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
        projectId: v.optional(v.id("projects")),
        clientId: v.id("clients"),
        departmentId: v.id("departments")
    },
    handler: async (ctx, { title, documentType, projectId, clientId, departmentId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }

        // Get user context if clientId/departmentId not provided
        const userId = await auth.getUserId(ctx);
        const user = userId ? await ctx.db.get(userId) : null;

        if (!user) {
            throw new Error("User not found");
        }

        const now = Date.now();
        
        // Create document
        const documentId = await ctx.db.insert("documents", { 
            title, 
            createdAt: now,
            ownerId: identity.subject,
            documentType: documentType || "blank",
            projectId,
            clientId,
            departmentId,
            status: "draft"
        });

        // Auto-create first page
        const pageDocId = `doc_${documentId}_${crypto.randomUUID()}`;
        await ctx.db.insert("pages", {
            documentId,
            docId: pageDocId,
            title: "Untitled",
            order: 0,
            createdAt: now
        });

        return documentId;
    },
});

export const rename = mutation({
    args: { documentId: v.id("documents"), title: v.string() },
    handler: async (ctx, { documentId, title }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }

        await ctx.db.patch(documentId, { title });
    },
});

export const remove = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Authentication required");
        }

        // Delete all pages for this document
        const pages = await ctx.db
            .query("pages")
            .withIndex("by_document", (q) => q.eq("documentId", documentId))
            .collect();

        for (const page of pages) {
            await ctx.db.delete(page._id);
        }

        // Delete the document
        await ctx.db.delete(documentId);
    },
});