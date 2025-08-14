'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Block } from '@blocknote/core';
import { Id } from '@/convex/_generated/dataModel';
import { BlockNoteEditor } from './BlockNoteEditor';
import { SectionContainer, SectionData, checkSectionPermissions } from './SectionContainer';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

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
  // Memoized dynamic import like the working test page
  const CollaborativeBlockNoteEditor = useMemo(
    () =>
      dynamic(() => import('@/components/collaboration/CollaborativeBlockNoteEditor').then(m => m.CollaborativeBlockNoteEditor), {
        ssr: false,
        loading: () => (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
            Loading collaborative editor...
          </div>
        ),
      }),
    []
  );

  const isInitializing = useRef(true);
  const [, setIsEditing] = useState(false);
  const [content, setContent] = useState<Block[]>(() => {
    const sectionContent = Array.isArray(section.content) ? section.content : [];
    const sanitized = sectionContent.map((block: any) => ({
      ...block,
      children: Array.isArray(block?.children) ? block.children : [],
    }));
    return sanitized as unknown as Block[];
  });


  // Mutations
  const updateSectionContent = useMutation(api.documentSections.updateDocumentSectionContent);
  // const updateSectionMetadata = useMutation(api.documentSections.updateDocumentSectionMetadata);
  const deleteSection = useMutation(api.documentSections.deleteDocumentSection);

  // Calculate permissions
  const permissions = checkSectionPermissions(section, userRole);

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
    const safeContent = Array.isArray(newContent) ? (newContent as Block[]) : content;
    const contentChanged = JSON.stringify(safeContent) !== JSON.stringify(content);
    if (contentChanged) {
      setContent(safeContent);
      scheduleSave(safeContent);
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
    if (isInitializing.current) {
      const sectionContent = Array.isArray(section.content) ? section.content : [];
      const sanitized = sectionContent.map((block: any) => ({
        ...block,
        children: Array.isArray(block?.children) ? block.children : [],
      }));
      setContent(sanitized as Block[]);
      isInitializing.current = false;
    }
  }, [section.content]);

  const currentUser = useQuery(api.users.getCurrentUser);

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
        <div className="min-h-[200px]">
          {currentUser ? (
            <CollaborativeBlockNoteEditor
              docId={`doc-${documentId}-${section._id}`}
              sectionId={section._id}
              convexSectionId={section._id}
              documentId={documentId!}
              initialContent={content}
              onChange={(newStandardBlocks: Block[]) => {
                // Merge new standard blocks with existing custom blocks to keep full content
                const standardTypes = ['paragraph', 'heading', 'bulletListItem', 'numberedListItem', 'checkListItem', 'table', 'image', 'video', 'audio', 'file', 'codeBlock'];
                const prev = Array.isArray(content) ? content : [];
                let s = 0;
                const merged = prev.map((blk: any) => {
                  if (standardTypes.includes(blk.type)) {
                    const next = newStandardBlocks[s];
                    s += 1;
                    return next ?? blk;
                  }
                  return blk;
                });
                // Append any additional new standard blocks (e.g., inserted ones)
                for (; s < newStandardBlocks.length; s += 1) merged.push(newStandardBlocks[s]);
                setContent(merged);
                handleContentChange(merged);
              }}
              editable={permissions.canEdit}
              className={`${isSaving ? 'opacity-75' : ''}`}
              user={{
                id: (currentUser as any)._id,
                name: (currentUser as any).name || 'Anonymous',
                displayName: (currentUser as any).displayName,
                color: (currentUser as any).displayColor || '#6B7280',
                image: (currentUser as any).image,
              }}
            />
          ) : (
            <BlockNoteEditor
              initialContent={content}
              onChange={handleContentChange}
              editable={permissions.canEdit}
              className={`${isSaving ? 'opacity-75' : ''}`}
              isSaving={isSaving}
              documentId={documentId}
            />
          )}
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