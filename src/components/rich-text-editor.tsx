"use client";
import React, { useEffect, useCallback, memo, useRef } from "react";
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
    // Explicitly clear BlockNote's default placeholders
    placeholders: { default: "", emptyDocument: "" },
  } as any);
  const lastAppliedRef = useRef<string>("");

  // Apply incoming value when it changes externally
  useEffect(() => {
    const apply = async () => {
      if (!editor) return;
      const incoming = (value ?? "").trim();
      if (incoming === (lastAppliedRef.current ?? "").trim()) return;
      try {
        if (!incoming || incoming === "<p></p>") {
          await editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" } as any]);
        } else {
          const blocks = await editor.tryParseHTMLToBlocks(incoming);
          await editor.replaceBlocks(editor.document, blocks);
        }
        lastAppliedRef.current = incoming;
      } catch (err) {
        console.warn("RichTextEditor: failed to set HTML", err);
      }
    };
    void apply();
  }, [editor, value]);

  // Emit on change
  useEffect(() => {
    if (!editor) return;
    const unsub = editor.onChange(async () => {
      try {
        const html = (await editor.blocksToHTMLLossy(editor.document)).trim();
        lastAppliedRef.current = html;
        onChange(html);
      } catch (err) {
        console.error("RichTextEditor: export failed", err);
      }
    });
    return () => {
      void unsub;
    };
  }, [editor, onChange]);

  // Stop Enter/Space bubbling to parent forms/dialogs AFTER the editor handles them
  // Important: use bubble phase (not capture) so BlockNote receives the event first.
  const stopKeys = useCallback((e: React.KeyboardEvent) => {
    const k = e.key;
    if (k === "Enter" || k === " ") {
      e.stopPropagation();
    }
  }, []);

  if (!editor) {
    return (
      <div className="border rounded-md overflow-hidden relative h-[245px] flex items-center justify-center">
        <div className="text-muted-foreground">Initializing editor...</div>
      </div>
    );
  }

  return (
    <div
      className="border rounded-md overflow-hidden relative h-[245px] rte-container"
      onKeyDown={stopKeys}
      onKeyPress={stopKeys}
      onKeyUp={stopKeys}
    >
      <BlockNoteView
        editor={editor}
        theme="light"
        className="h-full"
        formattingToolbar={false}
        linkToolbar
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
        :global(.bn-formatting-toolbar),
        :global(.bn-formatting-toolbar-wrapper) {
          box-shadow: none !important;
          border-radius: 0 !important;
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
        }
        /* Extra safety: hide any placeholder hints */
        :global(.rte-container .bn-editor .bn-default-placeholder),
        :global(.rte-container .bn-editor .bn-placeholder),
        :global(.rte-container .bn-editor [data-placeholder]),
        :global(.rte-container .bn-editor [data-placeholder]::before),
        :global(.rte-container .bn-editor .bn-default-placeholder::before),
        :global(.rte-container .bn-editor .bn-placeholder::before) {
          display: none !important;
          content: '' !important;
          opacity: 0 !important;
          visibility: hidden !important;
        }
      `}</style>
    </div>
  );
});

export default RichTextEditor;
