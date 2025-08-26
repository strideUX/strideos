/**
 * SprintsTable - Comprehensive table component for displaying and managing sprints
 *
 * @remarks
 * Displays sprint information in a table format with filtering, progress indicators,
 * and action menus. Supports status filtering, date formatting, and capacity calculations.
 * Integrates with sprint management workflow for editing and detailed views.
 *
 * @example
 * ```tsx
 * <SprintsTable
 *   sprints={sprintList}
 *   onEditSprint={handleEdit}
 *   onViewDetails={handleView}
 *   statusFilter="active"
 * />
 * ```
 */

// 1. External imports
import React, { useMemo, useCallback, memo } from 'react';

// 2. Internal imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { IconDotsVertical } from "@tabler/icons-react";
import { toast } from "sonner";

// 3. Types
interface SprintRow {
  _id: string;
  name: string;
  status: string;
  progressPercentage?: number;
  completedTasks?: number;
  totalTasks?: number;
  committedHours?: number;
  capacityHours?: number;
  totalCapacity?: number;
  startDate?: number;
  endDate?: number;
  department?: { name: string };
  client?: { name: string };
}

interface SprintsTableProps {
  /** List of sprints to display */
  sprints?: SprintRow[] | null;
  /** Callback for editing a sprint */
  onEditSprint?: (sprint: SprintRow) => void;
  /** Callback for viewing sprint details */
  onViewDetails?: (sprint: SprintRow) => void;
  /** Table title */
  title?: string;
  /** Table description */
  description?: string;
  /** Filter by sprint status */
  statusFilter?: 'planning' | 'active' | 'review' | 'complete' | 'cancelled' | 'completed';
}

// 4. Component definition
export const SprintsTable = memo(function SprintsTable({
  sprints,
  onEditSprint,
  onViewDetails,
  title = 'All Sprints',
  description = 'Overview of all sprints',
  statusFilter,
}: SprintsTableProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (Already done in function parameters)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  // (No custom hooks needed)

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  const filteredSprints = useMemo(() => {
    if (!statusFilter) return sprints ?? [];
    const normalized = statusFilter === 'completed' ? 'complete' : statusFilter;
    return (sprints ?? []).filter((s) => s.status === normalized);
  }, [sprints, statusFilter]);

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleSlugCopy = useCallback(async (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(slug);
      toast.success('ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy ID');
    }
  }, []);

  const formatHoursAsDays = useCallback((h?: number) => {
    const hours = Math.max(0, Math.round((h ?? 0) * 10) / 10);
    const d = hours / 8;
    const roundedHalf = Math.round(d * 2) / 2;
    return `${roundedHalf}d`;
  }, []);

  const getStatusBadgeClass = useCallback((status: string): string => {
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
  }, []);

  const formatDate = useCallback((ts?: number): string => {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }, []);

  // === 5. EFFECTS (useEffect for side effects) ===
  // (No side effects needed)

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Timeline</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSprints.map((sprint) => (
              <TableRow key={sprint._id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewDetails?.(sprint)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span>{sprint.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleSlugCopy(sprint._id, e)}
                      className="h-6 w-6 p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Copy ID
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(sprint.status)}>
                    {sprint.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      {sprint.completedTasks ?? 0}/{sprint.totalTasks ?? 0} tasks
                    </div>
                    {sprint.progressPercentage !== undefined && (
                      <Progress value={sprint.progressPercentage} className="h-2" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatHoursAsDays(sprint.committedHours)} / {formatHoursAsDays(sprint.totalCapacity)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {sprint.department?.name || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {sprint.client?.name || '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <IconDotsVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditSprint && (
                        <DropdownMenuItem onClick={() => onEditSprint(sprint)}>
                          Edit Sprint
                        </DropdownMenuItem>
                      )}
                      {onViewDetails && (
                        <DropdownMenuItem onClick={() => onViewDetails(sprint)}>
                          View Details
                        </DropdownMenuItem>
                      )}
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
});


