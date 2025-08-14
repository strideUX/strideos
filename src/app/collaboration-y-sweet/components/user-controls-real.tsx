"use client";

import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface YSweetUser {
	id: string;
	name: string;
	color: string;
	role?: string;
	avatar?: string;
}

function generateUserColor(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
	const hue = Math.abs(hash) % 360;
	return `hsl(${hue}, 70%, 60%)`;
}

export function UserControlsReal({ currentUserId, onUserChange }: { currentUserId?: string; onUserChange: (id: string) => void }) {
	const currentUser = useQuery(api.users.getCurrentUser, {});
	const activeUsers = useQuery(api.users.getActiveUsers, {} as any);

	const availableUsers = useMemo<YSweetUser[]>(() => {
		const list = Array.isArray(activeUsers) ? activeUsers : [];
		const mapped = list.map((u: any) => ({
			id: String(u._id),
			name: u.name || 'Unnamed',
			color: generateUserColor(String(u._id)),
			role: u.role,
			avatar: u.image,
		}));
		// Ensure current user is present
		if (currentUser && !mapped.find(m => m.id === String((currentUser as any)._id))) {
			mapped.unshift({
				id: String((currentUser as any)._id),
				name: (currentUser as any).name || 'Me',
				color: generateUserColor(String((currentUser as any)._id)),
				role: (currentUser as any).role,
				avatar: (currentUser as any).image,
			});
		}
		return mapped;
	}, [activeUsers, currentUser]);

	const value = currentUserId || (currentUser ? String((currentUser as any)._id) : undefined);

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">Test as User</Label>
			<Select value={value} onValueChange={onUserChange}>
				<SelectTrigger>
					<SelectValue placeholder="Select user" />
				</SelectTrigger>
				<SelectContent>
					{availableUsers.map((user) => (
						<SelectItem key={user.id} value={user.id}>
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }} />
								{user.name} {user.role ? `(${user.role})` : ''}
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
