import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import { createDocumentWithPagesInternal } from "./documentManagement";
import type { Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

type TemplateCategory =
  | "project_brief"
  | "meeting_notes"
  | "wiki_article"
  | "resource_doc"
  | "retrospective"
  | "general"
  | "user_created";

function categoryToDocumentType(category: TemplateCategory):
  | "project_brief"
  | "meeting_notes"
  | "wiki_article"
  | "resource_doc"
  | "retrospective"
  | "blank" {
  switch (category) {
    case "project_brief":
    case "meeting_notes":
    case "wiki_article":
    case "resource_doc":
    case "retrospective":
      return category;
    default:
      return "blank";
  }
}

function snapshotResultToString(result: { content: string | null } | null | undefined): string {
  if (result && typeof result.content === "string") return result.content;
  return JSON.stringify({ type: "doc", content: [] });
}

export const saveAsTemplate = mutation({
  args: {
    documentId: v.id("documents"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("project_brief"),
      v.literal("meeting_notes"),
      v.literal("wiki_article"),
      v.literal("resource_doc"),
      v.literal("retrospective"),
      v.literal("general"),
      v.literal("user_created")
    ),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { documentId, name, description, category, isPublic }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    // Fetch all pages for this document
    const allPages = await ctx.db
      .query("documentPages")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const topLevel = allPages.filter((p: any) => !p.parentPageId).sort((a: any, b: any) => a.order - b.order);
    const childrenByParent: Record<string, any[]> = {};
    for (const page of allPages) {
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

    // Build snapshot with ProseMirror content
    const snapshotPages = [] as Array<{
      title: string;
      icon?: string;
      order: number;
      content: string;
      subpages?: Array<{ title: string; icon?: string; order: number; content: string }>;
    }>;

    for (const page of topLevel) {
      const raw = await ctx.runQuery(components.prosemirrorSync.lib.getSnapshot, { id: page.docId });
      const content = snapshotResultToString(raw as any);
      const entry: any = {
        title: page.title,
        icon: page.icon,
        order: page.order,
        content,
      };
      const children = childrenByParent[String(page._id)] ?? [];
      if (children.length > 0) {
        entry.subpages = [];
        for (const sub of children) {
          const rawChild = await ctx.runQuery(components.prosemirrorSync.lib.getSnapshot, { id: sub.docId });
          const contentChild = snapshotResultToString(rawChild as any);
          entry.subpages.push({
            title: sub.title,
            icon: sub.icon,
            order: sub.order,
            content: contentChild,
          });
        }
      }
      snapshotPages.push(entry);
    }

    const now = Date.now();
    const user = await ctx.auth.getUserIdentity();
    const inserted = await ctx.db.insert("documentTemplates", {
      name,
      description,
      category,
      snapshot: {
        documentTitle: (doc as any).title ?? name,
        documentMetadata: (doc as any).metadata ?? undefined,
        pages: snapshotPages,
      },
      thumbnailUrl: undefined,
      usageCount: 0,
      isPublic: isPublic ?? false,
      isActive: true,
      createdBy: (user as any)?.subject ?? (user as any)?.tokenIdentifier ?? "system",
      createdAt: now,
      lastUsedAt: undefined,
    });

    return inserted;
  },
});

export const listTemplates = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("project_brief"),
        v.literal("meeting_notes"),
        v.literal("wiki_article"),
        v.literal("resource_doc"),
        v.literal("retrospective"),
        v.literal("general"),
        v.literal("user_created")
      )
    ),
    isActive: v.optional(v.boolean()),
    isPublic: v.optional(v.boolean()),
    sortBy: v.optional(v.union(v.literal("usage"), v.literal("createdAt"))),
  },
  handler: async (ctx, { category, isActive, isPublic, sortBy }) => {
    let templates: any[] = [];
    if (category) {
      templates = await ctx.db
        .query("documentTemplates")
        .withIndex("by_category", (x) => x.eq("category", category))
        .collect();
    } else {
      templates = await ctx.db.query("documentTemplates").collect();
    }

    if (isActive !== undefined) {
      templates = templates.filter((t: any) => Boolean(t.isActive) === isActive);
    }
    if (isPublic !== undefined) {
      templates = templates.filter((t: any) => Boolean(t.isPublic) === isPublic);
    }

    const sorted = [...templates].sort((a: any, b: any) => {
      if (sortBy === "createdAt") return (b.createdAt ?? 0) - (a.createdAt ?? 0);
      return (b.usageCount ?? 0) - (a.usageCount ?? 0);
    });
    return sorted;
  },
});

