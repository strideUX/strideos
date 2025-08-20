"use client";
import { Suspense } from "react";
import type { ReactElement } from "react";
import { EditorBody } from "./EditorBody";

function EditorLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Loading editor...</div>
    </div>
  );
}

export function EditorShell({ documentId }: { documentId?: string | null }): ReactElement {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorBody documentId={documentId ?? null} />
    </Suspense>
  );
}

export default EditorShell;