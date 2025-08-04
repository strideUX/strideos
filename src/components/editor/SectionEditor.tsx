'use client';

import { useState, useCallback, useEffect } from 'react';
import { Block } from '@blocknote/core';
import { BlockNoteEditor } from './BlockNoteEditor';
import { SectionContainer, SectionData, checkSectionPermissions } from './SectionContainer';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';

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
  const [content, setContent] = useState<Block[]>(() => {
    // Safely convert section.content to Block[] or provide empty array
    return Array.isArray(section.content) ? section.content as Block[] : [];
  });
  const [, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // Mutations
  const updateSectionContent = useMutation(api.documentSections.updateDocumentSectionContent);
  // const updateSectionMetadata = useMutation(api.documentSections.updateDocumentSectionMetadata);
  const deleteSection = useMutation(api.documentSections.deleteDocumentSection);

  // Calculate permissions
  const permissions = checkSectionPermissions(section, userRole);

  // Optimized auto-save hook
  const { scheduleSave, isSaving } = useAutoSave({
    onSave: async (newContent: any) => {
      if (permissions.canEdit) {
        try {
          setSaveStatus('saving');
          onSaveStatusChange?.(section._id, 'saving');
          await updateSectionContent({
            sectionId: section._id,
            content: newContent
          });
          setSaveStatus('saved');
          onSaveStatusChange?.(section._id, 'saved');
        } catch (error) {
          console.error('Failed to save section content:', error);
          setSaveStatus('error');
          toast.error('Failed to save content');
          throw error; // Re-throw to let the hook handle it
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
      setSaveStatus('unsaved');
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
    } catch (error) {
      console.error('Failed to delete section:', error);
      toast.error('Failed to delete section');
    }
  };

  // Sync content when section data changes
  useEffect(() => {
    const safeContent = Array.isArray(section.content) ? section.content as Block[] : [];
    setContent(safeContent);
  }, [section.content]);

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
            onChange={handleContentChange}
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