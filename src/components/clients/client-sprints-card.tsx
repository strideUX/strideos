/**
 * ClientSprintsCard - Sprint overview card for client project management
 *
 * @remarks
 * Displays client sprints in a compact card format with status indicators and optional
 * department information. Provides loading states, empty states, and view all functionality.
 * Integrates with client management workflow for sprint tracking and oversight.
 *
 * @example
 * ```tsx
 * <ClientSprintsCard
 *   title="Active Sprints"
 *   description="Current sprint progress"
 *   sprints={clientSprints}
 *   emptyMessage="No active sprints"
 *   onViewAll={handleViewAll}
 *   showDepartment={true}
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 3. Types
interface SprintItem {
  _id: string;
  name: string;
  status: string;
  departmentId: string;
  department?: { _id: string; name: string };
}

interface ClientSprintsCardProps {
  /** Card title */
  title: string;
  /** Optional card description */
  description?: string;
  /** List of sprints to display */
  sprints: SprintItem[] | undefined;
  /** Message to show when no sprints exist */
  emptyMessage: string;
  /** Optional callback for viewing all sprints */
  onViewAll?: () => void;
  /** Whether to show department information */
  showDepartment?: boolean;
}

// 4. Component definition
export const ClientSprintsCard = memo(function ClientSprintsCard({ 
  title, 
  description, 
  sprints, 
  emptyMessage, 
  onViewAll, 
  showDepartment 
}: ClientSprintsCardProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const isLoading = useMemo(() => {
    return sprints === undefined;
  }, [sprints]);

  const hasSprints = useMemo(() => {
    return sprints && sprints.length > 0;
  }, [sprints]);

  const sprintCount = useMemo(() => {
    return sprints?.length ?? 0;
  }, [sprints]);

  const shouldShowViewAll = useMemo(() => {
    return Boolean(onViewAll);
  }, [onViewAll]);

  const shouldShowDepartment = useMemo(() => {
    return Boolean(showDepartment);
  }, [showDepartment]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleViewAll = useCallback(() => {
    if (onViewAll) {
      onViewAll();
    }
  }, [onViewAll]);

  const renderSprintItem = useCallback((sprint: SprintItem) => (
    <div key={sprint._id} className="p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="font-medium">{sprint.name}</div>
        <Badge variant="secondary">{sprint.status}</Badge>
      </div>
      {shouldShowDepartment && sprint.department && (
        <div className="text-xs text-muted-foreground mt-1">
          {sprint.department.name}
        </div>
      )}
    </div>
  ), [shouldShowDepartment]);

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
        {!isLoading && !hasSprints && (
          <div className="text-sm text-muted-foreground">{emptyMessage}</div>
        )}
        {hasSprints && (
          <div className="space-y-3">
            {sprints!.map(renderSprintItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
