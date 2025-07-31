'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockNoteEditor } from './BlockNoteEditor';
import { SectionContainer, SectionData, checkSectionPermissions } from './SectionContainer';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';
import { Block } from '@blocknote/core';
import '../../styles/blocknote-theme.css';

interface SectionEditorProps {
  section: SectionData;
  userRole: string;
  isActive?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
  onSaveStatusChange?: (sectionId: string, status: 'saving' | 'saved') => void;
}

export function SectionEditor({
  section,
  userRole,
  isActive = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  className,
  onSaveStatusChange
}: SectionEditorProps) {
  const [content, setContent] = useState<Block[]>(() => {
    // Safely convert section.content to Block[] or provide empty array
    return Array.isArray(section.content) ? section.content as Block[] : [];
  });
  const [, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

  // Mutations
  const updateSectionContent = useMutation(api.sections.updateSectionContent);
  // const updateSectionMetadata = useMutation(api.sections.updateSectionMetadata);
  const deleteSection = useMutation(api.sections.deleteSection);

  // Calculate permissions
  const permissions = checkSectionPermissions(section, userRole);

  // Auto-save content changes
  const handleContentChange = useCallback((newContent: unknown) => {
    // Safely convert newContent to Block[] or keep current content
    const safeContent = Array.isArray(newContent) ? newContent as Block[] : content;
    setContent(safeContent);
    setSaveStatus('unsaved');
    
    // Debounce save
    const saveTimer = setTimeout(async () => {
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
        }
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(saveTimer);
  }, [section._id, permissions.canEdit, updateSectionContent, onSaveStatusChange, content]);

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
            className={`${saveStatus === 'saving' ? 'opacity-75' : ''}`}
            isSaving={saveStatus === 'saving'}
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