export const getDefaultProjectBriefTemplate = query({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("documentTemplates")
      .withIndex("by_category", (q) => q.eq("category", "project_brief"))
      .collect();
    if (templates.length === 0) return null;
    templates.sort((a: any, b: any) => {
      const usageDiff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
      if (usageDiff !== 0) return usageDiff;
      return (b.createdAt ?? 0) - (a.createdAt ?? 0);
    });
    return templates[0];
  },
});

export const createFromTemplate = mutation({
  args: {
    templateId: v.id("documentTemplates"),
    title: v.optional(v.string()),
    metadataOverrides: v.optional(v.any()),
  },
  handler: async (ctx, { templateId, title, metadataOverrides }) => {
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    const category = (template as any).category as TemplateCategory;
    const snapshot = (template as any).snapshot as any;
    const pages = Array.isArray(snapshot?.pages) ? snapshot.pages : [];
    const docTitle = title ?? snapshot?.documentTitle ?? (template as any).name ?? "Untitled";
    const metadata = { ...(snapshot?.documentMetadata ?? {}), ...(metadataOverrides ?? {}) } as any;

    const pagesInput = pages.map((p: any) => ({
      title: p.title as string,
      icon: p.icon as string | undefined,
      order: p.order as number,
      content: typeof p.content === "string" ? p.content : JSON.stringify(p.content ?? { type: "doc", content: [] }),
      subpages: Array.isArray(p.subpages)
        ? p.subpages.map((s: any) => ({
            title: s.title as string,
            icon: s.icon as string | undefined,
            order: s.order as number,
            content: typeof s.content === "string" ? s.content : JSON.stringify(s.content ?? { type: "doc", content: [] }),
          }))
        : undefined,
    }));

    const { documentId } = await createDocumentWithPagesInternal(ctx, {
      title: docTitle,
      documentType: categoryToDocumentType(category),
      metadata,
      pages: pagesInput,
    });

    await ctx.db.patch(templateId, {
      usageCount: ((template as any).usageCount ?? 0) + 1,
      lastUsedAt: Date.now(),
    });

    return { documentId } as const;
  },
});

// Helper for project creation flows
export async function createProjectBriefFromTemplateInternal(
  ctx: any,
  args: { title: string; clientId: Id<"clients">; departmentId: Id<"departments">; projectId?: Id<"projects"> }
): Promise<{ documentId: Id<"documents"> }> {
  const tpls = await ctx.db
    .query("documentTemplates")
    .withIndex("by_category", (q: any) => q.eq("category", "project_brief"))
    .collect();
  if (tpls.length === 0) {
    // Fallback: create a single-page blank project brief
    const { documentId } = await createDocumentWithPagesInternal(ctx, {
      title: args.title,
      documentType: "project_brief",
      metadata: { clientId: args.clientId, departmentId: args.departmentId, projectId: args.projectId },
      pages: [
        {
          title: "Project Brief",
          order: 0,
          content: JSON.stringify({ type: "doc", content: [] }),
        },
      ],
    });
    return { documentId };
  }

  tpls.sort((a: any, b: any) => {
    const usageDiff = (b.usageCount ?? 0) - (a.usageCount ?? 0);
    if (usageDiff !== 0) return usageDiff;
    return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  });
  const tpl = tpls[0];

  const snapshot = (tpl as any).snapshot as any;
  const pages = Array.isArray(snapshot?.pages) ? snapshot.pages : [];
  const pagesInput = pages.map((p: any) => ({
    title: p.title as string,
    icon: p.icon as string | undefined,
    order: p.order as number,
    content: typeof p.content === "string" ? p.content : JSON.stringify(p.content ?? { type: "doc", content: [] }),
    subpages: Array.isArray(p.subpages)
      ? p.subpages.map((s: any) => ({
          title: s.title as string,
          icon: s.icon as string | undefined,
          order: s.order as number,
          content: typeof s.content === "string" ? s.content : JSON.stringify(s.content ?? { type: "doc", content: [] }),
        }))
      : undefined,
  }));

  const { documentId } = await createDocumentWithPagesInternal(ctx, {
    title: args.title,
    documentType: "project_brief",
    metadata: { clientId: args.clientId, departmentId: args.departmentId, projectId: args.projectId },
    pages: pagesInput,
  });

  await ctx.db.patch((tpl as any)._id, {
    usageCount: ((tpl as any).usageCount ?? 0) + 1,
    lastUsedAt: Date.now(),
  });

  return { documentId };
}


