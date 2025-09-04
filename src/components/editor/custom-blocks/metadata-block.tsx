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
type RenderProps = { block: RenderBlock; editor?: EditorAPI } & Record<string, unknown>;

function MetadataBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as MetadataProps) ?? {};
  const docId = props.docId ?? "";

  const ctx = useQuery(api.documentManagement.getDocumentWithContext as any, docId ? { documentId: docId } : "skip") as
    | { document: { title: string; createdAt: number; documentType?: string; projectId?: Id<"projects">; clientId?: Id<"clients">; metadata?: any };
        project: { _id: Id<"projects">; title?: string } | null;
        client: { _id: Id<"clients">; name?: string } | null;
        department: { _id: Id<"departments">; name?: string } | null;
        metadata: any }
    | null
    | undefined;

  const doc = ctx?.document as any;
  const meta = (ctx?.metadata ?? {}) as any;
  const project = ctx?.project as any;
  const client = ctx?.client as any;
  const department = ctx?.department as any;

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

  return (
    <div className="metadata-block" style={{ border: "1px solid var(--meta-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--meta-bg, #fff)" }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Project Details</div>
      {!isProjectBrief || !hasIds ? (
        <div className="text-muted-foreground">This block only shows details for project briefs with a project and client.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-56">Field</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Client Stakeholders</TableCell>
              <TableCell>{getVal(client?.name)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Estimated Time</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Start Date</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Due Date</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
