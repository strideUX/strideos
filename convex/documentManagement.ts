import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

type DocumentPageInput = {
  title: string;
  icon?: string;
  order: number;
  content?: string; // stringified ProseMirror JSON
  subpages?: DocumentPageInput[];
};

export async function createDocumentWithPagesInternal(
  ctx: any,
  args: {
    title: string;
    documentType?: "project_brief" | "meeting_notes" | "wiki_article" | "resource_doc" | "retrospective" | "blank";
    metadata?: {
      clientId?: string;
      projectId?: string;
      departmentId?: string;
      sprintId?: string;
      templateId?: string;
      templateVersion?: number;
      dynamicFields?: Array<{ fieldName: string; sourceType: string; sourceId: string; fieldPath: string }>;
      customProperties?: unknown;
    };
    pages?: DocumentPageInput[];
  }
): Promise<{ documentId: Id<"documents"> }> {
  const now = Date.now();
  const identity = await ctx.auth.getUserIdentity();
  const documentId: Id<"documents"> = await ctx.db.insert("documents", {
    title: args.title,
    createdAt: now,
    updatedAt: now,
    ownerId: identity?.subject,
    documentType: args.documentType ?? "blank",
    // Back-compat: duplicate common fields when present
    clientId: args.metadata?.clientId as any,
    departmentId: args.metadata?.departmentId as any,
    projectId: args.metadata?.projectId as any,
    metadata: args.metadata as any,
  });

  // If pages not provided, create a single blank page
  const pagesToCreate: DocumentPageInput[] = Array.isArray(args.pages) && args.pages.length > 0
    ? args.pages
    : [{ title: args.title || "Untitled", order: 0, content: JSON.stringify({ type: "doc", content: [] }) }];

  // Create top-level pages and any subpages
  for (const page of pagesToCreate) {
    const topLevelDocId = randomId();
    await ctx.db.insert("documentPages", {
      documentId,
      parentPageId: undefined,
      docId: topLevelDocId,
      title: page.title,
      icon: page.icon,
      order: page.order,
      createdAt: now,
    });
    await prosemirrorSync.create(ctx, topLevelDocId, page.content ? JSON.parse(page.content) : { type: "doc", content: [] });

    if (Array.isArray(page.subpages)) {
      for (const [index, sub] of page.subpages.entries()) {
        const parent = await ctx.db
          .query("documentPages")
          .withIndex("by_document_order", (q: any) => q.eq("documentId", documentId))
          .order("desc")
          .first();

        const subDocId = randomId();
        const subPageId = await ctx.db.insert("documentPages", {
          documentId,
          parentPageId: parent?._id,
          docId: subDocId,
          title: sub.title,
          icon: sub.icon,
          order: typeof sub.order === "number" ? sub.order : index + 1,
          createdAt: now,
        });
        await prosemirrorSync.create(ctx, subDocId, sub.content ? JSON.parse(sub.content) : { type: "doc", content: [] });
      }
    }
  }

  return { documentId };
}

export const createDocument = mutation({
  args: {
    title: v.string(),
    documentType: v.optional(
      v.union(
        v.literal("project_brief"),
        v.literal("meeting_notes"),
        v.literal("wiki_article"),
        v.literal("resource_doc"),
        v.literal("retrospective"),
        v.literal("blank")
      )
    ),
    metadata: v.optional(v.any()),
    pages: v.optional(v.array(v.any())),
  },
  handler: async (ctx, { title, documentType, metadata, pages }) => {
    const { documentId } = await createDocumentWithPagesInternal(ctx, {
      title,
      documentType: documentType as any,
      metadata: metadata as any,
      pages: pages as any,
    });
    return { documentId };
  },
});

export const updateDocumentMetadata = mutation({
  args: {
    documentId: v.id("documents"),
    metadata: v.object({
      clientId: v.optional(v.id("clients")),
      projectId: v.optional(v.id("projects")),
      departmentId: v.optional(v.id("departments")),
      sprintId: v.optional(v.id("sprints")),
      templateId: v.optional(v.id("documentTemplates")),
      templateVersion: v.optional(v.number()),
      dynamicFields: v.optional(v.array(v.object({
        fieldName: v.string(),
        sourceType: v.string(),
        sourceId: v.string(),
        fieldPath: v.string(),
      }))),
      customProperties: v.optional(v.any()),
    }),
  },
  handler: async (ctx, { documentId, metadata }) => {
    // Validate references exist (best-effort)
    if (metadata.clientId) await ctx.db.get(metadata.clientId);
    if (metadata.departmentId) await ctx.db.get(metadata.departmentId);
    if (metadata.projectId) await ctx.db.get(metadata.projectId);
    if (metadata.sprintId) await ctx.db.get(metadata.sprintId);

    const doc = await ctx.db.get(documentId);
    const current = (doc as any)?.metadata ?? {};
    const merged = { ...current, ...metadata };

    // Back-compat duplication
    const backCompat: any = {};
    if (metadata.clientId !== undefined) backCompat.clientId = metadata.clientId;
    if (metadata.departmentId !== undefined) backCompat.departmentId = metadata.departmentId;
    if (metadata.projectId !== undefined) backCompat.projectId = metadata.projectId;

    await ctx.db.patch(documentId, { metadata: merged, ...backCompat });
    return { documentId };
  },
});

export const getDocumentWithContext = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc) return null;

    const metadata = (doc as any).metadata ?? {};
    const [client, project, department] = await Promise.all([
      metadata.clientId ? ctx.db.get(metadata.clientId) : Promise.resolve(null),
      metadata.projectId ? ctx.db.get(metadata.projectId) : Promise.resolve(null),
      metadata.departmentId ? ctx.db.get(metadata.departmentId) : Promise.resolve(null),
    ]);

    // Load pages hierarchy
    const pages = await ctx.db
      .query("documentPages")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const topLevel = pages.filter((p: any) => !p.parentPageId).sort((a: any, b: any) => a.order - b.order);
    const childrenByParent: Record<string, any[]> = {};
    for (const page of pages) {
      const parent = (page as any).parentPageId;
      if (parent) {
        const key = String(parent);
        if (!childrenByParent[key]) childrenByParent[key] = [];
        childrenByParent[key].push(page);
      }
    }
    for (const key of Object.keys(childrenByParent)) {
      childrenByParent[key].sort((a, b) => a.order - b.order);
    }

    return { document: doc, metadata, client, project, department, pages: topLevel, childrenByParent } as const;
  },
});


