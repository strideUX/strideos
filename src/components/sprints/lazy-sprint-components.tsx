"use client";

import React, { Suspense } from 'react';
import { KanbanSkeleton } from '@/components/ui/loading-skeletons';

// Lazy load heavy sprint components
const LazyActiveSprintsKanban = React.lazy(() => 
  import('./active-sprints-kanban').then(mod => ({ default: mod.ActiveSprintsKanban }))
);

const LazySprintStatsCards = React.lazy(() => 
  import('./sprint-stats-cards').then(mod => ({ default: mod.SprintStatsCards }))
);

const LazySprintFormDialog = React.lazy(() => 
  import('./sprint-form-dialog').then(mod => ({ default: mod.SprintFormDialog }))
);

const LazyTaskFormDialog = React.lazy(() => 
  import('@/components/admin/task-form-dialog').then(mod => ({ default: mod.TaskFormDialog }))
);

/**
 * LazyActiveSprintsKanbanWrapper - Lazy-loaded kanban component
 */
export function LazyActiveSprintsKanbanWrapper(props: any) {
  return (
    <Suspense fallback={<KanbanSkeleton />}>
      <LazyActiveSprintsKanban {...props} />
    </Suspense>
  );
}

/**
 * LazySprintStatsCardsWrapper - Lazy-loaded stats cards component
 */
export function LazySprintStatsCardsWrapper(props: any) {
  return (
    <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg space-y-2">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>}>
      <LazySprintStatsCards {...props} />
    </Suspense>
  );
}

/**
 * LazySprintFormDialogWrapper - Lazy-loaded form dialog component
 */
export function LazySprintFormDialogWrapper(props: any) {
  return (
    <Suspense fallback={null}>
      <LazySprintFormDialog {...props} />
    </Suspense>
  );
}

/**
 * LazyTaskFormDialogWrapper - Lazy-loaded task form dialog component
 */
export function LazyTaskFormDialogWrapper(props: any) {
  return (
    <Suspense fallback={null}>
      <LazyTaskFormDialog {...props} />
    </Suspense>
  );
}
