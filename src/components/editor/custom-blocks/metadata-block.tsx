"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Id } from "@/convex/_generated/dataModel";

type MetadataProps = {
  docId?: string;
  textAlignment?: (typeof defaultProps.textAlignment)["default"];
};

type BlockProps = { docId?: string; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type EditorAPI = { updateBlock?: (block: unknown, update: unknown) => void };
type RenderProps = { block: RenderBlock; editor?: EditorAPI & { options?: { comments?: { threadStore?: { documentId?: string | null } } } } } & Record<string, unknown>;

function MetadataBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as MetadataProps) ?? {};
  const pageDocId = props.docId ?? "";
  const documentsTableId = renderProps.editor?.options?.comments?.threadStore?.documentId ?? null;

  const unsafeQuery = useQuery as unknown as (fn: unknown, args: unknown) => any;
  const arg = documentsTableId ? { documentId: documentsTableId as unknown as Id<"documents"> } : "skip";
  const ctx = unsafeQuery((api as any).documentManagement.getDocumentWithContext, arg) as any;

  const doc = ctx?.document as any;
  const meta = (ctx?.metadata ?? {}) as any;
  const project = ctx?.project as any;
  const client = ctx?.client as any;
  const department = ctx?.department as any;
  const clientUsers = (ctx?.clientUsers ?? []) as any[];
  const projectTasks = (ctx?.projectTasks ?? []) as any[];

  // Debug logging
  console.log("MetadataBlock Debug:", {
    documentId: documentsTableId,
    doc,
    meta,
    project,
    client,
    department,
    clientUsers,
    projectTasks,
    docProjectId: doc?.projectId,
    docClientId: doc?.clientId,
    docDepartmentId: doc?.departmentId,
    projectTargetDueDate: project?.targetDueDate,
    projectDepartmentId: project?.departmentId,
    totalTasks: projectTasks?.length,
  });

  const isProjectBrief = (doc?.documentType) === "project_brief";
  const hasIds = Boolean(doc?.projectId || meta?.projectId) && Boolean(doc?.clientId || meta?.clientId);

  const getVal = (value: unknown): string => {
    if (value === undefined || value === null || value === "") return "-";
    if (typeof value === "number") {
      // treat large numbers as timestamps
      if (value > 10_000_000_000) return new Date(value).toLocaleDateString();
      return String(value);
    }
    return String(value);
  };

  // Calculate total estimated time from task estimatedHours
  const totalEstimatedTime = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) return null;
    const totalHours = projectTasks.reduce((sum: number, task: any) => {
      const hours = task?.estimatedHours || 0;
      return sum + hours;
    }, 0);
    return totalHours > 0 ? totalHours : null;
  }, [projectTasks]);

  return (
    <div className="metadata-block w-full" style={{ border: "1px solid var(--meta-border, #e5e7eb)", borderRadius: 8, padding: 16, margin: "8px 0", background: "var(--meta-bg, #fff)" }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Project Details</div>
      {!isProjectBrief || !hasIds ? (
        <div className="text-muted-foreground text-sm">This block only shows details for project briefs with a project and client.</div>
      ) : (
        <div className="space-y-3">
          {/* Client Stakeholders */}
          <div className="flex items-start">
            <span className="font-medium text-sm" style={{ width: "25%", minWidth: "140px" }}>Client Stakeholders</span>
            <div className="flex-1 flex flex-wrap gap-1.5">
              {clientUsers && clientUsers.length > 0 ? (
                clientUsers.map((user: any, idx: number) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs"
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-[10px]">
                      {(user?.name?.[0] || user?.email?.[0] || "?").toUpperCase()}
                    </div>
                    <span>{user?.name || user?.email || "Unknown"}</span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-sm">No stakeholders assigned</span>
              )}
            </div>
          </div>

          {/* Estimated Time */}
          <div className="flex items-start">
            <span className="font-medium text-sm" style={{ width: "25%", minWidth: "140px" }}>Estimated Time</span>
            <div className="flex-1">
              {totalEstimatedTime !== null ? (
                <span className="text-sm">{totalEstimatedTime} hours</span>
              ) : (
                <span className="text-gray-400 text-sm">No tasks added</span>
              )}
            </div>
          </div>

          {/* Due Date */}
          <div className="flex items-start">
            <span className="font-medium text-sm" style={{ width: "25%", minWidth: "140px" }}>Due Date</span>
            <div className="flex-1">
              <span className={project?.targetDueDate ? "text-sm" : "text-sm text-gray-400"}>
                {project?.targetDueDate ? getVal(project.targetDueDate) : "-"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Metadata = createReactBlockSpec(
  {
    type: "metadata",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      docId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <MetadataBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (props): ReactElement => {
      const id = ((props.block.props as MetadataProps)?.docId ?? "").toString();
      return (
        <div className="metadata-block" data-document-id={id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Project Details</strong>
        </div>
      );
    },
  }
);

export type MetadataType = "metadata";
