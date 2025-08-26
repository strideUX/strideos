"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { IconDots, IconSearch, IconFilter } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';

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

interface TeamMembersTableProps {
  members: TeamMember[];
  onViewDetails: (memberId: string) => void;
}

export function TeamMembersTable({ members, onViewDetails }: TeamMembersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof TeamMember;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter members based on search term
  const filteredMembers = useMemo(() => {
    if (!searchTerm) return members;
    
    const searchLower = searchTerm.toLowerCase();
    return members.filter(member =>
      (member.name || '').toLowerCase().includes(searchLower) ||
      (member.email || '').toLowerCase().includes(searchLower) ||
      (member.role || '').toLowerCase().includes(searchLower) ||
      (member.jobTitle || '').toLowerCase().includes(searchLower)
    );
  }, [members, searchTerm]);

  // Sort filtered members
  const sortedMembers = useMemo(() => {
    if (!sortConfig) return filteredMembers;

    return [...filteredMembers].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;
      
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredMembers, sortConfig]);

  // Calculate workload statistics
  const workloadStats = useMemo(() => {
    const totalMembers = members.length;
    const availableMembers = members.filter(m => (m.workloadPercentage || 0) < 80).length;
    const overloadedMembers = members.filter(m => (m.workloadPercentage || 0) >= 100).length;
    
    return {
      totalMembers,
      availableMembers,
      overloadedMembers,
    };
  }, [members]);

  const handleSort = useCallback((key: keyof TeamMember) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
        <CardDescription>All team members and their current workload</CardDescription>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Workload Summary */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Total: {workloadStats.totalMembers}</span>
            <span>Available: {workloadStats.availableMembers}</span>
            <span>Overloaded: {workloadStats.overloadedMembers}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                Member {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('role')}
              >
                Role {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalHours')}
              >
                Capacity {sortConfig?.key === 'totalHours' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('projects')}
              >
                Projects {sortConfig?.key === 'projects' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('totalTasks')}
              >
                Tasks {sortConfig?.key === 'totalTasks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead 
                className="font-bold cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('workloadPercentage')}
              >
                Workload {sortConfig?.key === 'workloadPercentage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="font-bold">Email</TableHead>
              <TableHead className="text-right font-bold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sortedMembers || []).map((member) => (
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
                  <span className="text-sm">{member.totalHours ?? 0}h</span>
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
