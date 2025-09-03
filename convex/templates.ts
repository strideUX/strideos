import { components } from "./_generated/api";
import { ProsemirrorSync } from "@convex-dev/prosemirror-sync";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getOrCreateBlankTemplate(ctx: MutationCtx) {
  let tpl = await ctx.db.query("documentTemplates").withIndex("by_key", q => q.eq("key", "blank")).first();
  if (!tpl) {
    const id = await ctx.db.insert("documentTemplates", {
      key: "blank",
      name: "Blank",
      description: "A blank document with a single empty page.",
      category: "general",
      snapshot: {
        documentTitle: "Untitled",
        pages: [
          {
            title: "Untitled",
            order: 0,
            content: JSON.stringify({ type: "doc", content: [] }),
          },
        ],
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
    console.log("🔨 Creating new project_brief template");
    const now = Date.now();
    const snapshot = buildProjectBriefSnapshot();
    console.log("📋 Built snapshot with pages:", snapshot.pages.map(p => p.title));
    const id = await ctx.db.insert("documentTemplates", {
      key: "project_brief",
      name: "Project Brief",
      description: "Standard 5-page project brief with overview, timeline, assets, weekly status, and original request.",
      category: "project_brief",
      snapshot,
      isActive: true,
      isPublic: false,
      usageCount: 0,
      createdAt: now,
    } as any);
    tpl = await ctx.db.get(id);
  } else {
    const repaired = maybeRepairProjectBriefSnapshot((tpl as any).snapshot as any);
    if (repaired.changed) {
      const tplId = (tpl as any)._id as Id<"documentTemplates">;
      await ctx.db.patch(tplId, { snapshot: repaired.snapshot, updatedAt: Date.now() } as any);
      tpl = await ctx.db.get(tplId);
    }
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
    try { 
      content = JSON.parse(page.content || "{}"); 
      console.log(`📄 Template page "${page.title}" parsed content:`, JSON.stringify(content).substring(0, 200));
    } catch (e) {
      console.error(`❌ Failed to parse template page "${page.title}":`, e);
    }
    content = sanitizePMDoc(content);
    console.log(`✅ Sanitized content for "${page.title}":`, JSON.stringify(content).substring(0, 200));
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

function buildPMDoc(nodes: unknown[]): string {
  return JSON.stringify({ type: "doc", content: nodes });
}

function heading(level: number, text: string): unknown {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}

function para(text: string): unknown {
  return { type: "paragraph", content: text ? [{ type: "text", text }] : [] };
}

function buildProjectBriefSnapshot(): { documentTitle: string; pages: Array<{ title: string; order: number; content: string }> } {
  const pages = [
    {
      title: "Overview",
      order: 0,
      content: buildPMDoc([
        heading(1, "Project Overview"),
        para("Briefly summarize the project goal and why it matters."),
        heading(2, "Objectives"),
        para("List 3–5 clear outcomes we must achieve for success."),
        heading(2, "Success Criteria"),
        para("Define how we will measure success (e.g., KPIs, acceptance criteria)."),
      ]),
    },
    {
      title: "Timeline",
      order: 1,
      content: buildPMDoc([
        heading(1, "Timeline & Milestones"),
        para("Capture key phases, target dates, and major milestones."),
        heading(2, "Milestones"),
        para("e.g., Discovery complete, Design approved, MVP launch, Final delivery."),
      ]),
    },
    {
      title: "Assets",
      order: 2,
      content: buildPMDoc([
        heading(1, "Assets & Deliverables"),
        para("List required resources and expected deliverables (links welcome)."),
        heading(2, "References"),
        para("Add links to brand guidelines, examples, or related documents."),
      ]),
    },
    {
      title: "Week Status",
      order: 3,
      content: buildPMDoc([
        heading(1, "Weekly Status"),
        para("Track progress each week. Use /Weekly Update to insert the block."),
        heading(2, "This Week"),
        para("Accomplished: …  Focus: …  Blockers: …"),
      ]),
    },
    {
      title: "Original Request",
      order: 4,
      content: buildPMDoc([
        heading(1, "Original Request"),
        para("Paste the initial request, brief, or statement of work here."),
        heading(2, "Notes"),
        para("Call out constraints, assumptions, or open questions."),
      ]),
    },
  ];

  return { documentTitle: "Project Brief", pages };
}

function maybeRepairProjectBriefSnapshot(
  snapshot: unknown
): { changed: boolean; snapshot: { documentTitle: string; pages: Array<{ title: string; order: number; content: string }> } } {
  const desired = buildProjectBriefSnapshot();
  const snap = (snapshot as { documentTitle?: string; pages?: Array<{ title?: string; order?: number; content?: string }> }) || {};
  const pages = Array.isArray(snap.pages) ? snap.pages : [];

  const titlesInOrder = ["Overview", "Timeline", "Assets", "Week Status", "Original Request"];
  let changed = false;

  if (pages.length !== titlesInOrder.length) changed = true;
  else {
    for (let i = 0; i < titlesInOrder.length; i++) {
      const p = pages[i] || {};
      if (p.title !== titlesInOrder[i] || p.order !== i || typeof p.content !== "string") {
        changed = true;
        break;
      }
    }
  }

  return changed ? { changed: true, snapshot: desired } : { changed: false, snapshot: { documentTitle: snap.documentTitle || "Project Brief", pages: pages as any } };
}

export async function ensureCoreTemplates(ctx: MutationCtx): Promise<void> {
  await getOrCreateBlankTemplate(ctx);
  await getProjectBriefTemplate(ctx);
}

