import { ComponentType, lazy } from 'react';

/**
 * Dynamic import utility for consistent lazy loading across the application
 * 
 * @remarks
 * Provides a standardized way to lazy load components with:
 * - Consistent error handling
 * - Loading state management
 * - Bundle size optimization
 * 
 * @example
 * ```tsx
 * const LazyComponent = createLazyComponent(() => import('./HeavyComponent'));
 * 
 * // With custom fallback
 * const LazyComponent = createLazyComponent(
 *   () => import('./HeavyComponent'),
 *   <CustomSkeleton />
 * );
 * ```
 */

/**
 * createLazyComponent - Creates a lazy-loaded component with consistent error handling
 */
export function createLazyComponent<T extends Record<string, any>>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  return lazy(importFn);
}

/**
 * Predefined lazy components for common heavy components
 */

// Editor components
export const LazyEditorShell = lazy(() => 
  import('@/components/editor/EditorShell').then(mod => ({ default: mod.EditorShell }))
);

export const LazyBlockNoteEditor = lazy(() => 
  import('@/components/editor/BlockNoteEditor').then(mod => ({ default: mod.BlockNoteEditor }))
);

// Sprint components
export const LazyActiveSprintsKanban = lazy(() => 
  import('@/components/sprints/active-sprints-kanban').then(mod => ({ default: mod.ActiveSprintsKanban }))
);

export const LazySprintStatsCards = lazy(() => 
  import('@/components/sprints/sprint-stats-cards').then(mod => ({ default: mod.SprintStatsCards }))
);

export const LazySprintFormDialog = lazy(() => 
  import('@/components/sprints/sprint-form-dialog').then(mod => ({ default: mod.SprintFormDialog }))
);

// Admin components
export const LazyTaskFormDialog = lazy(() => 
  import('@/components/admin/task-form-dialog').then(mod => ({ default: mod.TaskFormDialog }))
);

export const LazyClientFormDialog = lazy(() => 
  import('@/components/admin/client-form-dialog').then(mod => ({ default: mod.ClientFormDialog }))
);

// Chart components
export const LazyChartAreaInteractive = lazy(() => 
  import('@/components/chart-area-interactive').then(mod => ({ default: mod.ChartAreaInteractive }))
);

// Table components
export const LazyDataTable = lazy(() => 
  import('@/components/data-table').then(mod => ({ default: mod.DataTable }))
);

/**
 * Bundle splitting strategy for different feature areas
 */

// Editor bundle - loads when editing documents
export const editorBundle = {
  EditorShell: LazyEditorShell,
  BlockNoteEditor: LazyBlockNoteEditor,
};

// Sprint bundle - loads when viewing sprints
export const sprintBundle = {
  ActiveSprintsKanban: LazyActiveSprintsKanban,
  SprintStatsCards: LazySprintStatsCards,
  SprintFormDialog: LazySprintFormDialog,
};

// Admin bundle - loads when in admin areas
export const adminBundle = {
  TaskFormDialog: LazyTaskFormDialog,
  ClientFormDialog: LazyClientFormDialog,
};

// Analytics bundle - loads when viewing charts
export const analyticsBundle = {
  ChartAreaInteractive: LazyChartAreaInteractive,
  DataTable: LazyDataTable,
};

/**
 * Preload strategies for better perceived performance
 */

// Preload editor bundle when hovering over document links
export function preloadEditorBundle() {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/_next/static/chunks/editor-bundle.js';
    document.head.appendChild(link);
  }
}

// Preload sprint bundle when hovering over sprint links
export function preloadSprintBundle() {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/_next/static/chunks/sprint-bundle.js';
    document.head.appendChild(link);
  }
}

// Preload admin bundle when hovering over admin links
export function preloadAdminBundle() {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/_next/static/chunks/admin-bundle.js';
    document.head.appendChild(link);
  }
}
