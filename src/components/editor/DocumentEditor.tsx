'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Save, 
  Edit3, 
  FileText, 
  Calendar,
  Users,
  Settings,
  Clock,
  CheckCircle,
  Loader2,
  Keyboard
} from 'lucide-react';

// Import the client-side only BlockNote editor
import { BlockNoteEditor } from './BlockNoteEditor';
import { Block } from '@blocknote/core';

// Import styles
import '@blocknote/mantine/style.css';
import '../../styles/blocknote-theme.css';

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
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [wordCount, setWordCount] = useState(0);

  // Editor state management

  // Convex hooks
  const documentData = useQuery(api.documents.getDocument, 
    documentId ? { documentId } : 'skip'
  );
  const createDocument = useMutation(api.documents.createDocument);
  const updateDocument = useMutation(api.documents.updateDocument);

  // Load document data when available
  useEffect(() => {
    if (documentData) {
      setTitle(documentData.title);
      if (documentData.content) {
        setContent(documentData.content);
      }
      setIsEditing(false);
      setSaveStatus('saved');
    }
  }, [documentData]);

  // Calculate word count
  useEffect(() => {
    if (content) {
      const text = content
        .map(block => {
          if ('content' in block && Array.isArray(block.content)) {
            return block.content
              .filter(item => item.type === 'text')
              .map(item => item.text)
              .join(' ');
          }
          return '';
        })
        .join(' ');
      
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  }, [content]);

  // Handle content changes with enhanced status feedback
  const handleContentChange = useCallback((newContent: Block[]) => {
    if (readOnly) return;
    setContent(newContent);
    if (!isEditing) setIsEditing(true);
    setSaveStatus('unsaved');
  }, [readOnly, isEditing]);

  // Enhanced auto-save functionality with better feedback
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please enter a document title');
      return;
    }

    if (!content) {
      toast.error('No content to save');
      return;
    }

    setSaveStatus('saving');
    setIsSaving(true);
    
    try {
      // Use current content from state
      const currentContent = content;
      
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
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [
    title, 
    content,
    documentId, 
    clientId, 
    departmentId, 
    updateDocument, 
    createDocument, 
    onSave
  ]);

  // Handle title changes with status feedback
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    if (!isEditing) setIsEditing(true);
    setSaveStatus('unsaved');
  }, [isEditing]);

  // Enhanced auto-save with status feedback
  useEffect(() => {
    if (!isEditing || readOnly || saveStatus !== 'unsaved') return;

    const autoSaveTimeout = setTimeout(() => {
      if (title.trim() && content) {
        handleSave();
      }
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimeout);
  }, [isEditing, title, content, handleSave, readOnly, saveStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    if (typeof window !== 'undefined') {
      window.document.addEventListener('keydown', handleKeyboard);
      return () => window.document.removeEventListener('keydown', handleKeyboard);
    }
  }, [handleSave]);

  // Loading state
  if (documentId && !documentData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }



  // Document metadata
  const documentStatus = documentData?.status || 'draft';
  const documentType = documentData?.documentType || 'project_brief';
  const createdAt = documentData?.createdAt ? new Date(documentData.createdAt) : null;
  const updatedAt = documentData?.updatedAt ? new Date(documentData.updatedAt) : null;

  // Save status indicator
  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving': return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'saved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'unsaved': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'error': return <Clock className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'All changes saved';
      case 'unsaved': return 'Unsaved changes';
      case 'error': return 'Save failed';
      default: return 'Unknown';
    }
  };

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Enhanced Document Header */}
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
            
            <div className="flex items-center gap-3">
              {/* Save Status Indicator */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {getSaveStatusIcon()}
                    <span className="hidden sm:inline">{getSaveStatusText()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getSaveStatusText()}</p>
                  {lastSaved && <p className="text-xs">Last saved: {lastSaved.toLocaleTimeString()}</p>}
                </TooltipContent>
              </Tooltip>

              {/* Keyboard Shortcut Hint */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Keyboard className="h-4 w-4 text-muted-foreground hidden lg:block" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard Shortcuts:</p>
                  <p className="text-xs">Ctrl/Cmd + S: Save</p>
                  <p className="text-xs">/ : Open block menu</p>
                </TooltipContent>
              </Tooltip>

              {/* Enhanced Save Button */}
              {!readOnly && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || (saveStatus === 'saved' && !!documentId)}
                      size="sm"
                      className="gap-2"
                      variant={saveStatus === 'unsaved' ? 'default' : 'outline'}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isSaving ? 'Saving...' : 'Save'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save document (Ctrl/Cmd + S)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Enhanced Document Title */}
          <div className="flex items-center gap-3">
            <Input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter document title..."
              disabled={readOnly}
              className="text-2xl font-bold border-none px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>

                     {/* Enhanced Document Metadata */}
           {documentData && (
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                             {createdAt && (
                 <div className="flex items-center gap-1">
                   <Calendar className="h-4 w-4" />
                   Created: {createdAt.toLocaleDateString()}
                 </div>
               )}
               {documentData.creator && (
                 <div className="flex items-center gap-1">
                   <Users className="h-4 w-4" />
                   By: {documentData.creator.name}
                 </div>
               )}
              {updatedAt && createdAt && updatedAt.getTime() !== createdAt.getTime() && (
                <div className="flex items-center gap-1">
                  <Edit3 className="h-4 w-4" />
                  Updated: {updatedAt.toLocaleDateString()}
                </div>
              )}
              {/* Word Count */}
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {wordCount} {wordCount === 1 ? 'word' : 'words'}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced BlockNote Editor */}
        <div className="flex-1 overflow-hidden relative">
          <BlockNoteEditor
            initialContent={content}
            onChange={handleContentChange}
            editable={!readOnly}
            isSaving={isSaving}
            className="h-full"
          />
        </div>

        {/* Enhanced Status Bar */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              {/* Enhanced Editing Status */}
              {isEditing && !readOnly && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span>Editing</span>
                  <span className="text-xs text-muted-foreground">(Auto-save in 3s)</span>
                </div>
                             )}
               {documentData && (
                 <span>Version {documentData.version}</span>
               )}
              {/* Reading Time Estimate */}
              <span>{Math.ceil(wordCount / 200)} min read</span>
            </div>
            
                         <div className="flex items-center gap-4">
               <span>{content ? 'Content loaded' : 'Empty document'}</span>
               {documentData?.permissions && (
                 <div className="flex items-center gap-1">
                   <Settings className="h-4 w-4" />
                   {documentData.permissions.clientVisible ? 'Client Visible' : 'Internal Only'}
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 