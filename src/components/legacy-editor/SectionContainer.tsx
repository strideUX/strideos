'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  FileText,
  CheckSquare,
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Id } from '../../../convex/_generated/dataModel';

export interface SectionData {
  _id: Id<'documentSections'>;
  documentId: Id<'documents'>;
  type: string;
  title: string;
  icon: string;
  order: number;
  required: boolean;
  content: unknown; // BlockNote JSONContent
  permissions: {
    canView: string[];
    canEdit: string[];
    canInteract: string[];
    canReorder: string[];
    canDelete: string[];
    clientVisible: boolean;
    fieldPermissions?: Record<string, unknown>;
  };
  createdBy: Id<'users'>;
  updatedBy: Id<'users'>;
  createdAt: number;
  updatedAt: number;
}

export interface SectionPermissions {
  canEdit: boolean;
  canInteract: boolean;
  canReorder: boolean;
  canDelete: boolean;
}

interface SectionContainerProps {
  section: SectionData;
  permissions: SectionPermissions;
  isActive?: boolean;
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  className?: string;
}

export function SectionContainer({
  section,
  permissions,
  children,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  className
}: SectionContainerProps) {
  const [, setIsHovered] = useState(false);

  // Icon mapping for sections (same as sidebar)
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

  // Get icon component dynamically
  const getIconComponent = () => {
    const IconComponent = SECTION_ICONS[section.type as keyof typeof SECTION_ICONS] || FileText;
    return <IconComponent className="w-6 h-6" />;
  };

  const showActions = permissions.canEdit || permissions.canReorder || permissions.canDelete;

  return (
    <section
      id={`section-${section._id}`}
      className={cn(
        "relative scroll-mt-4 transition-all duration-200 min-h-screen pt-6",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        {/* Icon */}
        <div className="flex-shrink-0 text-foreground">
          {getIconComponent()}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold flex-1 text-foreground">
          {section.title}
        </h2>

        {/* Required Badge */}
        {section.required && (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-md dark:bg-amber-900/30 dark:text-amber-400">
            Required
          </span>
        )}

        {/* Actions Menu */}
        {showActions && (
          <div className="flex items-center gap-1">
            {/* Move buttons for reordering */}
            {permissions.canReorder && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1"></div>
              </>
            )}

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-70 hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {permissions.canEdit && onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Section
                  </DropdownMenuItem>
                )}
                
                {permissions.canReorder && (
                  <>
                    {permissions.canEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={onMoveUp} disabled={!canMoveUp}>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Move Up
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onMoveDown} disabled={!canMoveDown}>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Move Down
                    </DropdownMenuItem>
                  </>
                )}

                {permissions.canDelete && onDelete && !section.required && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={onDelete}
                      className="text-red-600 focus:text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Section
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className="section-content min-h-[calc(100vh-200px)]">
        {children}
      </div>
    </section>
  );
}

// Helper function to check section permissions based on user role
export function checkSectionPermissions(
  section: SectionData,
  userRole: string
): SectionPermissions {
  const permissions = section.permissions;
  
  return {
    canEdit: permissions.canEdit.includes(userRole) || permissions.canEdit.includes('all'),
    canInteract: permissions.canInteract.includes(userRole) || permissions.canInteract.includes('all'),
    canReorder: permissions.canReorder.includes(userRole) || permissions.canReorder.includes('all'),
    canDelete: permissions.canDelete.includes(userRole) || permissions.canDelete.includes('all'),
  };
}