'use client';

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Users, 
  Settings
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
  onSaveStatusChange?: (status: 'idle' | 'saving' | 'saved', lastSaved?: Date) => void;
}



export function SectionBasedDocumentEditor({
  documentId,
  userRole = 'pm',
  onBack,
  onSaveStatusChange
}: SectionBasedDocumentEditorProps) {
  const [activeSection, setActiveSection] = useState<string>('');
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
  const createSection = useMutation(api.documentSections.createDocumentSection);
  const reorderSections = useMutation(api.documentSections.reorderDocumentSections);

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
    const newLastSaved = status === 'saved' ? new Date() : lastSaved;
    if (status === 'saved') {
      setLastSaved(newLastSaved);
    }
    // Notify parent component about save status change
    onSaveStatusChange?.(status, newLastSaved || undefined);
  }, [onSaveStatusChange, lastSaved]);

  // Handle section deletion
  const handleSectionDelete = useCallback(() => {
    // The section will be automatically removed from the list when the query refetches
    // This callback can be used for any additional cleanup or UI updates
            // Section deleted successfully
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
      <div className="flex h-full bg-background dark:bg-sidebar">
        <div className="w-72 bg-background dark:bg-sidebar flex-shrink-0">
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
    <div className="flex h-full bg-background dark:bg-sidebar">
      {/* Fixed Sidebar */}
      <div className="w-72 bg-background dark:bg-sidebar flex-shrink-0 flex flex-col">
        <div className="p-6 flex flex-col h-full">
          {/* Spacer to push content to center */}
          <div className="flex-1" />
          
          {/* Sections List - Centered */}
          <div className="space-y-2">
            {memoizedSections.map((section) => (
              <button
                key={section._id}
                onClick={() => scrollToSection(section._id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg transition-colors hover:text-foreground text-muted-foreground",
                  activeSection === section._id && "font-bold text-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  {getSectionIcon(section.type)}
                  <span className="text-sm">{section.title}</span>
                </div>
              </button>
            ))}
            
            {/* Add Section Button */}
            <button
              onClick={handleAddSection}
              className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:text-foreground text-muted-foreground flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Section</span>
            </button>
          </div>
          
          {/* Spacer to fill bottom space */}
          <div className="flex-1" />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto" ref={contentRef}>
        <div className="mx-auto px-8">

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
                  documentId={documentId}
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
        </div>
      </div>
    </div>
  );
}