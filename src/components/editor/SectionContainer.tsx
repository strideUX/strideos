'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowUp, 
  ArrowDown,
  GripVertical 
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
  _id: Id<'sections'>;
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
  isActive = false,
  children,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  className
}: SectionContainerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get icon component dynamically
  const getIconComponent = () => {
    // In a real implementation, you might want to use a proper icon mapping
    // For now, we'll return a simple div
    return <div className="w-5 h-5 bg-gray-300 rounded"></div>;
  };

  const showActions = permissions.canEdit || permissions.canReorder || permissions.canDelete;

  return (
    <section
      id={`section-${section._id}`}
      className={cn(
        "relative scroll-mt-4 transition-all duration-200",
        isActive && "bg-blue-50/50 dark:bg-blue-900/10",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Header */}
      <div className={cn(
        "flex items-center gap-3 mb-6 pb-3 border-b border-gray-200 dark:border-gray-700",
        isActive && "border-blue-200 dark:border-blue-800"
      )}>
        {/* Icon */}
        <div className={cn(
          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isActive 
            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        )}>
          {getIconComponent()}
        </div>

        {/* Title */}
        <h2 className={cn(
          "text-xl font-semibold flex-1",
          isActive 
            ? "text-blue-900 dark:text-blue-100"
            : "text-gray-900 dark:text-gray-100"
        )}>
          {section.title}
        </h2>

        {/* Required Badge */}
        {section.required && (
          <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-md dark:bg-amber-900/30 dark:text-amber-400">
            Required
          </span>
        )}

        {/* Actions Menu */}
        {showActions && (isHovered || isActive) && (
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
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
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

        {/* Drag Handle (if reorderable) */}
        {permissions.canReorder && (
          <div className={cn(
            "opacity-0 transition-opacity cursor-grab active:cursor-grabbing",
            (isHovered || isActive) && "opacity-30 hover:opacity-70"
          )}>
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>

      {/* Section Content */}
      <div className="section-content">
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