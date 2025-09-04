import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

// Centralized template seed definitions
const TEMPLATE_SEEDS = {
  blank: {
    key: "blank",
    name: "Blank Document",
    description: "A single empty page ready for content",
    category: "general" as const,
    pages: [
      {
        title: "Untitled",
        icon: "📄",
        order: 0,
        content: JSON.stringify({ type: "doc", content: [] }),
      },
    ],
  },
  project_brief: {
    key: "project_brief",
    name: "Project Brief",
    description:
      "6-page project structure with overview, tasks, timeline, assets, status, and request",
    category: "project_brief" as const,
    pages: [
      { title: "Overview", icon: "📋", order: 0, content: JSON.stringify({ type: "doc", content: [] }) },
      { title: "Tasks", icon: "☑️", order: 1, content: JSON.stringify({ type: "doc", content: [] }) },
      { title: "Timeline", icon: "⏱️", order: 2, content: JSON.stringify({ type: "doc", content: [] }) },
      { title: "Assets", icon: "📦", order: 3, content: JSON.stringify({ type: "doc", content: [] }) },
      { title: "Week Status", icon: "📊", order: 4, content: JSON.stringify({ type: "doc", content: [] }) },
      { title: "Original Request", icon: "📝", order: 5, content: JSON.stringify({ type: "doc", content: [] }) },
    ],
  },
} as const;

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateBlankTemplate(ctx: MutationCtx) {
  let tpl = await ctx.db.query("documentTemplates").withIndex("by_key", q => q.eq("key", "blank")).first();
  if (!tpl) {
    const id = await ctx.db.insert("documentTemplates", {
      key: TEMPLATE_SEEDS.blank.key,
      name: TEMPLATE_SEEDS.blank.name,
      description: TEMPLATE_SEEDS.blank.description,
      category: TEMPLATE_SEEDS.blank.category as any,
      snapshot: {
        documentTitle: "Untitled",
        pages: TEMPLATE_SEEDS.blank.pages.map(p => ({
          title: p.title,
          icon: (p as any).icon,
          order: p.order,
          content: p.content,
        })),
      },
      isActive: true,
      isPublic: false,
      usageCount: 0,
      createdAt: Date.now(),
    } as any);
    tpl = await ctx.db.get(id);
  }
  return tpl!;
}

export async function getProjectBriefTemplate(ctx: MutationCtx) {
  let tpl = await ctx.db.query("documentTemplates")
    .withIndex("by_category", q => q.eq("category", "project_brief"))
    .first();
  if (!tpl) {
    const now = Date.now();
    const snapshot = {
      documentTitle: TEMPLATE_SEEDS.project_brief.name,
      pages: TEMPLATE_SEEDS.project_brief.pages.map(p => ({
        title: p.title,
        icon: (p as any).icon,
        order: p.order,
        content: p.content,
      })),
    };
    const id = await ctx.db.insert("documentTemplates", {
      key: TEMPLATE_SEEDS.project_brief.key,
      name: TEMPLATE_SEEDS.project_brief.name,
      description: TEMPLATE_SEEDS.project_brief.description,
      category: TEMPLATE_SEEDS.project_brief.category as any,
      snapshot,
      isActive: true,
      isPublic: false,
      usageCount: 0,
      createdAt: now,
    } as any);
    tpl = await ctx.db.get(id);
  }
  return tpl ?? null;
}

export async function createDocumentFromTemplateInternal(
  ctx: MutationCtx,
  args: {
    title: string;
    templateId?: string;
    templateKey?: string; // e.g., "blank"
    documentType?: "project_brief" | "blank" | "meeting_notes" | "wiki_article" | "resource_doc" | "retrospective";
    projectId?: string;
    clientId?: string;
    departmentId?: string;
    metadata?: any;
  }
): Promise<{ documentId: any; pageIds: any[]; docIds: string[] }> {
  const now = Date.now();

  // Resolve template
  let template: any = null;
  if (args.templateId) template = await ctx.db.get(args.templateId as any);
  if (!template && args.templateKey) {
    template = await ctx.db.query("documentTemplates").withIndex("by_key", q => q.eq("key", args.templateKey!)).first();
  }
  if (!template && args.documentType === "project_brief") {
    template = await getProjectBriefTemplate(ctx);
  }
  if (!template) {
    template = await getOrCreateBlankTemplate(ctx);
  }

  // Create document
  const documentId = await ctx.db.insert("documents", {
    title: args.title,
    createdAt: now,
    projectId: args.projectId as any,
    clientId: args.clientId as any,
    departmentId: args.departmentId as any,
    documentType: (args.documentType ?? "blank") as any,
    status: "draft",
    metadata: args.metadata,
  } as any);

  // Create pages and ProseMirror docs
  const snapshot = (template as any).snapshot ?? { pages: [{ title: args.title, order: 0, content: JSON.stringify({ type: "doc", content: [] }) }] };
  const pageIds: any[] = [];
  const docIds: string[] = [];

  for (const page of (snapshot.pages ?? [])) {
    const docId = randomId();
    let content: any = { type: "doc", content: [] };
    try { content = JSON.parse(page.content || "{}"); } catch {}
    content = sanitizePMDoc(content);
    await prosemirrorSync.create(ctx as any, docId, content);
    const pageId = await ctx.db.insert("documentPages", {
      documentId,
      parentPageId: undefined,
      docId,
      title: page.title ?? "Untitled",
      icon: page.icon,
      order: page.order ?? 0,
      createdAt: now,
    } as any);
    pageIds.push(pageId);
    docIds.push(docId);
  }

  // Best-effort: update template usage
  try {
    if ((template as any)?._id) {
      const usage = (template as any).usageCount ?? 0;
      await ctx.db.patch((template as any)._id, { usageCount: usage + 1, lastUsedAt: now } as any);
    }
  } catch {}

  return { documentId, pageIds, docIds };
}

// Ensure PM JSON has valid block-level structure (no top-level text nodes)
function sanitizePMDoc(input: unknown): { type: string; content: unknown[] } {
  const fallback = { type: "doc", content: [] as unknown[] };
  if (!input || typeof input !== "object") return fallback;
  const obj = input as { type?: string; content?: unknown[] };
  const type = obj.type === "doc" ? "doc" : "doc";
  const content: unknown[] = Array.isArray(obj.content) ? obj.content : [];
  const fixed = content.map((node) => {
    if (node && typeof node === "object" && (node as { type?: string }).type === "text") {
      return { type: "paragraph", content: [node] };
    }
    return node;
  });
  return { type, content: fixed };
}

// Removed legacy content builders and repair function; seeds now define structure/content

export async function ensureCoreTemplates(ctx: MutationCtx): Promise<void> {
  await getOrCreateBlankTemplate(ctx);
  await getProjectBriefTemplate(ctx);
}

