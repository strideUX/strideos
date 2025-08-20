import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const list = query({
	args: { documentId: v.id("documents"), parentPageId: v.optional(v.id("pages")) },
	handler: async (ctx, { documentId, parentPageId }) => {
		let q = ctx.db.query("pages").withIndex("by_document", x => x.eq("documentId", documentId));
		if (parentPageId !== undefined) {
			q = ctx.db.query("pages").withIndex("by_document_parent", x => x.eq("documentId", documentId).eq("parentPageId", parentPageId));
		}
		const pages = await q.collect();
		return pages.sort((a, b) => a.order - b.order);
	},
});

export const create = mutation({
	args: { documentId: v.id("documents"), title: v.string(), parentPageId: v.optional(v.id("pages")) },
	handler: async (ctx, { documentId, title, parentPageId }) => {
		const now = Date.now();
		const last = await ctx.db
			.query("pages")
			.withIndex("by_document_order", q => q.eq("documentId", documentId))
			.order("desc")
			.first();
		const order = (last?.order ?? 0) + 1;
		const docId = randomId();
		const pageId = await ctx.db.insert("pages", { documentId, parentPageId, docId, title, order, createdAt: now });
		// Create an empty doc server-side so clients can open immediately without calling sync.create
		await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
		return { pageId, docId };
	},
});

// Create a subpage beneath a specific parent page. This mirrors `create` but
// requires a `parentPageId` argument for clarity from the client.
export const createSubpage = mutation({
	args: { documentId: v.id("documents"), parentPageId: v.id("pages"), title: v.string() },
	handler: async (ctx, { documentId, parentPageId, title }) => {
		const parent = await ctx.db.get(parentPageId);
		if (!parent) throw new Error("Parent page not found");
		if (parent.parentPageId) throw new Error("Subpages cannot have their own subpages");
		const now = Date.now();
		const last = await ctx.db
			.query("pages")
			.withIndex("by_document_parent", q => q.eq("documentId", documentId).eq("parentPageId", parentPageId))
			.order("desc")
			.first();
		const order = (last?.order ?? 0) + 1;
		const docId = randomId();
		const pageId = await ctx.db.insert("pages", { documentId, parentPageId, docId, title, order, createdAt: now });
		await prosemirrorSync.create(ctx, docId, { type: "doc", content: [] });
		return { pageId, docId };
	},
});

export const rename = mutation({
	args: { pageId: v.id("pages"), title: v.string() },
	handler: async (ctx, { pageId, title }) => {
		await ctx.db.patch(pageId, { title });
	},
});

export const setIcon = mutation({
	args: { pageId: v.id("pages"), icon: v.optional(v.string()) },
	handler: async (ctx, { pageId, icon }) => {
		await ctx.db.patch(pageId, { icon });
	},
});

export const deletePage = mutation({
	args: { pageId: v.id("pages") },
	handler: async (ctx, { pageId }) => {
		const page = await ctx.db.get(pageId);
		if (!page) throw new Error("Page not found");
		const subpages = await ctx.db
			.query("pages")
			.withIndex("by_document_parent", q => q.eq("documentId", page.documentId).eq("parentPageId", pageId))
			.collect();
		for (const subpage of subpages) await ctx.db.delete(subpage._id);
		await ctx.db.delete(pageId);
	},
});

