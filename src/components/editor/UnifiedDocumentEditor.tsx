'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, CheckSquare, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
// import { useCreateBlockNote } from '@blocknote/react'; // Replaced with defensive useState pattern
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SectionHeaderBlock } from './blocks/SectionHeaderBlock';
import { OverviewBlock } from './blocks/OverviewBlock';
import { toast } from 'sonner';

// Import BlockNote styles
import '@blocknote/mantine/style.css';
import '../../styles/blocknote-theme.css';

interface Section {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface UnifiedDocumentEditorProps {
  documentId?: Id<'documents'>;
  clientId?: Id<'clients'>;
  departmentId?: Id<'departments'>;
  project?: {
    name: string;
    client: string;
    status: string;
    dueDate: string;
    team: string[];
    progress: number;
    description: string;
  };
  onBack?: () => void;
}

const sections: Section[] = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "updates", label: "Updates", icon: Calendar },
  { id: "team", label: "Team", icon: Users },
  { id: "settings", label: "Settings", icon: Settings },
];

const defaultProject = {
  name: "Enhanced BlockNote Editor Demo",
  client: "Internal Project",
  status: "active",
  dueDate: "February 15, 2025",
  team: ["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"],
  progress: 75,
  description: "A comprehensive demonstration of the unified document layout with BlockNote integration"
};

