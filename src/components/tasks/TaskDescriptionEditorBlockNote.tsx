"use client";

import { useEffect, useMemo, useCallback } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";

interface TaskDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function TaskDescriptionEditor({ value, onChange }: TaskDescriptionEditorProps) {
  // Parse initial content from HTML
  const initialContent = useMemo(() => {
    if (!value || value === "<p></p>" || value === "") {
      return undefined;
    }
    
    try {
      // BlockNote can parse HTML directly
      return value;
    } catch (error) {
      console.warn("Failed to parse initial HTML content:", error);
      return undefined;
    }
  }, []); // Only parse on mount

  // Create editor instance
  const editor = useCreateBlockNote({
    initialContent,
    uploadFile: undefined, // Disable file uploads for simplicity
  });

  // Handle content changes
  const handleChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const html = await editor.blocksToHTMLLossy(editor.document);
      onChange(html);
    } catch (error) {
      console.error("Failed to convert blocks to HTML:", error);
    }
  }, [editor, onChange]);

  // Listen for editor changes
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      handleChange();
    });

    return () => {
      // BlockNote doesn't expose unsubscribe directly, but cleanup happens on unmount
    };
  }, [editor, handleChange]);

  // Sync external value changes (if parent updates the value)
  useEffect(() => {
    if (!editor || !value) return;
    
    // Only update if the content actually changed from outside
    const updateContent = async () => {
      const currentHtml = await editor.blocksToHTMLLossy(editor.document);
      if (currentHtml !== value) {
        try {
          const blocks = await editor.tryParseHTMLToBlocks(value);
          editor.replaceBlocks(editor.document, blocks);
        } catch (error) {
          console.warn("Failed to sync external HTML change:", error);
        }
      }
    };

    updateContent();
  }, [value, editor]);

  return (
    <div className="border rounded-md">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="min-h-[120px]"
        formattingToolbar={true}
        linkToolbar={true}
        sideMenu={false}
        slashMenu={false}
        filePanel={false}
        tableHandles={false}
      />
    </div>
  );
}

export default TaskDescriptionEditor;