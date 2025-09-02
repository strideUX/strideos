"use client";
import React, { useEffect, useMemo, useCallback, memo } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/shadcn";
import { useCreateBlockNote, FormattingToolbar } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const RichTextEditor = memo(function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useCreateBlockNote({
    uploadFile: undefined,
  });

  const shouldParseContent = useMemo(() => {
    return !!(editor && value && value !== "<p></p>" && value !== "");
  }, [editor, value]);

  const shouldUpdateContent = useMemo(() => {
    return !!(editor && value);
  }, [editor, value]);

  const isEmptyContent = useMemo(() => {
    return !value || value === "<p></p>" || value === "";
  }, [value]);

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
      if (currentHtml.trim() !== value.trim()) {
        const blocks = await editor.tryParseHTMLToBlocks(value);
        editor.replaceBlocks(editor.document, blocks);
      }
    } catch (error) {
      console.warn("Failed to sync external HTML change:", error);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!shouldParseContent) return;
    parseAndSetContent();
  }, [shouldParseContent, parseAndSetContent]);

  useEffect(() => {
    if (!editor) return;
    const unsubscribe = editor.onChange(() => {
      handleChange();
    });
    return () => {
      // BlockNote handles cleanup internally
    };
  }, [editor, handleChange]);

  useEffect(() => {
    if (!shouldUpdateContent) return;
    updateContent();
  }, [shouldUpdateContent, updateContent]);

  if (!editor) {
    return (
      <div className="border rounded-md overflow-hidden relative h-[245px] flex items-center justify-center">
        <div className="text-muted-foreground">Initializing editor...</div>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden relative h-[245px]">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="h-full"
        formattingToolbar={false}
        linkToolbar={true}
        sideMenu={false}
        slashMenu={false}
        filePanel={false}
        tableHandles={false}
      >
        <div className="absolute top-0 left-0 right-0 border-b bg-background px-0 py-0 z-10">
          <FormattingToolbar />
        </div>
      </BlockNoteView>

      <style jsx>{`
        :global(.bn-container) {
          padding: 55px 15px 15px !important;
          height: 100% !important;
          overflow-y: auto !important;
        }
        :global(.bn-formatting-toolbar) {
          box-shadow: none !important;
          border-radius: 0 !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
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

export default RichTextEditor;


