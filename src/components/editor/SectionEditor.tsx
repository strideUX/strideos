'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  const isInitializing = useRef(true);
  const [content, setContent] = useState<Block[]>(() => {
    // Safely convert section.content to Block[] or provide empty array
    const sectionContent = Array.isArray(section.content) ? section.content : [];
    
    // HYBRID APPROACH: Convert placeholder paragraphs to custom blocks
    const sanitizedContent = sectionContent.map((block: any) => {
      // Convert placeholder paragraphs to custom blocks
      if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
        const text = block.content.map(c => c.text || '').join('');
        
        // Check if this is a test block placeholder
        if (text.startsWith('[TEST_BLOCK:') && text.endsWith(']')) {
          console.log('SectionEditor: Converting test block placeholder to custom block on init:', text);
          const data = text.slice(12, -1);
          
          return {
            id: block.id || Math.random().toString(36).substr(2, 9),
            type: 'simpletest',
            props: {
              text: data || 'Test Block',
            },
            content: undefined,
            children: [],
          };
        }
        
        // Check if this is a tasks block placeholder  
        if (text.startsWith('[TASKS_BLOCK:') && text.endsWith(']')) {
          console.log('SectionEditor: Converting tasks block placeholder to custom block on init:', text);
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
    
    return sanitizedContent as Block[];
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

  // Sync content when section data changes - but only on initial load or external changes
  useEffect(() => {
    // Only sync if this is the initial load, otherwise we're creating a feedback loop
    if (isInitializing.current) {
      console.log('SectionEditor: Processing section content on initial load:', section.content);
      const sectionContent = Array.isArray(section.content) ? section.content : [];
      
      // HYBRID APPROACH: Convert placeholder paragraphs to custom blocks (same as initial state)
      const sanitizedContent = sectionContent.filter((block: any) => {
        if (block.type === 'tasks') {
          console.log('SectionEditor: REMOVING tasks block completely on sync:', block);
          return false; // Remove tasks blocks entirely
        }
        return true;
      }).map((block: any) => {
        // Convert placeholder paragraphs to custom blocks
        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
          const text = block.content.map(c => c.text || '').join('');
          
          // Check if this is a test block placeholder
          if (text.startsWith('[TEST_BLOCK:') && text.endsWith(']')) {
            console.log('SectionEditor: Converting test block placeholder to custom block on sync:', text);
            const data = text.slice(12, -1);
            
            return {
              id: block.id || Math.random().toString(36).substr(2, 9),
              type: 'simpletest',
              props: {
                text: data || 'Test Block',
              },
              content: undefined,
              children: [],
            };
          }
          
          // Check if this is a tasks block placeholder  
          if (text.startsWith('[TASKS_BLOCK:') && text.endsWith(']')) {
            console.log('SectionEditor: Converting tasks block placeholder to custom block on sync:', text);
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
      
      console.log('SectionEditor: Sanitized content after conversion:', sanitizedContent);
      setContent(sanitizedContent as Block[]);
      isInitializing.current = false;
    } else {
      console.log('SectionEditor: Skipping useEffect conversion - not initializing');
    }
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
          {/* Debug info */}
          <div style={{fontSize: '10px', color: '#999', marginTop: '10px', fontFamily: 'monospace'}}>
            Debug - Content length: {content?.length || 0}, Content: {JSON.stringify(content?.slice(0, 2), null, 2)}
          </div>
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