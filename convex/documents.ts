import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { auth } from "./auth";
import type { Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Helper function to map legacy statuses to new normalized values
function normalizeStatus(status?: string): "draft" | "published" | "archived" {
	if (!status) return "draft";
	const s = status.toLowerCase();
	switch (s) {
		case "draft":
		case "new":
			return "draft";
		case "published":
		case "active":
			return "published";
		case "archived":
		case "complete":
			return "archived";
		case "review":
		default:
			return "draft"; // default fallback
	}
}

export const list = query({
    args: {
        status: v.optional(v.union(
            v.literal("draft"),
            v.literal("published"),
            v.literal("archived")
        )),
        documentType: v.optional(v.union(
            v.literal("project_brief"),
            v.literal("meeting_notes"),
            v.literal("wiki_article"),
            v.literal("resource_doc"),
            v.literal("retrospective"),
            v.literal("blank")
        )),
    },
    handler: async (ctx, args) => {
        let docs;
        if (args.status) {
            docs = await ctx.db.query("documents")
                .withIndex("by_status", (qi) => qi.eq("status", args.status as any))
                .order("desc")
                .collect();
        } else if (args.documentType) {
            docs = await ctx.db.query("documents")
                .withIndex("by_type", (qi) => qi.eq("documentType", args.documentType as any))
                .order("desc")
                .collect();
        } else {
            docs = await ctx.db.query("documents")
                .withIndex("by_created", (qi) => qi.gt("createdAt", 0))
                .order("desc")
                .collect();
        }

        // Normalize legacy statuses for display and filtering
        const normalizedDocs = (docs as any[]).map(doc => ({
            ...doc,
            normalizedStatus: normalizeStatus((doc as any).status)
        }));

        // Collect unique author ids
        const authorIds: Id<"users">[] = [] as any;
        for (const d of normalizedDocs) {
            if (d.createdBy && !authorIds.includes(d.createdBy)) authorIds.push(d.createdBy);
        }
        const authors = new Map<string, any>();
        for (const userId of authorIds) {
            try {
                const u = await ctx.db.get(userId as any);
                if (u) authors.set(String(userId), { _id: userId, name: (u as any).name, email: (u as any).email });
            } catch {
                // Gracefully ignore legacy string IDs or missing users
            }
        }

        // Enrich with author, project brief flag, and normalized status
        return normalizedDocs.map((d) => ({
            ...d,
            author: d.createdBy ? authors.get(String(d.createdBy)) ?? null : null,
            isProjectBrief: Boolean(d.projectId || d?.metadata?.projectId),
            status: d.normalizedStatus, // Use normalized status for display
        }));
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
        const userId = await auth.getUserId(ctx);
        const now = Date.now();
        const id = await ctx.db.insert("documents", {
            title,
            createdAt: now,
            updatedAt: now, // legacy back-compat
            ownerId: userId ? String(userId) : undefined,
            // audit
            createdBy: userId || undefined,
            modifiedBy: userId || undefined,
            modifiedAt: now,
            // status
            status: "draft",
            documentType: documentType ?? "blank",
            projectId: metadata?.projectId,
            clientId: metadata?.clientId,
            departmentId: metadata?.departmentId,
            metadata,
        });

        // Create a default page for this document
        const pageId = await ctx.db.insert("documentPages", {
            title,
            documentId: id,
            order: 0,
            parentPageId: undefined,
            docId: "", // Will be updated after ProseMirror doc creation
            createdAt: now,
        });

        // Create a ProseMirror document for this page
        const docId = randomId();
        await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });

        // Update the page with the docId
        await ctx.db.patch(pageId, { docId });

        return { documentId: id, pageId, docId };
    },
});

export const rename = mutation({
    args: { documentId: v.id("documents"), title: v.string() },
    handler: async (ctx, { documentId, title }) => {
        const userId = await auth.getUserId(ctx);
        await ctx.db.patch(documentId, { 
            title,
            modifiedAt: Date.now(),
            modifiedBy: userId || undefined,
            updatedAt: Date.now(), // legacy back-compat
        });
    },
});

