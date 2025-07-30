'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Block, BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Custom schema with extensibility for future blocks
const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default blocks
    ...defaultBlockSpecs,
    // Future custom blocks will be added here:
    // tasks: TaskBlock, stakeholders: StakeholdersBlock, etc.
    // This foundation is ready for Enhancement 10.3 and Feature 11
  },
  inlineContentSpecs: {
    // Include all default inline content
    ...defaultInlineContentSpecs,
    // Custom inline content will be added here if needed
  },
  styleSpecs: {
    // Include all default styles
    ...defaultStyleSpecs,
    // Custom styles will be added here if needed
  },
});

interface BlockNoteEditorProps {
  initialContent?: Block[] | null;
  onChange?: (content: Block[]) => void;
  editable?: boolean;
  className?: string;
  isSaving?: boolean;
}

export function BlockNoteEditor({
  initialContent,
  onChange,
  editable = true,
  className = '',
  isSaving = false
}: BlockNoteEditorProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const editor = useCreateBlockNote({
    schema,
    initialContent: initialContent ? initialContent : undefined,
  });

  // Note: We don't update editor content after initialization to avoid infinite loops
  // The initialContent is only used when the editor is first created

  const handleContentChange = () => {
    if (onChange && editor) {
      // Get the current document content as an array of blocks
      const currentContent = editor.document;
      onChange(currentContent);
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
} 