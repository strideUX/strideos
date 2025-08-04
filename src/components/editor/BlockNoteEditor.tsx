'use client';

import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { Block, BlockNoteSchema } from '@blocknote/core';
import { useState, useEffect, memo } from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';
import { extendedSchema } from './blocks';
import { TasksBlock } from './blocks/TasksBlock';

interface BlockNoteEditorProps {
  initialContent?: Block[] | null; // Can be null/undefined - BlockNote will use defaults
  onChange?: (content: Block[]) => void;
  editable?: boolean;
  className?: string;
  isSaving?: boolean;
  schema?: BlockNoteSchema<any, any, any>; // Accept custom schema, falls back to default
  documentId?: Id<'documents'>; // Document ID for context-aware blocks
  document?: any; // Document data to avoid duplicate queries
}

export const BlockNoteEditor = memo(function BlockNoteEditor({
  initialContent,
  onChange,
  editable = true,
  className = '',
  isSaving = false,
  schema,
  documentId,
  document
}: BlockNoteEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [lastContent, setLastContent] = useState<Block[] | null>(null);
  
  // Use document prop if provided, otherwise query for it
  const queriedDocument = useQuery(
    api.documents.getDocument, 
    (!document && documentId) ? { documentId: documentId as Id<'documents'> } : 'skip'
  );
  const documentData = document || queriedDocument;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Ensure we have a valid schema - use extended schema by default
  const validSchema = schema && typeof schema === 'object' ? schema : extendedSchema;
  
  // Create editor config - only include initialContent if we have valid blocks
  const editorConfig: {
    schema: BlockNoteSchema<any, any, any>;
    sideMenu: { dragHandleMenu: boolean; addBlockMenu: boolean };
    formattingToolbar: boolean;
    linkToolbar: boolean;
    slashMenu: boolean;
    emojiPicker: boolean;
    filePanel: boolean;
    tableHandles: boolean;
    initialContent?: Block[];
  } = {
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

  // Always call the hook, but it will be safe on server side
  const editor = useCreateBlockNote(editorConfig);

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

  // Show loading state while client-side is initializing
  if (!isClient || !editor) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
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
      slashMenu={false} // Disable default slash menu to use custom one
    >
      {/* Custom slash menu with shadcn styling */}
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          // Get all default slash menu items with proper icons and styling
          const defaultItems = getDefaultReactSlashMenuItems(editor);
          
          // Remove "Check List" as requested
          const filteredDefaultItems = defaultItems.filter(item => item.title !== "Check List");
          
          // Combine filtered default items with our custom tasks item (only if document has a project)
          const allItems = (documentData && documentData.projectId) 
            ? [...filteredDefaultItems, {
                key: "tasks",
                title: "Tasks",
                onItemClick: () => {
                  editor.insertBlocks(
                    [
                      {
                        type: "tasks",
                        props: {
                          taskIds: "[]",
                          projectId: documentData.projectId,
                          title: "Tasks",
                          showCompleted: "true",
                        },
                      },
                    ],
                    editor.getTextCursorPosition().block,
                    "after"
                  );
                },
                subtext: "Insert a tasks management block",
                badge: "Custom",
                aliases: ["task", "todo", "project"],
                group: "Custom",
                icon: <CheckCircle size={18} />,
              }]
            : filteredDefaultItems;
          
          // Filter items based on query
          if (!query) return allItems;
          
          const queryLower = query.toLowerCase();
          return allItems.filter((item) => {
            const titleMatch = item.title.toLowerCase().includes(queryLower);
            const aliasMatch = item.aliases?.some((alias) =>
              alias.toLowerCase().includes(queryLower)
            );
            return titleMatch || aliasMatch;
          });
        }}
      />
    </BlockNoteView>
  );
});