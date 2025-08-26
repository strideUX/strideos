"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { IconDotsVertical, IconUsers } from '@tabler/icons-react';
import { useState } from 'react';
import { TeamMemberDetailsModal } from '@/components/team/team-member-details-modal';

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
  totalHours?: number;
}

interface ClientTeamTableProps {
  members?: TeamMember[];
  isLoading?: boolean;
}

export function ClientTeamTable({ members, isLoading }: ClientTeamTableProps) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading team members...</div>
        </CardContent>
      </Card>
    );
  }

  if (!members || members.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <IconUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <h3 className="font-medium text-muted-foreground mb-2">No team members found</h3>
            <p className="text-sm text-muted-foreground">This client doesn&apos;t have any team members assigned yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All team members assigned to this client</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Workload</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow
                  key={member._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedMember(member._id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedMember(member._id);
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
                        <div className="text-sm text-muted-foreground">{member.location || 'Remote'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.jobTitle || member.role}</TableCell>
                  <TableCell>{member.department?.name || (member.departments?.[0]?.name ?? '-')}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {member.status || 'active'}
                    </Badge>
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
                  <TableCell>
                    <span className="text-sm">{member.totalHours ?? 0}h</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{member.email}</div>
                      <div className="text-muted-foreground">{member.phone || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedMember(member._id)}>
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

      {selectedMember && (
        <TeamMemberDetailsModal
          memberId={selectedMember}
          open={!!selectedMember}
          onOpenChange={(open: boolean) => !open && setSelectedMember(null)}
        />
      )}
    </>
  );
}