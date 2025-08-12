'use client';

import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { Block } from '@blocknote/core';
import { useState, useEffect, memo } from 'react';
import { Loader2, CheckCircle, Building2 } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import '@blocknote/shadcn/style.css';
import '@/styles/blocknote-theme.css';
import { extendedSchema } from './blocks';
import { Doc } from '@/convex/_generated/dataModel';

interface BlockNoteEditorProps {
  initialContent?: Block[] | null;
  onChange?: (content: Block[]) => void;
  editable?: boolean;
  className?: string;
  isSaving?: boolean;
  schema?: typeof extendedSchema;
  documentId?: Id<'documents'>;
  document?: Doc<'documents'>;
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
  const [processedContent, setProcessedContent] = useState<Block[] | undefined>(undefined);
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
  const sanitizeContent = (content: Block[]) => {
    if (!Array.isArray(content)) return undefined;
    
    return content.map(block => {
      if (!block.id) {
        block.id = Math.random().toString(36).substr(2, 9);
      }
      
      // Convert placeholder paragraphs to custom blocks
      if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
        const text = block.content
          .map((c: unknown) =>
            typeof c === 'object' && c !== null && 'text' in (c as Record<string, unknown>)
              ? ((c as { text?: string }).text ?? '')
              : ''
          )
          .join('');
        
        if (text.startsWith('[TASKS_BLOCK:') && text.endsWith(']')) {
          const data = text.slice(13, -1);
          try {
            const props = JSON.parse(data);
            return {
              id: block.id,
              type: 'tasks',
              props: {
                textAlignment: 'left',
                textColor: 'default',
                backgroundColor: 'default',
                ...props,
              },
              content: undefined,
              children: [],
            };
          } catch {
            // Fallback to default tasks block
            return {
              id: block.id,
              type: 'tasks',
              props: {
                textAlignment: 'left',
                textColor: 'default',
                backgroundColor: 'default',
                taskIds: '[]',
                projectId: '',
                title: 'Tasks',
                showCompleted: 'true',
              },
              content: undefined,
              children: [],
            };
          }
        }
        
        if (text.startsWith('[PROJECT_INFO_BLOCK:') && text.endsWith(']')) {
          const data = text.slice(20, -1);
          try {
            const props = JSON.parse(data);
            return {
              id: block.id,
              type: 'projectInfo',
              props: {
                textAlignment: 'left',
                textColor: 'default',
                backgroundColor: 'default',
                ...props,
              },
              content: undefined,
              children: [],
            };
          } catch {
            // Fallback to default project info block
            return {
              id: block.id,
              type: 'projectInfo',
              props: {
                textAlignment: 'left',
                textColor: 'default',
                backgroundColor: 'default',
                projectId: '',
                title: 'Project Info',
                showRequestedBy: 'true',
                showPriority: 'true',
                showDueDate: 'true',
                showStatus: 'true',
                showProjectManager: 'true',
                showClient: 'true',
              },
              content: undefined,
              children: [],
            };
          }
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
    initialContent: processedContent,
  });

  // Update editor content when processedContent changes - ONLY on initial load
  useEffect(() => {
    if (editor && processedContent && isContentReady && !hasInitialized) {
      // Use setTimeout to defer the update and avoid flushSync warning
      setTimeout(() => {
        // Double-check editor still exists when timeout executes
        if (editor && editor.document !== undefined) {
          editor.replaceBlocks(editor.document, processedContent);
          setHasInitialized(true);
        }
      }, 0);
    }
  }, [editor, processedContent, isContentReady, hasInitialized]);

  // Convert custom blocks back to placeholder paragraphs for saving
  const convertBlocksForSaving = (blocks: Block[]) => {
    return blocks.map(block => {
      if ((block as any).type === 'tasks') {
        // Extract only custom props (not standard BlockNote props)
        const rawProps: Record<string, unknown> =
          (typeof (block as unknown) === 'object' && (block as { props?: Record<string, unknown> }).props) || {};
        const propsClone: Record<string, unknown> = { ...rawProps };
        delete (propsClone as { textAlignment?: unknown }).textAlignment;
        delete (propsClone as { textColor?: unknown }).textColor;
        delete (propsClone as { backgroundColor?: unknown }).backgroundColor;
        const customProps = propsClone;
        
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
            text: `[TASKS_BLOCK:${JSON.stringify(customProps)}]`,
            styles: {}
          }],
          children: [],
        };
      }
      
      if ((block as any).type === 'projectInfo') {
        // Extract only custom props (not standard BlockNote props)
        const rawProps: Record<string, unknown> =
          (typeof (block as unknown) === 'object' && (block as { props?: Record<string, unknown> }).props) || {};
        const propsClone: Record<string, unknown> = { ...rawProps };
        delete (propsClone as { textAlignment?: unknown }).textAlignment;
        delete (propsClone as { textColor?: unknown }).textColor;
        delete (propsClone as { backgroundColor?: unknown }).backgroundColor;
        const customProps = propsClone;
        
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
            text: `[PROJECT_INFO_BLOCK:${JSON.stringify(customProps)}]`,
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
              key: "tasks",
              title: "Tasks Block",
              onItemClick: () => {
                try {
                   const newBlock: any = {
                    type: "tasks",
                    props: {
                      taskIds: "[]",
                      projectId: documentData?.projectId || "",
                      title: "Tasks",
                      showCompleted: "true",
                    },
                  };
                  
                  editor.insertBlocks([newBlock], editor.getTextCursorPosition().block, "after");
                } catch {
                  // Handle error silently - tasks block insertion failed
                }
              },
              subtext: "Insert a tasks management block",
              badge: "Tasks",
              aliases: ["tasks", "todo", "checklist"],
              group: "Custom",
              icon: <CheckCircle size={18} />,
            }, {
              key: "projectInfo",
              title: "Project Info Block",
              onItemClick: () => {
                try {
                   const newBlock: any = {
                    type: "projectInfo",
                    props: {
                      projectId: documentData?.projectId || "",
                      title: "Project Info",
                      showRequestedBy: "true",
                      showPriority: "true",
                      showDueDate: "true",
                      showStatus: "true",
                      showProjectManager: "true",
                      showClient: "true",
                    },
                  };
                  
                  editor.insertBlocks([newBlock], editor.getTextCursorPosition().block, "after");
                } catch {
                  // Handle error silently - project info block insertion failed
                }
              },
              subtext: "Insert a project information display block",
              badge: "Project",
              aliases: ["project", "info", "details", "summary"],
              group: "Custom",
              icon: <Building2 size={18} />,
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
  } catch {
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