import { IconTrendingDown, IconTrendingUp, IconUsers, IconFolder, IconListDetails, IconFileDescription } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
  user: User;
}

export function SectionCards({ user }: SectionCardsProps) {
  const getRoleBasedCards = (role?: string) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: "Total Users",
            value: "24",
            description: "System Users",
            trend: "+3 this month",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "User management active",
            icon: IconUsers,
          },
          {
            title: "Active Clients",
            value: "8",
            description: "Client Organizations",
            trend: "+2 this quarter",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Client growth steady",
            icon: IconFolder,
          },
          {
            title: "Departments",
            value: "15",
            description: "Active Departments",
            trend: "Stable",
            trendIcon: IconTrendingUp,
            trendType: "neutral" as const,
            footer: "Department structure optimized",
            icon: IconListDetails,
          },
          {
            title: "System Health",
            value: "98.5%",
            description: "Uptime",
            trend: "+0.5%",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Performance excellent",
            icon: IconTrendingUp,
          },
        ];

      case 'pm':
        return [
          {
            title: "Active Projects",
            value: "12",
            description: "Projects in Progress",
            trend: "+2 this month",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Project pipeline healthy",
            icon: IconFolder,
          },
          {
            title: "Open Tasks",
            value: "47",
            description: "Pending Tasks",
            trend: "-8 completed",
            trendIcon: IconTrendingDown,
            trendType: "positive" as const,
            footer: "Good completion rate",
            icon: IconListDetails,
          },
          {
            title: "Team Members",
            value: "18",
            description: "Active Contributors",
            trend: "+1 this week",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Team capacity growing",
            icon: IconUsers,
          },
          {
            title: "Sprint Progress",
            value: "73%",
            description: "Current Sprint",
            trend: "On track",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Meeting sprint goals",
            icon: IconTrendingUp,
          },
        ];

      case 'task_owner':
        return [
          {
            title: "My Tasks",
            value: "8",
            description: "Assigned to Me",
            trend: "3 due this week",
            trendIcon: IconListDetails,
            trendType: "neutral" as const,
            footer: "Manageable workload",
            icon: IconListDetails,
          },
          {
            title: "Completed",
            value: "23",
            description: "This Month",
            trend: "+5 vs last month",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Productivity increasing",
            icon: IconTrendingUp,
          },
          {
            title: "Projects",
            value: "4",
            description: "Active Projects",
            trend: "Contributing to",
            trendIcon: IconFolder,
            trendType: "neutral" as const,
            footer: "Good project diversity",
            icon: IconFolder,
          },
          {
            title: "Collaboration",
            value: "12",
            description: "Team Interactions",
            trend: "+3 this week",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Active team member",
            icon: IconUsers,
          },
        ];

      case 'client':
        return [
          {
            title: "My Projects",
            value: "3",
            description: "Active Projects",
            trend: "1 nearing completion",
            trendIcon: IconFolder,
            trendType: "positive" as const,
            footer: "Projects progressing well",
            icon: IconFolder,
          },
          {
            title: "Deliverables",
            value: "7",
            description: "Pending Review",
            trend: "2 ready for feedback",
            trendIcon: IconFileDescription,
            trendType: "neutral" as const,
            footer: "Review needed",
            icon: IconFileDescription,
          },
          {
            title: "Timeline",
            value: "85%",
            description: "On Schedule",
            trend: "Meeting milestones",
            trendIcon: IconTrendingUp,
            trendType: "positive" as const,
            footer: "Timeline adherence good",
            icon: IconTrendingUp,
          },
          {
            title: "Feedback",
            value: "4",
            description: "Pending Responses",
            trend: "2 urgent",
            trendIcon: IconTrendingDown,
            trendType: "attention" as const,
            footer: "Action required",
            icon: IconUsers,
          },
        ];

      default:
        return [
          {
            title: "Getting Started",
            value: "0",
            description: "Role Not Assigned",
            trend: "Contact admin",
            trendIcon: IconUsers,
            trendType: "neutral" as const,
            footer: "Role assignment needed",
            icon: IconUsers,
          },
        ];
    }
  };

  const cards = getRoleBasedCards(user.role);

  const getTrendColor = (type: 'positive' | 'negative' | 'neutral' | 'attention') => {
    switch (type) {
      case 'positive': return 'text-green-600 dark:text-green-400';
      case 'negative': return 'text-red-600 dark:text-red-400';
      case 'attention': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card, index) => (
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
      ))}
    </div>
  )
}
