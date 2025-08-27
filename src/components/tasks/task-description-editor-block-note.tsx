/**
 * TaskDescriptionEditor - Rich text editor component for task descriptions using BlockNote
 *
 * @remarks
 * Provides a rich text editing experience for task descriptions with HTML output.
 * Integrates BlockNote editor with custom formatting toolbar and content synchronization.
 * Supports external value updates and maintains editor state consistency.
 * Features a fixed formatting toolbar and optimized content parsing for performance.
 *
 * @example
 * ```tsx
 * <TaskDescriptionEditor
 *   value={taskDescription}
 *   onChange={setTaskDescription}
 * />
 * ```
 */

// 1. External imports
import React, { useEffect, useMemo, useCallback, memo } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote, FormattingToolbar } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";

// 2. Internal imports
// (No internal imports needed)

// 3. Types
interface TaskDescriptionEditorProps {
  /** Current HTML content value */
  value: string;
  /** Callback for content changes */
  onChange: (html: string) => void;
}

// 4. Component definition
export const TaskDescriptionEditor = memo(function TaskDescriptionEditor({ 
  value, 
  onChange 
}: TaskDescriptionEditorProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // Create editor instance without initial content
  const editor = useCreateBlockNote({
    uploadFile: undefined, // Disable file uploads for simplicity
  });

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const shouldParseContent = useMemo(() => {
    return !!(editor && value && value !== "<p></p>" && value !== "");
  }, [editor, value]);

  const shouldUpdateContent = useMemo(() => {
    return !!(editor && value);
  }, [editor, value]);

  const isEmptyContent = useMemo(() => {
    return !value || value === "<p></p>" || value === "";
  }, [value]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const parseAndSetContent = useCallback(async () => {
    if (!editor || isEmptyContent) return;
    
    try {
      const blocks = await editor.tryParseHTMLToBlocks(value);
      editor.replaceBlocks(editor.document, blocks);
    } catch (error) {
      console.warn("Failed to parse HTML content:", error);
    }
  }, [editor, value, isEmptyContent]);

  const handleChange = useCallback(async () => {
    if (!editor) return;
    
    try {
      const html = await editor.blocksToHTMLLossy(editor.document);
      onChange(html);
    } catch (error) {
      console.error("Failed to convert blocks to HTML:", error);
    }
  }, [editor, onChange]);

  const updateContent = useCallback(async () => {
    if (!editor || !value) return;
    
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
  }, [value, editor]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // Parse and set HTML content after editor is created
  useEffect(() => {
    if (!shouldParseContent) return;
    parseAndSetContent();
  }, [shouldParseContent, parseAndSetContent]);

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
    if (!shouldUpdateContent) return;
    updateContent();
  }, [shouldUpdateContent, updateContent]);

  // === 6. EARLY RETURNS (loading, error states) ===
  if (!editor) {
    return (
      <div className="border rounded-md overflow-hidden relative h-[245px] flex items-center justify-center">
        <div className="text-muted-foreground">Initializing editor...</div>
      </div>
    );
  }

  // === 7. RENDER (JSX) ===
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
});

export default TaskDescriptionEditor;