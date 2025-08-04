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

interface BlockNoteEditorProps {
  initialContent?: Block[] | null;
  onChange?: (content: Block[]) => void;
  editable?: boolean;
  className?: string;
  isSaving?: boolean;
  schema?: BlockNoteSchema<any, any, any>;
  documentId?: Id<'documents'>;
  document?: any;
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
  const [processedContent, setProcessedContent] = useState<any[] | undefined>(undefined);
  const [isContentReady, setIsContentReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use document prop if provided, otherwise query for it
  const queriedDocument = useQuery(
    api.documents.getDocument, 
    (!document && documentId) ? { documentId: documentId as Id<'documents'> } : 'skip'
  );
  const documentData = document || queriedDocument;

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Convert placeholder paragraphs to custom blocks
  const sanitizeContent = (content: any[]) => {
    if (!Array.isArray(content)) return undefined;
    
    return content.map(block => {
      if (!block.id) {
        block.id = Math.random().toString(36).substr(2, 9);
      }
      
      // Convert placeholder paragraphs to custom blocks
      if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
        const text = block.content.map(c => c.text || '').join('');
        
        if (text.startsWith('[TEST_BLOCK:') && text.endsWith(']')) {
          const data = text.slice(12, -1);
          return {
            id: block.id,
            type: 'simpletest',
            props: {
              text: data || 'Test Block',
            },
            content: undefined,
            children: [],
          };
        }
      }
      
      return {
        ...block,
        children: Array.isArray(block.children) ? block.children : [],
      };
    });
  };

  // Process content when it changes
  useEffect(() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      const sanitized = sanitizeContent(initialContent);
      setProcessedContent(sanitized);
      setIsContentReady(true);
    } else {
      setProcessedContent(undefined);
      setIsContentReady(true);
    }
  }, [initialContent]);

  // Simple editor creation following BlockNote examples - ALWAYS call hook, but with conditional config
  const validSchema = schema && typeof schema === 'object' ? schema : extendedSchema;
  
  const editor = useCreateBlockNote({
    schema: validSchema,
    initialContent: processedContent, // Always use processedContent, even if undefined
    sideMenu: {
      dragHandleMenu: true,
      addBlockMenu: true,
    },
    formattingToolbar: true,
    linkToolbar: true,
    slashMenu: true,
    emojiPicker: true,
    filePanel: true,
    tableHandles: true,
  });

  // Update editor content when processedContent changes - ONLY on initial load
  useEffect(() => {
    if (editor && processedContent && isContentReady && !hasInitialized) {
      // Use setTimeout to defer the update and avoid flushSync warning
      setTimeout(() => {
        editor.replaceBlocks(editor.document, processedContent);
        setHasInitialized(true);
      }, 0);
    }
  }, [editor, processedContent, isContentReady, hasInitialized]);

  // Convert custom blocks back to placeholder paragraphs for saving
  const convertBlocksForSaving = (blocks: Block[]) => {
    return blocks.map(block => {
      if (block.type === 'simpletest') {
        return {
          id: block.id,
          type: 'paragraph',
          props: {
            textAlignment: 'left',
            textColor: 'default',
            backgroundColor: 'default',
          },
          content: [{
            type: 'text',
            text: `[TEST_BLOCK:${block.props?.text || 'Test Block'}]`,
            styles: {}
          }],
          children: [],
        };
      }
      
      return block;
    });
  };

  // Show loading state while client-side is initializing or content not ready
  if (!isClient || !isContentReady) {
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  try {
    return (
      <div>
        <BlockNoteView
          editor={editor}
          onChange={onChange ? () => {
            if (onChange) {
              const currentContent = editor.document;
              const placeholderContent = convertBlocksForSaving(currentContent);
              onChange(placeholderContent);
            }
          } : undefined}
          editable={editable}
          className={`h-full bn-editor ${isSaving ? 'bn-editor-loading' : ''} ${className}`}
          theme="light"
          slashMenu={false} // Disable default slash menu to use custom one
        >
        {/* Custom slash menu */}
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => {
            const defaultItems = getDefaultReactSlashMenuItems(editor);
            const filteredDefaultItems = defaultItems.filter(item => item.title !== "Check List");
            
            const allItems = [...filteredDefaultItems, {
              key: "simpletest",
              title: "Test Block",
              onItemClick: () => {
                try {
                  const newBlock = {
                    type: "simpletest",
                    props: {
                      text: "New Test Block",
                    },
                  };
                  
                  editor.insertBlocks([newBlock], editor.getTextCursorPosition().block, "after");
                } catch (error) {
                  console.error('Error inserting test block:', error);
                }
              },
              subtext: "Insert a simple test block",
              badge: "Test",
              aliases: ["test", "simple"],
              group: "Custom",
              icon: <CheckCircle size={18} />,
            }];
            
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
      </div>
    );
  } catch (error) {
    console.error('BlockNoteEditor render error:', error);
    return (
      <div className={`flex items-center justify-center h-32 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 mb-2">Editor Error</div>
          <div className="text-sm text-gray-600">Failed to load editor content</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
});