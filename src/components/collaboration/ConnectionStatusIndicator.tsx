"use client";

import { cn } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import type { ConnectionStatus } from '@/hooks/useConnectionStatus';

interface ConnectionStatusIndicatorProps {
	status: ConnectionStatus;
	className?: string;
}

export function ConnectionStatusIndicator({ status, className }: ConnectionStatusIndicatorProps) {
	const { activeSync, ysweet } = status;

	let icon = CheckCircle2;
	let message = 'Real-time collaboration active';
	let color = 'text-green-600';

	if (ysweet === 'reconnecting' || ysweet === 'connecting') {
		icon = RefreshCw;
		message = 'Reconnecting to collaboration server';
		color = 'text-yellow-600';
	} else if (activeSync === 'local-only') {
		icon = AlertTriangle;
		message = 'Offline mode - changes saved locally';
		color = 'text-orange-600';
	} else if (activeSync === 'convex-only' && ysweet !== 'connected') {
		icon = XCircle;
		message = 'Collaboration unavailable - using autosave';
		color = 'text-red-600';
	}

	const Icon = icon;
	return (
		<div className={cn('flex items-center gap-2', className)}>
			<Icon className={cn('h-4 w-4', color)} />
			<span className="text-sm">{message}</span>
		</div>
	);
}
