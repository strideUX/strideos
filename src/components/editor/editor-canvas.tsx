"use client";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { BlockNoteEditor } from "@/components/editor";
import { IconPicker } from "@/components/editor/sidebar";

interface EditorCanvasProps {
  theme: "light" | "dark";
  pageWidth: "default" | "full";
  currentPageTitle: string;
  pageDocId: string;
  showCursorLabels: boolean;
  editable: boolean;
  iconValue: string | null;
  onIconChange: (val: string | null) => void;
  onEditorReady: (instance: unknown) => void;
  onTitleChange?: (title: string) => void;
  onTitleInput?: (title: string) => void;
  /** Optional: bubble block clicks upward (used to focus corresponding thread) */
  onBlockClick?: (blockId: string) => void;
  // NEW: parent Convex document id (documents table)
  documentId?: string | null;
}

export function EditorCanvas(props: EditorCanvasProps): ReactElement {
  const { theme, pageWidth, currentPageTitle, pageDocId, showCursorLabels, editable, iconValue, onIconChange, onEditorReady, onTitleChange, onTitleInput, onBlockClick } = props;
  const [localTitle, setLocalTitle] = useState<string>(currentPageTitle || "Untitled");

  useEffect(() => {
    setLocalTitle(currentPageTitle || "Untitled");
  }, [currentPageTitle]);

  const commitTitle = useCallback(() => {
    const next = (localTitle ?? "").trim();
    if (!next) {
      setLocalTitle("Untitled");
      if (onTitleChange) onTitleChange("Untitled");
      return;
    }
    if (next !== (currentPageTitle || "")) {
      if (onTitleChange) onTitleChange(next);
    }
  }, [localTitle, currentPageTitle, onTitleChange]);
  return (
    <div className={`h-full min-h-0 overflow-auto p-6 ${theme === "dark" ? "bg-neutral-900 text-neutral-100" : "bg-white text-neutral-900"}`}>
      <div className={pageWidth === "full" ? "w-full max-w-none" : "mx-auto w-full max-w-5xl"}>
        <div className="mt-4 mb-4 flex items-center gap-3">
          <IconPicker theme={theme} value={iconValue} onChange={onIconChange} />
          <h1 className="text-5xl font-extrabold tracking-tight">
            {editable ? (
              <input
                aria-label="Page title"
                className="bg-transparent outline-none border-none p-0 m-0 focus:ring-0 focus:outline-none"
                value={localTitle}
                onChange={(e) => { setLocalTitle(e.target.value); if (onTitleInput) onTitleInput(e.target.value); }}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitTitle(); (e.target as HTMLInputElement).blur(); }
                  if (e.key === "Escape") { e.preventDefault(); setLocalTitle(currentPageTitle || "Untitled"); (e.target as HTMLInputElement).blur(); }
                }}
              />
            ) : (
              currentPageTitle || "Untitled"
            )}
          </h1>
        </div>
        <BlockNoteEditor
          docId={pageDocId}
          showCursorLabels={showCursorLabels}
          editable={editable}
          theme={theme}
          onEditorReady={onEditorReady}
          onBlockClick={onBlockClick}
          documentId={props.documentId}
        />
      </div>
    </div>
  );
}

export default EditorCanvas;
