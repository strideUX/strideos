"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "@/providers/error-boundary";
import { EditorSkeleton } from "@/components/ui/loading-skeletons";
import { LazyEditorShell } from "@/lib/dynamic-imports";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <ErrorBoundary>
      <Suspense fallback={<EditorSkeleton />}>
        <LazyEditorShell documentId={documentId} />
      </Suspense>
    </ErrorBoundary>
  );
}