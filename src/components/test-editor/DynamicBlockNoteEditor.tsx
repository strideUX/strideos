'use client';

import { useEffect, useState } from 'react';
import { Block } from '@blocknote/core';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';

interface DynamicBlockNoteEditorProps {
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  onEditorReady?: (editor: any) => void;
  editable?: boolean;
  className?: string;
}

export function DynamicBlockNoteEditor({
  initialContent,
  onChange,
  onEditorReady,
  editable = true,
  className,
}: DynamicBlockNoteEditorProps) {
  const [isReady, setIsReady] = useState(false);

  const editor = useCreateBlockNote({
    initialContent: initialContent || [
      {
        id: 'default-block',
        type: 'paragraph',
        props: {
          textColor: 'default',
          backgroundColor: 'default',
          textAlignment: 'left',
        },
        content: [],
        children: [],
      },
    ],
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady && !isReady) {
      console.log('📝 BlockNote editor ready');
      onEditorReady(editor);
      setIsReady(true);
    }
  }, [editor, onEditorReady, isReady]);

  // Handle content changes
  useEffect(() => {
    if (!editor || !onChange || !isReady) return;

    const handleChange = () => {
      const content = editor.document;
      onChange(content);
    };

    editor.onChange(handleChange);
  }, [editor, onChange, isReady]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme="light"
      className={className}
    />
  );
}