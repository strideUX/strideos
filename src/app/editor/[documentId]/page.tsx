"use client";
import React from "react";
import { useParams } from "next/navigation";

export default function DocumentEditorPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <div className="p-6">
      <div className="text-sm text-muted-foreground">Document ID: {documentId}</div>
      <h1 className="mt-2 text-xl font-semibold">Editor coming soon</h1>
      <p className="mt-2 text-foreground/80">We're preparing a brand new editor experience. This page is temporarily a placeholder.</p>
    </div>
  );
}