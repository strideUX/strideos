"use client";

import { useEffect, useMemo, useCallback } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote, FormattingToolbar } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";

interface TaskDescriptionEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export function TaskDescriptionEditor({ value, onChange }: TaskDescriptionEditorProps) {
  // Create editor instance without initial content
  const editor = useCreateBlockNote({
    uploadFile: undefined, // Disable file uploads for simplicity
  });

  // Parse and set HTML content after editor is created
  useEffect(() => {
    if (!editor || !value || value === "<p></p>" || value === "") return;
    
    // Convert HTML to blocks using the editor's parser
    const parseAndSetContent = async () => {
      try {
        const blocks = await editor.tryParseHTMLToBlocks(value);
        editor.replaceBlocks(editor.document, blocks);
      } catch (error) {
        console.warn("Failed to parse HTML content:", error);
      }
    };
    
    parseAndSetContent();
  }, [editor]); // Only run once when editor is ready

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
      try {
        const currentHtml = await editor.blocksToHTMLLossy(editor.document);
        // Only update if HTML is different and not just formatting differences
        if (currentHtml.trim() !== value.trim()) {
          const blocks = await editor.tryParseHTMLToBlocks(value);
          editor.replaceBlocks(editor.document, blocks);
        }
      } catch (error) {
        console.warn("Failed to sync external HTML change:", error);
      }
    };

    updateContent();
  }, [value, editor]);

  return (
    <div className="border rounded-md overflow-hidden relative h-[245px]">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="h-full"
        formattingToolbar={false} // Disable floating toolbar
        linkToolbar={true}
        sideMenu={false}
        slashMenu={false}
        filePanel={false}
        tableHandles={false}
      >
        {/* Absolutely positioned toolbar at the very top */}
        <div className="absolute top-0 left-0 right-0 border-b bg-background px-0 py-0 z-10">
          <FormattingToolbar />
        </div>
      </BlockNoteView>
      
      {/* Custom CSS to override BlockNote's internal styles */}
      <style jsx>{`
        :global(.bn-container) {
          padding: 55px 15px 15px !important;
          height: 100% !important;
          overflow-y: auto !important;
        }
        
        /* Remove shadow and border radius from formatting toolbar */
        :global(.bn-formatting-toolbar) {
          box-shadow: none !important;
          border-radius: 0 !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        
        /* Also target any toolbar wrapper that might have styling */
        :global(.bn-formatting-toolbar-wrapper) {
          box-shadow: none !important;
          border-radius: 0 !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
      `}</style>
    </div>
  );
}

export default TaskDescriptionEditor;