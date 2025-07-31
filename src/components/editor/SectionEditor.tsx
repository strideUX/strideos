'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlockNoteEditor } from './BlockNoteEditor';
import { SectionContainer, SectionData, checkSectionPermissions } from './SectionContainer';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { toast } from 'sonner';

interface SectionEditorProps {
  section: SectionData;
  userRole: string;
  isActive?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
}

export function SectionEditor({
  section,
  userRole,
  isActive = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  className
}: SectionEditorProps) {
  const [content, setContent] = useState(section.content);
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
    setContent(newContent);
    setSaveStatus('unsaved');
    
    // Debounce save
    const saveTimer = setTimeout(async () => {
      if (permissions.canEdit) {
        try {
          setSaveStatus('saving');
          await updateSectionContent({
            sectionId: section._id,
            content: newContent
          });
          setSaveStatus('saved');
        } catch (error) {
          console.error('Failed to save section content:', error);
          setSaveStatus('error');
          toast.error('Failed to save content');
        }
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(saveTimer);
  }, [section._id, permissions.canEdit, updateSectionContent]);

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
    setContent(section.content);
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
        {/* Section-specific UI components would go here */}
        {/* For now, we'll add placeholders based on section type */}
        {section.type === 'overview' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Project Overview
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This section will contain project stats, metadata, and key information.
            </p>
          </div>
        )}

        {section.type === 'deliverables' && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
              Task Management
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Interactive task management UI will be integrated here.
            </p>
          </div>
        )}

        {section.type === 'timeline' && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
              Timeline & Milestones
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Sprint schedule and timeline visualization will be displayed here.
            </p>
          </div>
        )}

        {section.type === 'team' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-2">
              Team & Stakeholders
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Team member cards and stakeholder management will be shown here.
            </p>
          </div>
        )}

        {section.type === 'feedback' && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
              Client Feedback
            </h3>
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              Feedback management and communication interface will be here.
            </p>
          </div>
        )}

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