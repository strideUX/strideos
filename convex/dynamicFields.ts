import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Metadata = {
  clientId?: Id<"clients">;
  projectId?: Id<"projects">;
  departmentId?: Id<"departments">;
  sprintId?: Id<"sprints">;
  [key: string]: unknown;
};

function getValueByPath(root: any, path: string): unknown {
  const parts = path.split(".");
  let current: any = root;
  for (const p of parts) {
    if (current == null) return undefined;
    current = current[p];
  }
  return current;
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value);
}

function replacePlaceholdersInText(text: string, context: Record<string, any>): string {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g, (_m, path: string) => {
    const [entity, ...rest] = path.split(".");
    const lookup = context[entity];
    if (!lookup) return "";
    const val = rest.length > 0 ? getValueByPath(lookup, rest.join(".")) : lookup;
    return stringifyValue(val);
  });
}

export async function resolveDynamicFieldsInContentString(
  ctx: any,
  metadata: Metadata | undefined,
  content: string
): Promise<string> {
  // Build lookup context
  const context: Record<string, any> = {};
  if (metadata?.clientId) {
    try { context.client = await ctx.db.get(metadata.clientId); } catch {}
  }
  if (metadata?.projectId) {
    try { context.project = await ctx.db.get(metadata.projectId); } catch {}
  }
  if (metadata?.departmentId) {
    try { context.department = await ctx.db.get(metadata.departmentId); } catch {}
  }
  if (metadata?.sprintId) {
    try { context.sprint = await ctx.db.get(metadata.sprintId); } catch {}
  }

  // Try to parse as ProseMirror JSON and replace inside text nodes
  try {
    const parsed = JSON.parse(content);
    const traverse = (node: any): void => {
      if (node == null || typeof node !== "object") return;
      if (typeof node.text === "string") {
        node.text = replacePlaceholdersInText(node.text, context);
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) traverse(child);
      }
      if (Array.isArray(node.marks)) {
        for (const mark of node.marks) traverse(mark);
      }
      if (Array.isArray(node.children)) {
        for (const child of node.children) traverse(child);
      }
    };
    traverse(parsed);
    return JSON.stringify(parsed);
  } catch {
    // Fallback: plain string replace
    return replacePlaceholdersInText(content, context);
  }
}

export const resolveDynamicFields = mutation({
  args: {
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, { content, metadata }) => {
    const result = await resolveDynamicFieldsInContentString(ctx, (metadata ?? {}) as any, content);
    return { content: result } as const;
  },
});

export const getAvailableFields = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const doc = await ctx.db.get(documentId);
    if (!doc) return [] as Array<{ key: string; label: string; source: string }>; 
    const m = (doc as any).metadata ?? {};
    const fields: Array<{ key: string; label: string; source: string }> = [];

    if (m.clientId) {
      fields.push(
        { key: "client.name", label: "Client Name", source: "client" },
        { key: "client.website", label: "Client Website", source: "client" },
        { key: "client.status", label: "Client Status", source: "client" },
        { key: "client.projectKey", label: "Client Project Key", source: "client" },
      );
    }
    if (m.projectId) {
      fields.push(
        { key: "project.title", label: "Project Title", source: "project" },
        { key: "project.status", label: "Project Status", source: "project" },
        { key: "project.targetDueDate", label: "Project Target Due Date", source: "project" },
        { key: "project.slug", label: "Project ID", source: "project" },
        { key: "project.projectKey", label: "Project Key", source: "project" },
      );
    }
    if (m.departmentId) {
      fields.push(
        { key: "department.name", label: "Department Name", source: "department" },
      );
    }
    if (m.sprintId) {
      fields.push(
        { key: "sprint.name", label: "Sprint Name", source: "sprint" },
        { key: "sprint.startDate", label: "Sprint Start Date", source: "sprint" },
        { key: "sprint.endDate", label: "Sprint End Date", source: "sprint" },
        { key: "sprint.status", label: "Sprint Status", source: "sprint" },
      );
    }

    return fields;
  },
});


