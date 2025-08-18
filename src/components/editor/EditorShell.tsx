"use client";
import dynamic from "next/dynamic";
import type { ReactElement } from "react";

const EditorBody = dynamic(() => import("./EditorBody").then(m => m.default ?? m.EditorBody), { ssr: false });

export function EditorShell({ documentId, initialPageId }: { documentId?: string | null; initialPageId?: string | null }): ReactElement {
  return <EditorBody documentId={documentId ?? null} initialPageId={initialPageId ?? null} /> as any;
}

export default EditorShell;