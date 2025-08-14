'use client';

import { useEffect, useState } from 'react';
import { useYjsProvider } from '@y-sweet/react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface PresenceUser {
	id?: string;
	name?: string;
	displayName?: string;
	color?: string;
	image?: string;
}

export function AvatarPresenceList({ className }: { className?: string }) {
	const provider = useYjsProvider();
	const [users, setUsers] = useState<PresenceUser[]>([]);

	useEffect(() => {
		const awareness = (provider as any)?.awareness;
		if (!awareness) return;

		const readStates = () => {
			const states = awareness.getStates();
			const next: PresenceUser[] = [];
			states.forEach((state: any, clientId: number) => {
				// Don't show self in the list
				if (clientId === awareness.clientID) return;
				if (state?.user) next.push(state.user);
			});
			setUsers(next);
		};

		readStates();
		const onChange = () => readStates();
		awareness.on('change', onChange);

		return () => {
			awareness.off('change', onChange);
		};
	}, [provider]);

	if (!users.length) {
		return null;
	}

	const displayUsers = users.slice(0, 5);
	const remainingCount = users.length - 5;

	return (
		<TooltipProvider>
			<div className={cn('flex items-center -space-x-2', className)}>
				{displayUsers.map((user, idx) => (
					<Tooltip key={`${user.id || idx}`}>
						<TooltipTrigger asChild>
							<Avatar
								className="h-8 w-8 border-2 transition-transform hover:z-10 hover:scale-110"
								style={{ borderColor: user.color || '#6B7280' }}
							>
								<AvatarImage src={user.image} alt={user.displayName || user.name} />
								<AvatarFallback className="text-xs">
									{(user.displayName || user.name || 'A').slice(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						</TooltipTrigger>
						<TooltipContent>
							<p>{user.displayName || user.name || 'Anonymous'}</p>
						</TooltipContent>
					</Tooltip>
				))}
				{remainingCount > 0 && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Avatar className="h-8 w-8 border-2 border-muted-foreground">
								<AvatarFallback className="text-xs bg-muted">+{remainingCount}</AvatarFallback>
							</Avatar>
						</TooltipTrigger>
						<TooltipContent>
							<p>
								{remainingCount} more {remainingCount === 1 ? 'user' : 'users'}
							</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</TooltipProvider>
	);
}
