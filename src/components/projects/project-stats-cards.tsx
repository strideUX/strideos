/**
 * ProjectStatsCards - Statistical overview cards for project metrics and performance
 *
 * @remarks
 * Displays key project statistics including total counts, on-track projects, at-risk projects,
 * and average progress. Provides visual indicators and descriptions for each metric.
 * Integrates with project management workflow for performance monitoring and reporting.
 *
 * @example
 * ```tsx
 * <ProjectStatsCards stats={projectStatistics} />
 * ```
 */

// 1. External imports
import React, { useMemo, memo } from 'react';
import { IconFolder, IconCircleCheck, IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react';

// 2. Internal imports
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// 3. Types
interface ProjectStats {
  /** Total number of projects */
  totalProjects: number;
  /** Number of projects on track */
  onTrackProjects: number;
  /** Number of projects at risk */
  atRiskProjects: number;
  /** Average progress percentage */
  avgProgress: number;
}

interface ProjectStatsCardsProps {
  /** Project statistics data to display */
  stats: ProjectStats;
}

// 4. Component definition
export const ProjectStatsCards = memo(function ProjectStatsCards({ 
  stats 
}: ProjectStatsCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const statCards = useMemo(() => [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      description: 'All active projects',
      icon: <IconFolder className="h-4 w-4 text-muted-foreground" />,
      valueClass: 'text-2xl font-bold',
      descriptionClass: 'text-xs text-muted-foreground'
    },
    {
      title: 'On Track',
      value: stats.onTrackProjects,
      description: 'Ready for work or in progress',
      icon: <IconCircleCheck className="h-4 w-4 text-green-600" />,
      valueClass: 'text-2xl font-bold text-green-600',
      descriptionClass: 'text-xs text-muted-foreground'
    },
    {
      title: 'At Risk',
      value: stats.atRiskProjects,
      description: 'In review or approaching due date',
      icon: <IconAlertTriangle className="h-4 w-4 text-yellow-600" />,
      valueClass: 'text-2xl font-bold text-yellow-600',
      descriptionClass: 'text-xs text-muted-foreground'
    },
    {
      title: 'Avg Progress',
      value: `${stats.avgProgress}%`,
      description: 'Task completion rate',
      icon: <IconTrendingUp className="h-4 w-4 text-blue-600" />,
      valueClass: 'text-2xl font-bold text-blue-600',
      descriptionClass: 'text-xs text-muted-foreground'
    }
  ], [stats]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  // (No callbacks needed)

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            {card.icon}
          </CardHeader>
          <CardContent>
            <div className={card.valueClass}>{card.value}</div>
            <p className={card.descriptionClass}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
