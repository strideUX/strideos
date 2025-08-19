"use client";
import { useParams } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  // No need for page query param - EditorBody will auto-select first page
  return <EditorShell documentId={documentId} />;
}