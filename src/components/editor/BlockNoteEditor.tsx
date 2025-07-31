'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { Block, BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { useState, useEffect, memo } from 'react';
import { Loader2 } from 'lucide-react';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';

// Default schema for backward compatibility - simplified approach
const defaultSchema = BlockNoteSchema.create();

interface BlockNoteEditorProps {
  initialContent?: Block[] | null; // Can be null/undefined - BlockNote will use defaults
  onChange?: (content: Block[]) => void;
  editable?: boolean;
  className?: string;
  isSaving?: boolean;
  schema?: BlockNoteSchema<any, any, any>; // Accept custom schema, falls back to default
}

export const BlockNoteEditor = memo(function BlockNoteEditor({
  initialContent,
  onChange,
  editable = true,
  className = '',
  isSaving = false,
  schema
}: BlockNoteEditorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ensure we have a valid schema
  const validSchema = schema && typeof schema === 'object' ? schema : defaultSchema;
  
  // Create editor config - only include initialContent if we have valid blocks
  const editorConfig: any = {
    schema: validSchema,
    // Enable side menu features explicitly
    sideMenu: {
      dragHandleMenu: true,
      addBlockMenu: true,
    },
    // Enable other UI components
    formattingToolbar: true,
    linkToolbar: true,
    slashMenu: true,
    emojiPicker: true,
    filePanel: true,
    tableHandles: true,
  };
  
  // Only add initialContent if we have a valid non-empty array
  // Otherwise, let BlockNote use its internal defaults (avoids undefined errors)
  if (Array.isArray(initialContent) && initialContent.length > 0) {
    editorConfig.initialContent = initialContent;
  }
  
  const editor = useCreateBlockNote(editorConfig);

  // Note: We don't update editor content after initialization to avoid infinite loops
  // The initialContent is only used when the editor is first created

  // Track last content to prevent unnecessary onChange calls
  const [lastContent, setLastContent] = useState<Block[] | null>(null);

  const handleContentChange = () => {
    if (onChange && editor) {
      // Get the current document content as an array of blocks
      const currentContent = editor.document;
      
      // Only trigger onChange if content has actually changed
      const contentChanged = JSON.stringify(currentContent) !== JSON.stringify(lastContent);
      
      if (contentChanged) {
        setLastContent(currentContent);
        onChange(currentContent);
      }
    }
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Initializing editor...</p>
        </div>
      </div>
    );
  }

  return (
    <BlockNoteView
      editor={editor}
      onChange={handleContentChange}
      editable={editable}
      className={`h-full bn-editor ${isSaving ? 'bn-editor-loading' : ''} ${className}`}
      theme="light"
    />
  );
}); 