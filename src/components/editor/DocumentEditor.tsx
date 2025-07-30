'use client';

import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { Block, BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, defaultStyleSpecs } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Edit3, 
  FileText, 
  Calendar,
  Users,
  Settings
} from 'lucide-react';

// Custom schema with extensibility for future blocks
const schema = BlockNoteSchema.create({
  blockSpecs: {
    // Include all default blocks
    ...defaultBlockSpecs,
    // Future custom blocks will be added here:
    // tasks: TaskBlock, stakeholders: StakeholdersBlock, etc.
    // This foundation is ready for Enhancement 10.3 and Feature 11
  },
  inlineContentSpecs: {
    // Include all default inline content
    ...defaultInlineContentSpecs,
    // Custom inline content will be added here if needed
  },
  styleSpecs: {
    // Include all default styles
    ...defaultStyleSpecs,
    // Custom styles will be added here if needed
  },
});

interface DocumentEditorProps {
  documentId?: Id<'documents'>;
  clientId: Id<'clients'>;
  departmentId: Id<'departments'>;
  onSave?: (documentId: Id<'documents'>) => void;
  readOnly?: boolean;
  className?: string;
}

export function DocumentEditor({
  documentId,
  clientId,
  departmentId,
  onSave,
  readOnly = false,
  className = ''
}: DocumentEditorProps) {
  // Document state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Block[] | null>(null);
  const [isEditing, setIsEditing] = useState(!documentId);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Create BlockNote editor instance with custom schema
  const editor = useCreateBlockNote({
    schema,
    initialContent: content ? content : undefined,
  });

  // Convex hooks
  const document = useQuery(api.documents.getDocument, 
    documentId ? { documentId } : 'skip'
  );
  const createDocument = useMutation(api.documents.createDocument);
  const updateDocument = useMutation(api.documents.updateDocument);

  // Load document data when available
  useEffect(() => {
    if (document) {
      setTitle(document.title);
      if (document.content) {
        setContent(document.content);
        // Replace the editor content when document loads
        editor.replaceBlocks(editor.document, document.content);
      }
      setIsEditing(false);
    }
  }, [document, editor]);

  // Handle content changes
  const handleContentChange = useCallback(() => {
    if (readOnly) return;
    const newContent = editor.document;
    setContent(newContent);
    if (!isEditing) setIsEditing(true);
  }, [editor, readOnly, isEditing]);

  // Auto-save functionality
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    setIsSaving(true);
    try {
      // Get current content from editor
      const currentContent = editor.document;
      
      let savedDocumentId: Id<'documents'>;

      if (documentId) {
        // Update existing document
        await updateDocument({
          documentId,
          title: title.trim(),
          content: currentContent,
        });
        savedDocumentId = documentId;
        toast.success('Document updated successfully');
      } else {
        // Create new document
        savedDocumentId = await createDocument({
          title: title.trim(),
          clientId,
          departmentId,
          documentType: 'project_brief',
          content: currentContent,
        });
        toast.success('Document created successfully');
        onSave?.(savedDocumentId);
      }

      setLastSaved(new Date());
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [
    title, 
    editor,
    documentId, 
    clientId, 
    departmentId, 
    updateDocument, 
    createDocument, 
    onSave
  ]);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing) setIsEditing(true);
  }, [isEditing]);

  // Auto-save every 30 seconds when editing
  useEffect(() => {
    if (!isEditing || readOnly) return;

    const autoSaveInterval = setInterval(() => {
      if (title.trim() && content) {
        handleSave();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [isEditing, title, content, handleSave, readOnly]);

  // Loading state
  if (documentId && !document) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Document metadata
  const documentStatus = document?.status || 'draft';
  const documentType = document?.documentType || 'project_brief';
  const createdAt = document?.createdAt ? new Date(document.createdAt) : null;
  const updatedAt = document?.updatedAt ? new Date(document.updatedAt) : null;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Document Header */}
      <div className="flex-shrink-0 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-500" />
            <div className="flex items-center gap-2">
              <Badge variant={documentStatus === 'active' ? 'default' : 'secondary'}>
                {documentStatus}
              </Badge>
              <Badge variant="outline">
                {documentType.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            {!readOnly && (
              <Button
                onClick={handleSave}
                disabled={isSaving || (!isEditing && !!documentId)}
                size="sm"
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            )}
          </div>
        </div>

        {/* Document Title */}
        <div className="flex items-center gap-3">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Enter document title..."
            disabled={readOnly}
            className="text-2xl font-bold border-none px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Document Metadata */}
        {document && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            {createdAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Created: {createdAt.toLocaleDateString()}
              </div>
            )}
            {document.creator && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                By: {document.creator.name}
              </div>
            )}
            {updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime() && (
              <div className="flex items-center gap-1">
                <Edit3 className="h-4 w-4" />
                Updated: {updatedAt.toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BlockNote Editor */}
      <div className="flex-1 overflow-hidden">
        <BlockNoteView
          editor={editor}
          onChange={handleContentChange}
          editable={!readOnly}
          className="h-full"
          theme="light"
        />
      </div>

      {/* Status Bar */}
      <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-4">
            {isEditing && !readOnly && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                Editing
              </div>
            )}
            {document && (
              <span>Version {document.version}</span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span>{content ? 'Content loaded' : 'Empty document'}</span>
            {document?.permissions && (
              <div className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                {document.permissions.clientVisible ? 'Client Visible' : 'Internal Only'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 