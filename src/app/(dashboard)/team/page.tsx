'use client';

import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { useAuth } from '@/lib/auth-hooks';
import { SiteHeader } from '@/components/site-header';
import { TeamStatsCards } from '@/components/team/TeamStatsCards';
import { TeamMembersTable } from '@/components/team/TeamMembersTable';
import { TeamMemberDetailsModal } from '@/components/team/TeamMemberDetailsModal';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IconSearch } from '@tabler/icons-react';

export default function TeamPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | Id<'clients'>>('all');
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Removed client filter (client users removed)

  // Team overview data
  const teamData = useQuery(api.users.getTeamOverview, {});

  const filteredMembers = (teamData?.members || [])
    // Exclude client-role users for safety in UI as well
    .filter((member) => (member.role || '').toLowerCase() !== 'client')
    .filter((member) =>
      (member.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

  if (!user || !["admin", "pm"].includes(user.role as string)) {
    return <div className="p-6">Access denied. Team view is only available for administrators and project managers.</div>;
  }

  return (
    <>
      <SiteHeader user={user} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Capacity</h1>
            <p className="text-slate-600 dark:text-slate-300">Manage team capacity and workload distribution</p>
          </div>
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