export const remove = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, { documentId }) => {
        const doc = await ctx.db.get(documentId);
        if (!doc) return;
        const isProjectBrief = Boolean((doc as any).projectId || (doc as any)?.metadata?.projectId);
        if (isProjectBrief) {
            throw new Error("This is a project brief. Delete the project instead to remove this document.");
        }

        // Get all pages for this document
        const pages = await ctx.db.query("documentPages").withIndex("by_document", (q) => q.eq("documentId", documentId)).collect();

        // 1. Note: ProseMirror documents are managed by the sync system
        // They will be cleaned up automatically when references are removed
        // No explicit deletion needed for prosemirrorSync

        // 2. Manual saves removed

        // 3. Delete comment threads and comments for this document
        const docIdString = documentId.toString();
        const threads = await ctx.db.query("commentThreads")
            .withIndex("by_doc", (q) => q.eq("docId", docIdString))
            .collect();
        
        for (const thread of threads) {
            // Delete comments in thread
            const comments = await ctx.db.query("comments")
                .withIndex("by_thread", (q) => q.eq("threadId", thread.id))
                .collect();
            for (const comment of comments) {
                await ctx.db.delete(comment._id);
            }
            // Delete thread
            await ctx.db.delete(thread._id);
        }

        // 4. Delete status audit entries
        const audits = await ctx.db.query("documentStatusAudits")
            .withIndex("by_document", (q) => q.eq("documentId", documentId))
            .collect();
        for (const audit of audits) {
            await ctx.db.delete(audit._id);
        }

        // 5. Delete document pages
        for (const page of pages) {
            await ctx.db.delete(page._id);
        }

        // 6. Finally, delete the document itself
        await ctx.db.delete(documentId);
    },
});

export const updateStatus = mutation({
    args: {
        documentId: v.id("documents"),
        status: v.union(
            v.literal("draft"),
            v.literal("published"),
            v.literal("archived")
        ),
    },
    handler: async (ctx, { documentId, status }) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");
        const now = Date.now();
        const doc = await ctx.db.get(documentId);
        if (!doc) throw new Error("Document not found");

        // Write audit
        await ctx.db.insert("documentStatusAudits", {
            documentId,
            userId: userId as Id<"users">,
            oldStatus: (doc as any).status,
            newStatus: status,
            timestamp: now,
        } as any);

        await ctx.db.patch(documentId, {
            status,
            modifiedAt: now,
            modifiedBy: userId || undefined,
            updatedAt: now, // legacy back-compat
        });
    },
});

// Migration helper to normalize legacy status values in existing documents
export const migrateLegacyStatuses = mutation({
    handler: async (ctx) => {
        const userId = await auth.getUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Get all documents with legacy status values
        const docs = await ctx.db.query("documents").collect();
        let migrated = 0;

        for (const doc of docs) {
            const currentStatus = (doc as any).status;
            if (currentStatus && !["draft", "published", "archived"].includes(currentStatus)) {
                const normalizedStatus = normalizeStatus(currentStatus);

                // Update the document
                await ctx.db.patch(doc._id, {
                    status: normalizedStatus,
                    modifiedAt: Date.now(),
                    modifiedBy: userId || undefined,
                    updatedAt: Date.now(),
                });

                // Write audit entry for the migration
                await ctx.db.insert("documentStatusAudits", {
                    documentId: doc._id,
                    userId: userId as Id<"users">,
                    oldStatus: currentStatus,
                    newStatus: normalizedStatus,
                    timestamp: Date.now(),
                } as any);

                migrated++;
            }
        }

        return { migrated };
    },
});

// Weekly Updates API for document-based status tracking
export const listWeeklyUpdates = query({
    args: { docId: v.string() },
    handler: async (ctx, { docId }) => {
        return ctx.db.query("weeklyUpdates").withIndex("by_doc", q => q.eq("docId", docId)).order("desc").collect();
    },
});

export const createWeeklyUpdate = mutation({
    args: { 
        docId: v.string(), 
        accomplished: v.string(), 
        focus: v.string(), 
        blockers: v.string(), 
        authorId: v.optional(v.string()) 
    },
    handler: async (ctx, { docId, accomplished, focus, blockers, authorId }) => {
        const now = Date.now();
        const id = await ctx.db.insert("weeklyUpdates", {
            docId,
            accomplished,
            focus,
            blockers,
            createdAt: now,
            updatedAt: now,
            authorId,
        });
        return id;
    },
});


