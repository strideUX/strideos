"use client";
import { useParams } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";
import { ErrorBoundary } from "@/components/providers/ErrorBoundary";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <ErrorBoundary>
      <EditorShell documentId={documentId} />
    </ErrorBoundary>
  );
}