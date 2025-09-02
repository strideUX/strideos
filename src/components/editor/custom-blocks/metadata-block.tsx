"use client";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { useMemo, type ReactElement } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Document } from "@/types/documents.types";

type MetadataProps = {
  documentId?: string;
  textAlignment?: (typeof defaultProps.textAlignment)["default"];
};

type BlockProps = { documentId?: string; textAlignment?: (typeof defaultProps.textAlignment)["default"] };
type RenderBlock = { props?: BlockProps };
type EditorAPI = { updateBlock?: (block: unknown, update: unknown) => void };
type RenderProps = { block: RenderBlock; editor?: EditorAPI } & Record<string, unknown>;

function MetadataBlockComponent(renderProps: RenderProps): ReactElement {
  const props = (renderProps.block.props as MetadataProps) ?? {};
  const documents = useQuery(api.documents.list, {}) as Document[] | undefined;

  const selectedId = props.documentId ?? "";
  const selected = useMemo(() => {
    return (documents ?? []).find((d) => String(d._id) === selectedId);
  }, [documents, selectedId]);

  const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const nextId = e.target.value;
    try {
      renderProps.editor?.updateBlock?.(renderProps.block, {
        type: "metadata",
        props: { documentId: nextId },
      });
    } catch {}
  };

  return (
    <div className="metadata-block" style={{ border: "1px solid var(--meta-border, #e5e7eb)", borderRadius: 8, padding: 12, margin: "8px 0", background: "var(--meta-bg, #fff)" }}>
      <div className="flex items-center justify-between gap-3" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Document Metadata</div>
        <div contentEditable={false}>
          <select value={selectedId} onChange={handleChange} style={{ border: "1px solid var(--meta-border, #e5e7eb)", borderRadius: 6, padding: "4px 8px", background: "var(--meta-select-bg, white)", color: "var(--meta-select-fg, inherit)" }}>
            <option value="">Select document…</option>
            {(documents ?? []).map((d) => (
              <option key={String(d._id)} value={String(d._id)}>{d.title}</option>
            ))}
          </select>
        </div>
      </div>
      {selected ? (
        <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", rowGap: 6, columnGap: 12 }}>
          <div style={{ color: "var(--meta-muted, #6b7280)" }}>Title</div>
          <div>{selected.title}</div>

          <div style={{ color: "var(--meta-muted, #6b7280)" }}>Created At</div>
          <div>{new Date(selected.createdAt).toLocaleString()}</div>

          {selected.ownerId ? <><div style={{ color: "var(--meta-muted, #6b7280)" }}>Owner</div><div>{selected.ownerId}</div></> : null}

          {selected.archivedAt ? <><div style={{ color: "var(--meta-muted, #6b7280)" }}>Archived</div><div>{new Date(selected.archivedAt).toLocaleString()}</div></> : null}
        </div>
      ) : (
        <div style={{ color: "var(--meta-muted, #6b7280)" }}>No document selected.</div>
      )}
    </div>
  );
}

export const Metadata = createReactBlockSpec(
  {
    type: "metadata",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      documentId: { default: "" as const },
    },
    content: "none",
  },
  {
    render: (props): ReactElement => {
      return <MetadataBlockComponent {...(props as unknown as RenderProps)} />;
    },
    toExternalHTML: (props): ReactElement => {
      const id = ((props.block.props as MetadataProps)?.documentId ?? "").toString();
      return (
        <div className="metadata-block" data-document-id={id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <strong>Document Metadata</strong>
        </div>
      );
    },
  }
);

export type MetadataType = "metadata";
