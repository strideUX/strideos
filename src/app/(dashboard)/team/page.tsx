'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { useAuth } from '@/components/providers/AuthProvider';
import { SiteHeader } from '@/components/site-header';
import { TeamStatsCards } from '@/components/team/TeamStatsCards';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { TeamMemberDetailsModal } from '@/components/team/TeamMemberDetailsModal';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { IconSearch } from '@tabler/icons-react';

export default function TeamPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Clients for filter
  const clients = useQuery(api.clients.listClients, {});

  // Team overview data
  const teamData = useQuery(api.users.getTeamOverview, {
    clientId: selectedClient === 'all' ? undefined : (selectedClient as any),
  });

  const filteredMembers = teamData?.members?.filter((member: any) =>
    (member.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.role || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (!user || !["admin", "pm"].includes(user.role as string)) {
    return <div className="p-6">Access denied. Team view is only available for administrators and project managers.</div>;
  }

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">Manage team capacity and workload distribution</p>
        </div>

        <TeamStatsCards stats={teamData?.stats} />

        <div className="flex gap-4">
              <div className="relative flex-1">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search team members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {(clients || []).map((client: any) => (
                    <SelectItem key={client._id} value={client._id as any}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

        <TeamMembersTable members={filteredMembers} onViewDetails={(memberId: string) => setSelectedMember(memberId)} />
      </div>

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