export function UnifiedDocumentEditor({
  documentId,
  clientId,
  departmentId,
  project = defaultProject,
  onBack
}: UnifiedDocumentEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [isLocalChange, setIsLocalChange] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Document queries and mutations
  const document = useQuery(api.documents.getDocument, documentId ? { documentId: documentId } : 'skip');
  const updateDocument = useMutation(api.documents.updateDocument);

  // Create schema - incrementally adding custom blocks back
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // Start with default blocks
      ...defaultBlockSpecs,
      // ✅ Custom blocks re-enabled with fixed group property 
      'section-header': SectionHeaderBlock, // Fixed: Added group property
      'overview': OverviewBlock,           // Fixed: Added group property 
      // TODO: Add remaining custom blocks after testing
    },
  });

  // Initialize BlockNote editor with document content (fixed autosave issue)
  const initialContent = useMemo(() => {
    console.log('initialContent calculation:', { 
      document: document?.content, 
      hasDocument: !!document,
      isArray: Array.isArray(document?.content),
      contentType: typeof document?.content 
    });
    
    if (document?.content && Array.isArray(document.content)) {
      const result = document.content;
      console.log('initialContent calculation:', { result, resultLength: result.length });
      return result;
    } else if (document?.content && typeof document.content === 'string') {
      try {
        const parsedContent = JSON.parse(document.content);
        if (Array.isArray(parsedContent)) {
          console.log('initialContent calculation:', { result: parsedContent, resultLength: parsedContent.length });
          return parsedContent;
        }
      } catch (error) {
        console.error('Error parsing document content:', error);
      }
    }
    
    // Return default content for new documents with custom blocks (FIXED)
    const defaultContent = [
      {
        type: 'heading',
        props: { level: 1 },
        content: 'Project Document',
      },
      {
        type: 'paragraph',
        content: 'Welcome to your unified project document. Use "/" to add sections like /overview, /tasks, /updates, etc.',
      },
      {
        type: 'section-header',
        props: {
          sectionId: 'overview',
          title: 'Project Overview',
          icon: 'FileText',
          description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
        },
      },
      {
        type: 'overview',
        props: {
          title: 'Project Overview',
          description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
          showStats: true,
          documentId: documentId || '',
          clientId: clientId || '',
          departmentId: departmentId || '',
        },
      },
    ];
    console.log('initialContent calculation:', { result: defaultContent, resultLength: defaultContent.length });
    return defaultContent;
  }, [document?.content, documentId, clientId, departmentId]);

  // Step 3: Fix timing issue with useState + useEffect pattern
  const [editor, setEditor] = useState<BlockNoteEditor | null>(null);

  console.log('Creating editor with:', { 
    initialContent, 
    isArray: Array.isArray(initialContent), 
    length: initialContent?.length,
    hasEditor: !!editor 
  });

  useEffect(() => {
    // Only create editor when we have valid data and no existing editor
    if (initialContent && Array.isArray(initialContent) && !editor) {
      console.log('✅ Creating BlockNote editor with valid content:', initialContent.length, 'blocks');
      
      const newEditor = BlockNoteEditor.create({
        schema,
        initialContent,
        slashCommands: [
          {
            name: 'Overview Section',
            execute: (editor) => {
              editor.insertBlocks(
                [
                  {
                    type: 'section-header',
                    props: {
                      sectionId: 'overview',
                      title: 'Project Overview',
                      icon: 'FileText',
                      description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
                    },
                  },
                  {
                    type: 'overview',
                    props: {
                      title: 'Project Overview',
                      description: 'This section provides a comprehensive overview of the project including goals, timeline, and key deliverables.',
                      showStats: true,
                      documentId: documentId || '',
                      clientId: clientId || '',
                      departmentId: departmentId || '',
                    },
                  },
                ],
                editor.getTextCursorPosition().block,
                'after'
              );
            },
            aliases: ['overview', 'project-overview'],
            group: 'Sections',
          },
          {
            name: 'Tasks Section',
            execute: (editor) => {
              editor.insertBlocks(
                [
                  {
                    type: 'heading',
                    props: { level: 2 },
                    content: 'Tasks & Deliverables',
                  },
                  {
                    type: 'paragraph',
                    content: 'Manage project tasks, assignments, and track progress on key deliverables.',
                  },
                ],
                editor.getTextCursorPosition().block,
                'after'
              );
            },
            aliases: ['tasks', 'deliverables'],
            group: 'Sections',
          },
          {
            name: 'Updates Section',
            execute: (editor) => {
              editor.insertBlocks(
                [
                  {
                    type: 'heading',
                    props: { level: 2 },
                    content: 'Project Updates',
                  },
                  {
                    type: 'paragraph',
                    content: 'Weekly updates, milestones, and project timeline information.',
                  },
                ],
                editor.getTextCursorPosition().block,
                'after'
              );
            },
            aliases: ['updates', 'milestones'],
            group: 'Sections',
          },
          {
            name: 'Team Section',
            execute: (editor) => {
              editor.insertBlocks(
                [
                  {
                    type: 'heading',
                    props: { level: 2 },
                    content: 'Team & Stakeholders',
                  },
                  {
                    type: 'paragraph',
                    content: 'Team member information, roles, and stakeholder management.',
                  },
                ],
                editor.getTextCursorPosition().block,
                'after'
              );
            },
            aliases: ['team', 'stakeholders'],
            group: 'Sections',
          },
          {
            name: 'Settings Section',
            execute: (editor) => {
              editor.insertBlocks(
                [
                  {
                    type: 'heading',
                    props: { level: 2 },
                    content: 'Project Settings',
                  },
                  {
                    type: 'paragraph',
                    content: 'Project configuration and administrative settings.',
                  },
                ],
                editor.getTextCursorPosition().block,
                'after'
              );
            },
            aliases: ['settings', 'config'],
            group: 'Sections',
          },
        ],
      });
      
      setEditor(newEditor);
    } else if (!initialContent || !Array.isArray(initialContent)) {
      console.log('⏳ Waiting for valid initialContent...', { initialContent, isArray: Array.isArray(initialContent) });
    }
  }, [initialContent, schema, editor, documentId, clientId, departmentId]);

  // Navigation system - detect sections from document content
  const scrollToSection = (sectionId: string) => {
    if (typeof window === 'undefined' || !document || typeof document.getElementById !== 'function') return;
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handle content changes for autosave - mark as local change to prevent cursor resets
  const handleContentChange = useCallback((newContent: any) => {
    if (!documentId || !editor) return;
    setIsLocalChange(true); // Mark as local change to prevent reload
    setSaveStatus('unsaved');
  }, [documentId, editor]);

  // Intersection Observer to track active section (preserve existing behavior)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: '-20% 0px -20% 0px',
      }
    );

    // Observe section headers - protect from SSR
    if (typeof document !== 'undefined') {
      const sectionElements = document.querySelectorAll('.section-header');
      sectionElements.forEach((element) => {
        observer.observe(element);
      });
    }

    return () => observer.disconnect();
  }, []);

  // Simple initialization tracking (content is loaded via initialContent now)
  useEffect(() => {
    if (editor && !isInitialized) {
      // Just mark as initialized, content is already loaded via initialContent
      setIsInitialized(true);
      setIsContentLoaded(true);
    }
    
    // Reset local change flag after processing
    if (isLocalChange) {
      setIsLocalChange(false);
    }
  }, [editor, isInitialized, isLocalChange]);

  // Enhanced auto-save with proper debouncing (fixed implementation)
  useEffect(() => {
    if (!editor || !documentId || saveStatus !== 'unsaved') return;

    const saveDocument = async () => {
      try {
        setSaveStatus('saving');
        const content = editor.document;
        await updateDocument({
          documentId: documentId,
          content: content,
        });
        setSaveStatus('saved');
        // Remove disruptive autosave toast - keep only status indicator
      } catch (error) {
        console.error('Failed to save document:', error);
        setSaveStatus('error');
        toast.error('Failed to save document');
      }
    };

    // Auto-save after 3 seconds of inactivity
    const autoSaveTimeout = setTimeout(() => {
      saveDocument();
    }, 3000);

    return () => clearTimeout(autoSaveTimeout);
  }, [editor, documentId, updateDocument, saveStatus]);

  // Keyboard shortcuts (preserve existing functionality)
  useEffect(() => {
    // Guard against SSR - only run on client with DOM available
    if (typeof window === 'undefined' || !document) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (documentId && editor) {
          const content = editor.document;
          updateDocument({ documentId: documentId, content: content })
            .then(() => {
              setSaveStatus('saved');
              toast.success('Document saved');
            })
            .catch(() => {
              setSaveStatus('error');
              toast.error('Failed to save document');
            });
        }
      }
    };

    // Safe to use document now
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      // Guard cleanup too
      if (typeof window !== 'undefined' && document) {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [editor, documentId, updateDocument]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar - Identical to SectionedDocumentEditor */}
      <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="p-6">
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Active Project</span>
          </div>

          {/* Project Title */}
          <h1 className="text-xl font-semibold text-gray-900 mb-2 leading-tight">
            {project.name}
          </h1>

          {/* Client */}
          <p className="text-sm text-gray-500 mb-8">
            Client: <span className="text-purple-600 font-medium">{project.client}</span>
          </p>

          {/* Section Navigation */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Sections
            </h3>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                      activeSection === section.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Project Stats */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Project Stats
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Progress</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {project.progress}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Due Date</span>
                <span className="text-sm font-medium text-gray-900">{project.dueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Team Size</span>
                <span className="text-sm font-medium text-gray-900">{project.team.length} members</span>
              </div>
            </div>
          </div>

          {/* Stakeholders */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Stakeholders
            </h3>
            <div className="space-y-3">
              {project.team.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {member
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{member}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Status */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={cn(
                "w-2 h-2 rounded-full",
                saveStatus === 'saved' && "bg-green-500",
                saveStatus === 'saving' && "bg-yellow-500 animate-pulse",
                saveStatus === 'unsaved' && "bg-orange-500",
                saveStatus === 'error' && "bg-red-500"
              )}></div>
              <span>
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'unsaved' && 'Unsaved changes'}
                {saveStatus === 'error' && 'Save error'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified BlockNote Document Content */}
      <div className="flex-1 overflow-auto" ref={contentRef}>
        <div ref={editorRef} className="unified-document-editor">
          {!editor ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Loading editor...</span>
              </div>
            </div>
          ) : (
            <BlockNoteView 
              editor={editor}
              onChange={handleContentChange}
              theme="light"
              className="min-h-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}