/**
 * SiteHeader - Main site header component with user information and navigation
 *
 * @remarks
 * Displays the site header with sidebar trigger, user role badge, and notification bell.
 * Handles loading states and provides role-based visual indicators. Integrates with
 * the sidebar system and notification system for consistent user experience.
 *
 * @example
 * ```tsx
 * <SiteHeader user={currentUser} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";

// 3. Types
interface User {
  _id: string;
  email?: string;
  name?: string;
  role?: 'admin' | 'pm' | 'task_owner' | 'client';
  clientId?: string;
  departmentIds?: string[];
  createdAt?: number;
  updatedAt?: number;
}

interface SiteHeaderProps {
  /** Current user information */
  user?: User;
}

// 4. Component definition
export const SiteHeader = memo(function SiteHeader({ user }: SiteHeaderProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const roleLabel = useMemo(() => {
    if (!user?.role) return 'User';
    
    switch (user.role) {
      case 'admin': return 'Admin';
      case 'pm': return 'PM';
      case 'task_owner': return 'Task Owner';
      case 'client': return 'Client';
      default: return 'User';
    }
  }, [user?.role]);

  const roleColor = useMemo(() => {
    if (!user?.role) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    
    switch (user.role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pm': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'task_owner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'client': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, [user?.role]);

  const isLoading = useMemo(() => {
    return !user;
  }, [user]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  if (isLoading) {
    return (
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Loading...
            </span>
          </div>
        </div>
      </header>
    );
  }

  // === 7. RENDER (JSX) ===
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-3" />
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          
          <Badge variant="secondary" className={`text-xs ${roleColor}`}>
            {roleLabel}
          </Badge>
        </div>
      </div>
    </header>
  );
});
