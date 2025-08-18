"use client";
import { useParams, useSearchParams } from "next/navigation";
import { EditorShell } from "@/components/editor/EditorShell";

export default function DocumentEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const documentId = params.documentId as string;
  const pageId = searchParams.get("page");

  return <EditorShell documentId={documentId} initialPageId={pageId} />;
}