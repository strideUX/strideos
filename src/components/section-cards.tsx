/**
 * SectionCards - Role-based dashboard cards component
 *
 * @remarks
 * Displays contextual dashboard cards based on user role, showing relevant metrics,
 * trends, and status information. Each role (admin, pm, task_owner, client) sees
 * different cards tailored to their responsibilities and access level.
 *
 * @example
 * ```tsx
 * <SectionCards user={currentUser} />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';
import { 
  IconTrendingDown, 
  IconTrendingUp, 
  IconUsers, 
  IconFolder, 
  IconListDetails, 
  IconFileDescription 
} from '@tabler/icons-react';

// 2. Internal imports
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

interface SectionCardsProps {
  /** User data to determine role-based card display */
  user: User;
}

interface DashboardCard {
  title: string;
  value: string;
  description: string;
  trend: string;
  trendIcon: React.ComponentType<{ className?: string }>;
  trendType: 'positive' | 'negative' | 'neutral' | 'attention';
  footer: string;
  icon: React.ComponentType<{ className?: string }>;
}

// 4. Component definition
export const SectionCards = memo(function SectionCards({ 
  user 
}: SectionCardsProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const cards = useMemo((): DashboardCard[] => {
    switch (user.role) {
      case 'admin':
        return [
          {
            title: 'Total Users',
            value: '24',
            description: 'System Users',
            trend: '+3 this month',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'User management active',
            icon: IconUsers,
          },
          {
            title: 'Active Clients',
            value: '8',
            description: 'Client Organizations',
            trend: '+2 this quarter',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Client growth steady',
            icon: IconFolder,
          },
          {
            title: 'Departments',
            value: '15',
            description: 'Active Departments',
            trend: 'Stable',
            trendIcon: IconTrendingUp,
            trendType: 'neutral',
            footer: 'Department structure optimized',
            icon: IconListDetails,
          },
          {
            title: 'System Health',
            value: '98.5%',
            description: 'Uptime',
            trend: '+0.5%',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Performance excellent',
            icon: IconTrendingUp,
          },
        ];

      case 'pm':
        return [
          {
            title: 'Active Projects',
            value: '12',
            description: 'Projects in Progress',
            trend: '+2 this month',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Project pipeline healthy',
            icon: IconFolder,
          },
          {
            title: 'Open Tasks',
            value: '47',
            description: 'Pending Tasks',
            trend: '-8 completed',
            trendIcon: IconTrendingDown,
            trendType: 'positive',
            footer: 'Good completion rate',
            icon: IconListDetails,
          },
          {
            title: 'Team Members',
            value: '18',
            description: 'Active Contributors',
            trend: '+1 this week',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Team capacity growing',
            icon: IconUsers,
          },
          {
            title: 'Sprint Progress',
            value: '73%',
            description: 'Current Sprint',
            trend: 'On track',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Meeting sprint goals',
            icon: IconTrendingUp,
          },
        ];

      case 'task_owner':
        return [
          {
            title: 'My Tasks',
            value: '8',
            description: 'Assigned to Me',
            trend: '3 due this week',
            trendIcon: IconListDetails,
            trendType: 'neutral',
            footer: 'Manageable workload',
            icon: IconListDetails,
          },
          {
            title: 'Completed',
            value: '23',
            description: 'This Month',
            trend: '+5 vs last month',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Productivity increasing',
            icon: IconTrendingUp,
          },
          {
            title: 'Projects',
            value: '4',
            description: 'Active Projects',
            trend: 'Contributing to',
            trendIcon: IconFolder,
            trendType: 'neutral',
            footer: 'Good project diversity',
            icon: IconFolder,
          },
          {
            title: 'Collaboration',
            value: '12',
            description: 'Team Interactions',
            trend: '+3 this week',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Active team member',
            icon: IconUsers,
          },
        ];

      case 'client':
        return [
          {
            title: 'My Projects',
            value: '3',
            description: 'Active Projects',
            trend: '1 nearing completion',
            trendIcon: IconFolder,
            trendType: 'positive',
            footer: 'Projects progressing well',
            icon: IconFolder,
          },
          {
            title: 'Deliverables',
            value: '7',
            description: 'Pending Review',
            trend: '2 ready for feedback',
            trendIcon: IconFileDescription,
            trendType: 'neutral',
            footer: 'Review needed',
            icon: IconFileDescription,
          },
          {
            title: 'Timeline',
            value: '85%',
            description: 'On Schedule',
            trend: 'Meeting milestones',
            trendIcon: IconTrendingUp,
            trendType: 'positive',
            footer: 'Timeline adherence good',
            icon: IconTrendingUp,
          },
          {
            title: 'Feedback',
            value: '4',
            description: 'Pending Responses',
            trend: '2 urgent',
            trendIcon: IconTrendingDown,
            trendType: 'attention',
            footer: 'Action required',
            icon: IconUsers,
          },
        ];

      default:
        return [
          {
            title: 'Getting Started',
            value: '0',
            description: 'Role Not Assigned',
            trend: 'Contact admin',
            trendIcon: IconUsers,
            trendType: 'neutral',
            footer: 'Role assignment needed',
            icon: IconUsers,
          },
        ];
    }
  }, [user.role]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const getTrendColor = useCallback((type: DashboardCard['trendType']): string => {
    switch (type) {
      case 'positive': 
        return 'text-green-600 dark:text-green-400';
      case 'negative': 
        return 'text-red-600 dark:text-red-400';
      case 'attention': 
        return 'text-orange-600 dark:text-orange-400';
      default: 
        return 'text-muted-foreground';
    }
  }, []);

  const renderCard = useCallback((card: DashboardCard, index: number) => (
    <Card key={index} className="@container/card">
      <CardHeader>
        <CardDescription>{card.description}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {card.value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={getTrendColor(card.trendType)}>
            <card.trendIcon className="w-3 h-3" />
            {card.trend}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {card.title} <card.icon className="size-4" />
        </div>
        <div className="text-muted-foreground">
          {card.footer}
        </div>
      </CardFooter>
    </Card>
  ), [getTrendColor]);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => renderCard(card, index))}
    </div>
  );
});
