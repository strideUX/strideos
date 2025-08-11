"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconDotsVertical } from "@tabler/icons-react";

type SprintRow = any;

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "complete":
      return "bg-green-100 text-green-800 border-transparent";
    case "active":
      return "bg-blue-100 text-blue-800 border-transparent";
    case "planning":
      return "bg-yellow-100 text-yellow-800 border-transparent";
    case "cancelled":
      return "bg-red-100 text-red-800 border-transparent";
    case "review":
      return "bg-purple-100 text-purple-800 border-transparent";
    default:
      return "bg-gray-100 text-gray-800 border-transparent";
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function SprintsTable({
  sprints,
  onEditSprint,
  onViewDetails,
}: {
  sprints?: SprintRow[] | null;
  onEditSprint?: (sprint: SprintRow) => void;
  onViewDetails?: (sprint: SprintRow) => void;
}) {
  // Compute timeline range
  const allDates = (sprints ?? []).flatMap((s) => [s.startDate, s.endDate]).filter(Boolean) as number[];
  const minDate = allDates.length ? Math.min(...allDates) : Date.now();
  const maxDate = allDates.length ? Math.max(...allDates) : Date.now();
  const rangeMs = Math.max(1, maxDate - minDate);

  const getTimelinePosition = (sprint: any) => {
    const left = ((sprint.startDate - minDate) / rangeMs) * 100;
    const width = Math.max(2, ((sprint.endDate - sprint.startDate) / rangeMs) * 100);
    return { left: `${left}%`, width: `${width}%` } as React.CSSProperties;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Sprints</CardTitle>
        <CardDescription>Overview of all sprints</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sprint Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sprints ?? []).map((sprint) => (
              <TableRow
                key={sprint._id}
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => (sprint.status === 'planning' ? onEditSprint?.(sprint) : onViewDetails?.(sprint))}
              >
                <TableCell className="font-medium">{sprint.name}</TableCell>
                <TableCell>{sprint.department?.name}</TableCell>
                <TableCell>{sprint.client?.name}</TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(sprint.status)}>{sprint.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={sprint.progressPercentage ?? 0} className="w-20" />
                    <span className="text-sm">{sprint.progressPercentage ?? 0}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {sprint.completedTasks ?? 0}/{sprint.totalTasks ?? 0}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>
                      {(sprint.committedHours ?? 0)}/{sprint.capacityHours ?? sprint.totalCapacity ?? 0}h
                    </div>
                    <div className="text-muted-foreground">
                      {(() => {
                        const cap = sprint.capacityHours ?? sprint.totalCapacity ?? 0;
                        return cap ? Math.round(((sprint.committedHours ?? 0) / cap) * 100) : 0;
                      })()}%
                      {" "}utilized
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}</div>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditSprint?.(sprint)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewDetails?.(sprint)}>View Details</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


