'use client';

import { useMemo, useEffect } from 'react';
import { Block } from '@blocknote/core';
import { useYDoc, useYjsProvider } from '@y-sweet/react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { Id } from '@/convex/_generated/dataModel';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';
import { extendedSchema } from '@/components/editor/blocks';

interface CollaborativeBlockNoteEditorProps {
  fragmentId: string;
  sectionId: string;
  convexSectionId: Id<'documentSections'>;
  documentId: Id<'documents'>;
  initialContent: Block[];
  onChange: (content: Block[]) => void;
  editable: boolean;
  className?: string;
  user: {
    id: string;
    name: string;
    displayName?: string;
    color: string;
    image?: string;
  };
}

export function CollaborativeBlockNoteEditor(props: CollaborativeBlockNoteEditorProps) {
  const { fragmentId, onChange, user, editable, className, initialContent } = props;
  
  const provider = useYjsProvider();
  const doc = useYDoc();

  // Sanitize initial content
  const sanitizedContent = useMemo(() => {
    if (!Array.isArray(initialContent) || initialContent.length === 0) {
      return [{
        id: "default-block",
        type: "paragraph",
        props: {
          textColor: "default",
          backgroundColor: "default",
          textAlignment: "left"
        },
        content: [],
        children: []
      }];
    }
    return initialContent;
  }, [initialContent]);

  // Create Y.js fragment for this section
  const fragment = useMemo(() => {
    if (!doc) return null;
    try {
      return doc.getXmlFragment(`blocknote-${fragmentId}`);
    } catch (error) {
      console.error('Failed to create Y.js fragment:', error);
      return null;
    }
  }, [doc, fragmentId]);

  // Create editor with native BlockNote collaboration
  const editor = useCreateBlockNote({
    initialContent: sanitizedContent,
    collaboration: fragment && provider ? {
      provider,
      fragment,
      user: {
        name: user.displayName || user.name,
        color: user.color,
      },
    } : undefined,
    schema: extendedSchema,
  });

  // Handle content changes
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      try {
        const content = editor.document;
        if (content && onChange) {
          onChange(content);
        }
      } catch (error) {
        console.error('Error in onChange handler:', error);
      }
    };

    editor.onChange(handleChange);
  }, [editor, onChange]);

  // Safety check before rendering
  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      className={className}
      theme="light"
    />
  );
}


