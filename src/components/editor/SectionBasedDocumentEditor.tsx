'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionEditor } from './SectionEditor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import '../../styles/blocknote-theme.css';

// Icon mapping for sections
const SECTION_ICONS = {
  overview: FileText,
  deliverables: CheckSquare,
  timeline: Calendar,
  team: Users,
  feedback: MessageSquare,
  getting_started: FileText,
  final_delivery: CheckSquare,
  weekly_status: Calendar,
  original_request: FileText,
  custom: FileText,
};

interface SectionBasedDocumentEditorProps {
  documentId: Id<'documents'>;
  userRole?: string;
  onBack?: () => void;
}

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  order: number;
  element?: HTMLElement;
}

export function SectionBasedDocumentEditor({
  documentId,
  userRole = 'pm',
  onBack
}: SectionBasedDocumentEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Function to register section refs
  const registerSectionRef = (sectionId: string, element: HTMLDivElement | null) => {
    if (element) {
      sectionRefs.current.set(sectionId, element);
    } else {
      sectionRefs.current.delete(sectionId);
    }
  };

  // Data queries
  const documentWithSections = useQuery(api.documents.getDocumentWithSections, { documentId });
  const createSection = useMutation(api.sections.createSection);
  const reorderSections = useMutation(api.sections.reorderSections);

  const document = documentWithSections?.document;

  // Memoize sections to prevent unnecessary re-renders
  const memoizedSections = useMemo(() => documentWithSections?.sections || [], [documentWithSections?.sections]);

  // Default project data for demo (will be replaced with real data)
  const projectData = {
    name: document?.title || 'Project Document',
    client: 'Client Name',
    status: document?.status || 'active',
    dueDate: 'February 15, 2025',
    team: ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson'],
    progress: 75,
    description: 'Section-based document with multiple BlockNote editors'
  };

  // Generate navigation from sections
  useEffect(() => {
    if (memoizedSections.length > 0) {
      const navItems = memoizedSections.map(section => ({
        id: section._id,
        title: section.title,
        icon: SECTION_ICONS[section.type as keyof typeof SECTION_ICONS] || FileText,
        order: section.order,
      })).sort((a, b) => a.order - b.order);

      setNavigationItems(navItems);

      // Set first section as active if none selected
      if (!activeSection && navItems.length > 0) {
        setActiveSection(navItems[0].id);
      }
    }
  }, [memoizedSections, activeSection]);

  // Intersection Observer for active section tracking
  useEffect(() => {
    if (!contentRef.current || memoizedSections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target.id.replace('section-', ''));

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0]);
        }
      },
      {
        root: contentRef.current,
        rootMargin: '-10% 0px -80% 0px',
        threshold: 0.1,
      }
    );

    // Observe all section elements using refs
    // Use setTimeout to ensure refs are registered after render
    const timeoutId = setTimeout(() => {
      memoizedSections.forEach(section => {
        const element = sectionRefs.current.get(section._id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [memoizedSections]);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current.get(sectionId);
    if (element && contentRef.current) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start',
      });
      setActiveSection(sectionId);
    }
  };

  // Handle section reordering
  const handleMoveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const currentIndex = memoizedSections.findIndex(s => s._id === sectionId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= memoizedSections.length) return;

    try {
      // Create new order array
      const reorderedSections = [...memoizedSections];
      const [movedSection] = reorderedSections.splice(currentIndex, 1);
      reorderedSections.splice(newIndex, 0, movedSection);

      // Update orders
      const sectionOrders = reorderedSections.map((section, index) => ({
        sectionId: section._id,
        order: index,
      }));

      await reorderSections({ documentId, sectionOrders });
      toast.success('Section reordered successfully');
    } catch (error) {
      console.error('Failed to reorder section:', error);
      toast.error('Failed to reorder section');
    }
  };

  // Handle adding new section
  const handleAddSection = async () => {
    try {
      const newOrder = memoizedSections.length;
      await createSection({
        documentId,
        type: 'custom',
        title: 'New Section',
        icon: 'FileText',
        order: newOrder,
      });
      toast.success('Section added successfully');
    } catch (error) {
      console.error('Failed to add section:', error);
      toast.error('Failed to add section');
    }
  };

  // Auto-save state management
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update save status when any section saves
  const handleSectionSave = useCallback((sectionId: string, status: 'saving' | 'saved') => {
    setSaveStatus(status);
    if (status === 'saved') {
      setLastSaved(new Date());
    }
  }, []);

  // Handle section deletion
  const handleSectionDelete = useCallback((sectionId: string) => {
    // The section will be automatically removed from the list when the query refetches
    // This callback can be used for any additional cleanup or UI updates
    console.log('Section deleted:', sectionId);
  }, []);

  // Format last saved time
  const formatLastSaved = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get section icon function
  const getSectionIcon = (sectionType: string) => {
    const Icon = SECTION_ICONS[sectionType as keyof typeof SECTION_ICONS] || FileText;
    return <Icon className="w-4 h-4 flex-shrink-0" />;
  };

  if (!documentWithSections) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded w-3/5"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-6 flex flex-col h-full">
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="justify-start mb-4 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          )}

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">In Progress</span>
          </div>

          {/* Document Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {document?.title || 'Project Document'}
          </h1>

          {/* Client Info */}
          <div className="text-sm text-gray-600 mb-6">
            Client: <span className="text-purple-600 font-medium">{projectData.client}</span>
          </div>

          {/* Sections List */}
          <div className="space-y-2 flex-1">
            {memoizedSections.map((section, index) => (
              <button
                key={section._id}
                onClick={() => scrollToSection(section._id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 text-gray-700",
                  activeSection === section._id && "font-semibold text-gray-900"
                )}
              >
                <div className="flex items-center gap-2">
                  {getSectionIcon(section.type)}
                  <span className="text-sm">{section.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Auto-save Status - Bottom of Sidebar */}
          <div className="mt-auto pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-600">Saved</span>
                  </>
                )}
                {saveStatus === 'idle' && lastSaved && (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">Last updated at {formatLastSaved(lastSaved)}</span>
                  </>
                )}
                {saveStatus === 'idle' && !lastSaved && (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600">Not saved yet</span>
                  </>
                )}
              </div>
              
              {/* Page Settings Gear Icon */}
              <Dialog open={showPageSettings} onOpenChange={setShowPageSettings}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Page Settings</DialogTitle>
                    <DialogDescription>
                      Configure document settings and preferences.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                      Page settings configuration will be implemented here. This is placeholder content for the Page Settings modal.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto" ref={contentRef}>
        <div className="mx-auto pb-6 px-8">

          {/* Sections */}
          <div className="space-y-12">
            {memoizedSections.map((section, index) => (
              <div
                key={section._id}
                id={`section-${section._id}`}
                ref={(element) => registerSectionRef(section._id, element)}
              >
                <SectionEditor
                  section={section}
                  userRole={userRole}
                  isActive={activeSection === section._id}
                  onMoveUp={() => handleMoveSection(section._id, 'up')}
                  onMoveDown={() => handleMoveSection(section._id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < memoizedSections.length - 1}
                  onSaveStatusChange={handleSectionSave}
                  onDelete={handleSectionDelete}
                />
              </div>
            ))}
          </div>

          {/* Add Section Button */}
          <div className="mt-6 mb-6 text-center">
            <Button 
              variant="outline" 
              onClick={handleAddSection}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}