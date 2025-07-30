'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, CheckSquare, Calendar, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SectionHeaderBlock } from './blocks/SectionHeaderBlock';
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

  // Create schema with custom blocks
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // Include default blocks
      ...defaultBlockSpecs,
      // Add our custom section header block
      'section-header': SectionHeaderBlock,
    },
  });

  // Initialize BlockNote editor with custom schema
  const editor = useCreateBlockNote({
    schema,
    initialContent: undefined,
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
                type: 'section-header',
                props: {
                  sectionId: 'tasks',
                  title: 'Tasks & Deliverables',
                  icon: 'CheckSquare',
                  description: 'Manage project tasks, assignments, and track progress on key deliverables.',
                },
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
                type: 'section-header',
                props: {
                  sectionId: 'updates',
                  title: 'Project Updates',
                  icon: 'Calendar',
                  description: 'Weekly updates, milestones, and project timeline information.',
                },
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
                type: 'section-header',
                props: {
                  sectionId: 'team',
                  title: 'Team & Stakeholders',
                  icon: 'Users',
                  description: 'Team member information, roles, and stakeholder management.',
                },
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
                type: 'section-header',
                props: {
                  sectionId: 'settings',
                  title: 'Project Settings',
                  icon: 'Settings',
                  description: 'Project configuration and administrative settings.',
                },
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

  // Load document content ONCE to prevent cursor position resets
  useEffect(() => {
    // Only load external changes, not our own saves that cause cursor resets
    if (document?.content && editor && !isContentLoaded && !isLocalChange) {
      try {
        // If content is already BlockNote format, use it directly
        if (Array.isArray(document.content)) {
          // Defer to avoid flushSync during lifecycle
          const timer = setTimeout(() => {
            editor.replaceBlocks(editor.document, document.content);
            setIsContentLoaded(true);
            setIsInitialized(true);
          }, 0);
          return () => clearTimeout(timer);
        } else if (typeof document.content === 'string') {
          // Parse string content (might be from migration)
          const parsedContent = JSON.parse(document.content);
          if (Array.isArray(parsedContent)) {
            // Defer to avoid flushSync during lifecycle
            const timer = setTimeout(() => {
              editor.replaceBlocks(editor.document, parsedContent);
              setIsContentLoaded(true);
              setIsInitialized(true);
            }, 0);
            return () => clearTimeout(timer);
          }
        }
      } catch (error) {
        console.error('Error loading document content:', error);
        // Initialize with default sections if content loading fails - deferred
        const timer = setTimeout(() => {
          initializeDefaultSections();
          setIsContentLoaded(true);
          setIsInitialized(true);
        }, 0);
        return () => clearTimeout(timer);
      }
    } else if (editor && !document && !isContentLoaded) {
      // Initialize with default sections for new documents - deferred
      const timer = setTimeout(() => {
        initializeDefaultSections();
        setIsContentLoaded(true);
        setIsInitialized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
    
    // Reset local change flag after processing
    if (isLocalChange) {
      setIsLocalChange(false);
    }
  }, [document, editor, isContentLoaded, isLocalChange]);

  const initializeDefaultSections = () => {
    if (!editor) return;

    // Additional safety check to ensure editor is ready
    if (!editor.document) return;

    const defaultContent = [
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
        type: 'paragraph',
        content: 'Welcome to your unified project document. This document combines all project sections into a single, scrollable interface.',
      },
      {
        type: 'section-header',
        props: {
          sectionId: 'tasks',
          title: 'Tasks & Deliverables',
          icon: 'CheckSquare',
          description: 'Manage project tasks, assignments, and track progress on key deliverables.',
        },
      },
      {
        type: 'paragraph',
        content: 'Task management functionality will be added here.',
      },
      {
        type: 'section-header',
        props: {
          sectionId: 'updates',
          title: 'Project Updates',
          icon: 'Calendar',
          description: 'Weekly updates, milestones, and project timeline information.',
        },
      },
      {
        type: 'paragraph',
        content: 'Project updates and milestone tracking will be displayed here.',
      },
      {
        type: 'section-header',
        props: {
          sectionId: 'team',
          title: 'Team & Stakeholders',
          icon: 'Users',
          description: 'Team member information, roles, and stakeholder management.',
        },
      },
      {
        type: 'paragraph',
        content: 'Team member cards and stakeholder information will be shown here.',
      },
      {
        type: 'section-header',
        props: {
          sectionId: 'settings',
          title: 'Project Settings',
          icon: 'Settings',
          description: 'Project configuration and administrative settings.',
        },
      },
      {
        type: 'paragraph',
        content: 'Project configuration options will be available here.',
      },
    ];

    editor.replaceBlocks(editor.document, defaultContent);
  };

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
          {!isInitialized && editor ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing document...</span>
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