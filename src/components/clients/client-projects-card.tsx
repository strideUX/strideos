/**
 * ClientProjectsCard - Project overview card for client project management
 *
 * @remarks
 * Displays client projects in a compact card format with progress indicators, status badges,
 * and optional due date information. Provides loading states, empty states, and view all functionality.
 * Integrates with client management workflow for project tracking and oversight.
 *
 * @example
 * ```tsx
 * <ClientProjectsCard
 *   title="Active Projects"
 *   description="Current project progress"
 *   projects={clientProjects}
 *   emptyMessage="No active projects"
 *   onViewAll={handleViewAll}
 *   showStatus={true}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

// 3. Types
interface ProjectItem {
  _id: string;
  title: string;
  status: string;
  progress?: number;
  targetDueDate?: number;
}

interface ClientProjectsCardProps {
  /** Card title */
  title: string;
  /** Optional card description */
  description?: string;
  /** List of projects to display */
  projects: ProjectItem[] | undefined;
  /** Message to show when no projects exist */
  emptyMessage: string;
  /** Optional callback for viewing all projects */
  onViewAll?: () => void;
  /** Whether to show project status */
  showStatus?: boolean;
}

// 4. Component definition
export const ClientProjectsCard = memo(function ClientProjectsCard({ 
  title, 
  description, 
  projects, 
  emptyMessage, 
  onViewAll, 
  showStatus 
}: ClientProjectsCardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isLoading = useMemo(() => {
    return projects === undefined;
  }, [projects]);

  const hasProjects = useMemo(() => {
    return projects && projects.length > 0;
  }, [projects]);

  const projectCount = useMemo(() => {
    return projects?.length ?? 0;
  }, [projects]);

  const shouldShowViewAll = useMemo(() => {
    return Boolean(onViewAll);
  }, [onViewAll]);

  const shouldShowStatus = useMemo(() => {
    return Boolean(showStatus);
  }, [showStatus]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    }
  }, [onViewAll]);

  const renderProjectItem = useCallback((project: ProjectItem) => (
    <div key={project._id} className="p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="font-medium">{project.title}</div>
        {shouldShowStatus && (
          <Badge variant="secondary">{project.status}</Badge>
        )}
      </div>
      {project.progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2 mt-1" />
        </div>
      )}
    </div>
  ), [shouldShowStatus]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {shouldShowViewAll && (
            <Button variant="outline" size="sm" onClick={handleViewAll}>
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {!isLoading && !hasProjects && (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
        {hasProjects && (
          <div className="space-y-3">
            {projects!.map(renderProjectItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
