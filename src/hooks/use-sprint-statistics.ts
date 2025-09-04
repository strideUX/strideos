import { useMemo } from 'react';
import type { Doc } from '@/convex/_generated/dataModel';

export interface SprintStatistics {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  averageVelocity: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  capacityUtilization: number;
  averageSprintDuration: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  todoTasks: number;
}

export interface UseSprintStatisticsProps {
  sprints?: Doc<'sprints'>[];
  tasks?: Doc<'tasks'>[];
}

/**
 * Hook to calculate comprehensive sprint statistics
 * Extracts all calculation logic from sprint statistics components
 */
export function useSprintStatistics({ sprints, tasks }: UseSprintStatisticsProps): SprintStatistics | null {
  return useMemo(() => {
    if (!sprints || !tasks) return null;

    const total = sprints.length;
    const active = sprints.filter(s => s.status === 'active').length;
    const completed = sprints.filter(s => s.status === 'complete').length;
    const onHold = sprints.filter(s => s.status === 'planning').length;

    // Velocity calculations
    const velocitySum = sprints
      .filter(s => s.status === 'complete')
      .reduce((sum, s) => sum + (s.actualVelocity || 0), 0);
    const averageVelocity = completed > 0 ? velocitySum / completed : 0;

    // Story points calculations
    const totalStoryPoints = sprints.reduce((sum, s) => sum + (s.committedPoints || 0), 0);
    const completedStoryPoints = sprints
      .filter(s => s.status === 'complete')
      .reduce((sum, s) => sum + (s.completedPoints || 0), 0);

    // Capacity utilization
    const capacityUtilization = total > 0 ? (completed / total) * 100 : 0;

    // Sprint duration calculations
    const completedSprints = sprints.filter(s => s.status === 'complete' && s.startDate && s.endDate);
    const totalDuration = completedSprints.reduce((sum, s) => {
      const start = new Date(s.startDate!);
      const end = new Date(s.endDate!);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24); // days
    }, 0);
    const averageSprintDuration = completedSprints.length > 0 ? totalDuration / completedSprints.length : 0;

    // Task statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => ['done', 'completed'].includes(t.status)).length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const reviewTasks = tasks.filter(t => t.status === 'review').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    return {
      total,
      active,
      completed,
      onHold,
      averageVelocity,
      totalStoryPoints,
      completedStoryPoints,
      capacityUtilization,
      averageSprintDuration,
      totalTasks,
      completedTasks,
      inProgressTasks,
      reviewTasks,
      todoTasks,
    };
  }, [sprints, tasks]);
}
