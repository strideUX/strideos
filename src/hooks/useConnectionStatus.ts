import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGracefulYSweet, ConnectionState as YSweetConnectionState } from '@/hooks/useGracefulYSweet';

export type ConnectionState = 'loading' | 'connected' | 'connecting' | 'disconnected' | 'failed' | 'reconnecting';

export interface ConnectionStatus {
	ysweet: ConnectionState;
	convex: ConnectionState;
	activeSync: 'ysweet' | 'convex-only' | 'local-only';
	lastSync: number;
	retryCount: number;
}

interface UseConnectionStatusOptions {
	provider?: unknown;
}

interface ConnectionStatusActions {
	markConvexSynced: () => void;
	setConvexState: (state: ConnectionState) => void;
}

export function useConnectionStatus({ provider }: UseConnectionStatusOptions): [ConnectionStatus, ConnectionStatusActions] {
	const { status: ysweet, retryCount, connect, disconnect } = useGracefulYSweet({ provider });
	const [convex, setConvex] = useState<ConnectionState>(typeof navigator !== 'undefined' && navigator.onLine ? 'connected' : 'disconnected');
	const [lastSync, setLastSync] = useState<number>(Date.now());
	const mounted = useRef<boolean>(false);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

	useEffect(() => {
		const onOnline = () => setConvex('connected');
		const onOffline = () => setConvex('disconnected');
		window.addEventListener('online', onOnline);
		window.addEventListener('offline', onOffline);
		return () => {
			window.removeEventListener('online', onOnline);
			window.removeEventListener('offline', onOffline);
		};
	}, []);

	const activeSync: 'ysweet' | 'convex-only' | 'local-only' = useMemo(() => {
		if (ysweet === 'connected') return 'ysweet';
		if (convex === 'connected') return 'convex-only';
		return 'local-only';
	}, [ysweet, convex]);

	const markConvexSynced = useCallback(() => setLastSync(Date.now()), []);

	const status: ConnectionStatus = useMemo(() => ({
		ysweet: ysweet as ConnectionState,
		convex,
		activeSync,
		lastSync,
		retryCount,
	}), [ysweet, convex, activeSync, lastSync, retryCount]);

	return [status, { markConvexSynced, setConvexState: setConvex }];
}
