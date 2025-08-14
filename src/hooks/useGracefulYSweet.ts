import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ConnectionState = 'loading' | 'connected' | 'connecting' | 'disconnected' | 'failed' | 'reconnecting';

interface GracefulYSweetOptions {
	provider?: unknown;
	baseRetryMs?: number;
	maxRetryMs?: number;
}

interface GracefulYSweetResult {
	status: ConnectionState;
	retryCount: number;
	connect: () => void;
	disconnect: () => void;
	resetBackoff: () => void;
}

function getBackoffMs(attempt: number, baseMs: number, maxMs: number): number {
	const ms = baseMs * Math.pow(2, Math.max(0, attempt - 1));
	return Math.min(ms, maxMs);
}

export function useGracefulYSweet({ provider, baseRetryMs = 30000, maxRetryMs = 5 * 60 * 1000 }: GracefulYSweetOptions): GracefulYSweetResult {
	const providerRef = useRef(provider as { on?: (...args: unknown[]) => void; off?: (...args: unknown[]) => void; connect?: () => void; disconnect?: () => void } | undefined);
	const [status, setStatus] = useState<ConnectionState>('loading');
	const [retryCount, setRetryCount] = useState<number>(0);
	const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hasEverConnected = useRef<boolean>(false);

	useEffect(() => {
		providerRef.current = provider as typeof providerRef.current;
	}, [provider]);

	const cleanupTimer = useCallback(() => {
		if (reconnectTimer.current) {
			clearTimeout(reconnectTimer.current);
			reconnectTimer.current = null;
		}
	}, []);

	const resetBackoff = useCallback(() => {
		setRetryCount(0);
		cleanupTimer();
	}, [cleanupTimer]);

	const scheduleReconnect = useCallback(() => {
		cleanupTimer();
		const delay = getBackoffMs(retryCount + 1, baseRetryMs, maxRetryMs);
		reconnectTimer.current = setTimeout(() => {
			try {
				providerRef.current?.connect?.();
				setStatus('connecting');
				setRetryCount((c) => c + 1);
			} catch {
				setStatus('failed');
			}
		}, delay);
	}, [retryCount, baseRetryMs, maxRetryMs, cleanupTimer]);

	const connect = useCallback(() => {
		try {
			providerRef.current?.connect?.();
			setStatus('connecting');
		} catch {
			setStatus('failed');
			scheduleReconnect();
		}
	}, [scheduleReconnect]);

	const disconnect = useCallback(() => {
		try {
			providerRef.current?.disconnect?.();
			setStatus('disconnected');
		} catch {
			// ignore
		}
	}, []);

	useEffect(() => {
		const p = providerRef.current;
		if (!p || typeof p.on !== 'function' || typeof p.off !== 'function') {
			// Provider not ready; schedule periodic attempts if any
			setStatus((s) => (s === 'loading' ? 'connecting' : s));
			return;
		}

		const onStatus = (event: { status: 'connected' | 'connecting' | 'disconnected' }) => {
			if (event.status === 'connected') {
				setStatus('connected');
				resetBackoff();
				hasEverConnected.current = true;
			} else if (event.status === 'connecting') {
				setStatus(hasEverConnected.current ? 'reconnecting' : 'connecting');
			} else if (event.status === 'disconnected') {
				setStatus(hasEverConnected.current ? 'reconnecting' : 'disconnected');
				scheduleReconnect();
			}
		};

		// Attach listener
		try {
			(p as { on: (event: string, cb: (...args: any[]) => void) => void }).on('status', onStatus);
		} catch {
			// ignore
		}

		return () => {
			cleanupTimer();
			try {
				(p as { off: (event: string, cb: (...args: any[]) => void) => void }).off('status', onStatus);
			} catch {
				// ignore
			}
		};
	}, [providerRef, scheduleReconnect, resetBackoff, cleanupTimer]);

	// Auto-start initial connection attempt
	useEffect(() => {
		if (status === 'loading' || status === 'disconnected' || status === 'failed') {
			connect();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return useMemo(() => ({ status, retryCount, connect, disconnect, resetBackoff }), [status, retryCount, connect, disconnect, resetBackoff]);
}
