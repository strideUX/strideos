"use client";
import React from "react";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { PageErrorBoundary } from "@/components/error-boundaries/page-error-boundary";
import { EditorSkeleton } from "@/components/ui/loading-skeletons";
import { LazyEditorShell } from "@/lib/dynamic-imports";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <PageErrorBoundary pageName="Document Editor">
      <Suspense fallback={<EditorSkeleton />}>
        <LazyEditorShell documentId={documentId} />
      </Suspense>
    </PageErrorBoundary>
  );
}