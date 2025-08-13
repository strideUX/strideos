'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Block } from '@blocknote/core';
import { usePresence } from './PresenceProvider';
import { Id } from '@/convex/_generated/dataModel';
import { BlockNoteEditor } from './BlockNoteEditor';
import { SectionContainer, SectionData, checkSectionPermissions } from './SectionContainer';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ConvexReactClient } from 'convex/react';
import { convex } from '@/lib/convex';
import { ConvexCollaborationProvider } from '@/lib/collaboration/ConvexCollaborationProvider';

interface SectionEditorProps {
  section: SectionData;
  userRole: string;
  documentId?: Id<'documents'>;
  isActive?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
  onSaveStatusChange?: (sectionId: string, status: 'saving' | 'saved') => void;
  onDelete?: (sectionId: string) => void;
}

export function SectionEditor({
  section,
  userRole,
  documentId,
  isActive = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  className,
  onSaveStatusChange,
  onDelete
}: SectionEditorProps) {
  const isInitializing = useRef(true);
  const [, setIsEditing] = useState(false);
  const [content, setContent] = useState<Block[]>(() => {
    // Safely convert section.content to Block[] or provide empty array
    const sectionContent = Array.isArray(section.content) ? section.content : [];
    
    // HYBRID APPROACH: Convert placeholder paragraphs to custom blocks
    const sanitizedContent = sectionContent.map((block: { type: string; content?: unknown[]; id?: string; children?: unknown[] }) => {
      // Convert placeholder paragraphs to custom blocks
      if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
    const text = block.content.map((c: any) => c.text || '').join('');
        
        // Check if this is a tasks block placeholder  
        if (text.startsWith('[TASKS_BLOCK:') && text.endsWith(']')) {
          const data = text.slice(13, -1);
          
          return {
            id: block.id || Math.random().toString(36).substr(2, 9),
            type: 'simpletest',
            props: {
              text: `Tasks: ${data}`,
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
    
  return sanitizedContent as unknown as Block[];
  });


  // Mutations
  const updateSectionContent = useMutation(api.documentSections.updateDocumentSectionContent);
  // const updateSectionMetadata = useMutation(api.documentSections.updateDocumentSectionMetadata);
  const deleteSection = useMutation(api.documentSections.deleteDocumentSection);

  // Calculate permissions
  const permissions = checkSectionPermissions(section, userRole);

  const { updateCursor, updateStatus } = usePresence();

  // Optimized auto-save hook
  const { scheduleSave, isSaving } = useAutoSave({
    onSave: async (newContent: unknown) => {
      if (permissions.canEdit) {
        try {
          onSaveStatusChange?.(section._id, 'saving');
          await updateSectionContent({
            sectionId: section._id,
            content: newContent
          });
          onSaveStatusChange?.(section._id, 'saved');
        } catch {
          console.error('Failed to save section content');
          toast.error('Failed to save content');
          throw new Error('Failed to save content'); // Re-throw to let the hook handle it
        }
      }
    },
    debounceMs: 3000,
    enabled: permissions.canEdit,
  });

  // Auto-save content changes - OPTIMIZED: Using custom hook
  const handleContentChange = useCallback((newContent: unknown) => {
    // Only update state if content has actually changed
    const safeContent = Array.isArray(newContent) ? newContent as Block[] : content;
    const contentChanged = JSON.stringify(safeContent) !== JSON.stringify(content);
    
    if (contentChanged) {
      setContent(safeContent);
      scheduleSave(newContent);
    }
  }, [content, scheduleSave]);

  // Handle section editing
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Handle section deletion
  const handleDelete = async () => {
    if (!permissions.canDelete || section.required) {
      toast.error('Cannot delete this section');
      return;
    }

    try {
      await deleteSection({ sectionId: section._id });
      toast.success('Section deleted successfully');
      onDelete?.(section._id);
    } catch {
      console.error('Failed to delete section');
      toast.error('Failed to delete section');
    }
  };

  // Sync content when section data changes - but only on initial load or external changes
  useEffect(() => {
    // Only sync if this is the initial load, otherwise we're creating a feedback loop
    if (isInitializing.current) {
      const sectionContent = Array.isArray(section.content) ? section.content : [];
      
      // HYBRID APPROACH: Convert placeholder paragraphs to custom blocks (same as initial state)
      const sanitizedContent = sectionContent.filter((block: { type: string }) => {
        if (block.type === 'tasks') {
          return false; // Remove tasks blocks entirely
        }
        return true;
      }).map((block: { type: string; content?: unknown[]; id?: string; children?: unknown[] }) => {
        // Convert placeholder paragraphs to custom blocks
        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
          const text = block.content.map(c => c.text || '').join('');
          
          // Check if this is a tasks block placeholder  
          if (text.startsWith('[TASKS_BLOCK:') && text.endsWith(']')) {
            const data = text.slice(13, -1);
            try {
              const props = JSON.parse(data);
              return {
                id: block.id || Math.random().toString(36).substr(2, 9),
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
              console.warn('Failed to parse tasks block props:', data);
              // Fallback to default tasks block
              return {
                id: block.id || Math.random().toString(36).substr(2, 9),
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
          
          // Check if this is a project info block placeholder
          if (text.startsWith('[PROJECT_INFO_BLOCK:') && text.endsWith(']')) {
            const data = text.slice(20, -1);
            try {
              const props = JSON.parse(data);
              return {
                id: block.id || Math.random().toString(36).substr(2, 9),
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
              console.warn('Failed to parse project info block props:', data);
              // Fallback to default project info block
              return {
                id: block.id || Math.random().toString(36).substr(2, 9),
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
      
      setContent(sanitizedContent as Block[]);
      isInitializing.current = false;
    }
  }, [section.content]);

  // Collaboration provider per section (placeholder wiring for future BlockNote integration)
  const collaborationProviderRef = useRef<ConvexCollaborationProvider | null>(null);
  useEffect(() => {
    if (documentId) {
      collaborationProviderRef.current = new ConvexCollaborationProvider(
        convex as unknown as ConvexReactClient,
        documentId,
        section._id as Id<'documentSections'>
      );
    }
    return () => { collaborationProviderRef.current = null; };
  }, [documentId, section._id]);

  return (
    <SectionContainer
      section={section}
      permissions={permissions}
      isActive={isActive}
      onEdit={permissions.canEdit ? handleEdit : undefined}
      onDelete={permissions.canDelete && !section.required ? handleDelete : undefined}
      onMoveUp={onMoveUp}
      onMoveDown={onMoveDown}
      canMoveUp={canMoveUp}
      canMoveDown={canMoveDown}
      className={className}
    >
      {/* Section Content Area */}
      <div className="space-y-4">
        

        {/* BlockNote Editor */}
        <div className="min-h-[200px]">
          <BlockNoteEditor
            initialContent={content}
            onChange={(blocks) => {
              handleContentChange(blocks);
              updateStatus('typing');
            }}
            onSelectionChange={(selection) => {
              if (!documentId) return;
              updateCursor({ sectionId: section._id as Id<'documentSections'>, selection });
            }}
            onPointerMove={({ x, y }) => {
              if (!documentId) return;
              updateCursor({ sectionId: section._id as Id<'documentSections'>, selection: undefined, coordinates: { x, y } });
            }}
            editable={permissions.canEdit}
            className={`${isSaving ? 'opacity-75' : ''}`}
            isSaving={isSaving}
            documentId={documentId}
          />
        </div>
      </div>
    </SectionContainer>
  );
}

// Higher-order component for section-specific implementations
export function createSectionEditor(SectionComponent: React.ComponentType<SectionEditorProps>) {
  return function EnhancedSectionEditor(props: SectionEditorProps) {
    return (
      <SectionEditor {...props}>
        <SectionComponent {...props} />
      </SectionEditor>
    );
  };
}