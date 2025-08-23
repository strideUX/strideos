"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { IconDots } from '@tabler/icons-react';

interface TeamMember {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  jobTitle?: string;
  status?: string;
  location?: string;
  phone?: string;
  image?: string;
  avatarUrl?: string;
  department?: { name: string };
  departments?: Array<{ name: string }>;
  projects?: number;
  totalTasks?: number;
  workloadPercentage?: number;
}

interface TeamMembersTableProps {
  members: TeamMember[];
  onViewDetails: (memberId: string) => void;
}

export function TeamMembersTable({ members, onViewDetails }: TeamMembersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>All team members and their current workload</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Member</TableHead>
              <TableHead className="font-bold">Role</TableHead>
              <TableHead className="font-bold">Capacity</TableHead>
              <TableHead className="font-bold">Projects</TableHead>
              <TableHead className="font-bold">Tasks</TableHead>
              <TableHead className="font-bold">Workload</TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(members || []).map((member) => (
              <TableRow
                key={member._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onViewDetails(member._id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(member._id);
                  }
                }}
                title="View details"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image || member.avatarUrl} />
                      <AvatarFallback>
                        {(member.name || member.email || 'U')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{member.name || member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{member.jobTitle || member.role}</TableCell>
                <TableCell>
                  <span className="text-sm">{(member as any).totalHours ?? 0}h</span>
                </TableCell>
                <TableCell>{member.projects ?? 0}</TableCell>
                <TableCell>{member.totalTasks ?? 0}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={member.workloadPercentage ?? 0} className="w-20 h-2" />
                    <span className={`text-sm font-medium ${
                      (member.workloadPercentage ?? 0) >= 80 ? 'text-yellow-600' : ''
                    }`}>
                      {member.workloadPercentage ?? 0}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{member.email}</TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <IconDots className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewDetails(member._id)}>
                        View Details
                      </DropdownMenuItem>
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
