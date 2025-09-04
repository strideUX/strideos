"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";

type DatatableProps = {
  docId?: string; // current document id for context
  textAlignment?: 'left' | 'center' | 'right' | 'justify';
};

type BlockProps = { docId?: string; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type EditorAPI = { options?: { comments?: { threadStore?: { documentId?: string | null } } } };
type RenderProps = { block: RenderBlock; editor?: EditorAPI } & Record<string, unknown>;

function DatatableBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as DatatableProps) ?? {};
  const pageDocId = props.docId ?? "";
  const documentsTableId = renderProps.editor?.options?.comments?.threadStore?.documentId ?? null;

  // Fetch document context to gate rendering and find linked project/client
  const ctx = useQuery(api.documentManagement.getDocumentWithContext as any, documentsTableId ? { documentId: documentsTableId as unknown as Id<"documents"> } : "skip") as
    | { document: { documentType?: string; projectId?: Id<"projects">; clientId?: Id<"clients">; metadata?: any }; project?: { _id: Id<"projects">; title?: string } | null; client?: { _id: Id<"clients">; name?: string } | null; metadata: any }
    | null
    | undefined;

  const projectId = (ctx?.document as any)?.projectId || (ctx?.metadata as any)?.projectId || (ctx?.project?._id);
  const clientId = (ctx?.document as any)?.clientId || (ctx?.metadata as any)?.clientId || (ctx?.client?._id);
  const isProjectBrief = (ctx?.document as any)?.documentType === "project_brief";

  // Fetch tasks for the project
  const tasks = useQuery(api.tasks.getTasksByProject as any, projectId ? { projectId } : "skip") as Array<any> | undefined;

  // Simple create flow for now: prompt for title and create linked to project
  const createTask = useMutation(api.tasks.createTask as any);
  const handleAdd = async (): Promise<void> => {
    if (!projectId || !clientId) return;
    const title = window.prompt("New task title", "Untitled Task") ?? "";
    if (!title.trim()) return;
    try {
      await createTask({ title: title.trim(), projectId, clientId, departmentId: (tasks?.[0]?.departmentId ?? (ctx as any)?.project?.departmentId) ?? (ctx as any)?.document?.departmentId, status: "todo" });
    } catch {}
  };

  return (
    <div className="datatable-block" style={{ border: "1px solid var(--dt-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--dt-bg, #fff)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Project Tasks</div>
        <div contentEditable={false}>
          <Button type="button" onClick={handleAdd} size="sm" variant="default" disabled={!projectId}>Add Task</Button>
        </div>
      </div>
      {!isProjectBrief || !projectId || !clientId ? (
        <div style={{ color: "var(--dt-muted, #6b7280)" }}>This block only shows for project briefs with a project and client.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tasks ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">No tasks yet.</TableCell>
              </TableRow>
            ) : (
              (tasks ?? []).map((t) => (
                <TableRow key={String(t._id)}>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell className="capitalize">{t.status}</TableCell>
                  <TableCell>{t.assignee?.name ?? "-"}</TableCell>
                  <TableCell>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export const Datatable = createReactBlockSpec(
  {
    type: "datatable",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      docId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <DatatableBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (props): ReactElement => {
      const id = ((props.block.props as DatatableProps)?.docId ?? "").toString();
      return (
        <div className="datatable-block" data-doc-id={id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Project Tasks</strong>
        </div>
      );
    },
  }
);

export type DatatableType = "datatable";
