import { useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { ConnectionStatus } from '@/hooks/useConnectionStatus';
import { clearLocalBuffer, readFromLocalBuffer, saveToLocalBuffer } from '@/lib/sync-strategies';

export interface HybridSyncOptions {
	yDoc?: { toJSON?: () => unknown } | null;
	documentId?: string;
	sectionId?: string;
	connectionStatus: ConnectionStatus;
	getCurrentContent: () => unknown;
	enableConvexBackup?: boolean;
	enableLocalBuffer?: boolean;
	onConvexSynced?: (timestamp: number) => void;
}

// Multi-layer hybrid sync
export function useHybridSync({ yDoc, documentId, sectionId, connectionStatus, getCurrentContent, enableConvexBackup = true, enableLocalBuffer = true, onConvexSynced }: HybridSyncOptions): void {
	const updateSection = useMutation(api.documentSections.updateDocumentSectionContent);
	const lastFlushedRef = useRef<number>(0);

	// Periodic backup to Convex every 30s when Y-sweet is unavailable or as a background safety
	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				if (!documentId || !sectionId) return;
				const content = getCurrentContent();

				if (connectionStatus.activeSync === 'ysweet') {
					// Optional background backup
					if (!enableConvexBackup) return;
				}

				if (connectionStatus.activeSync === 'convex-only' || (connectionStatus.activeSync === 'ysweet' && enableConvexBackup)) {
					console.log('Saving to Convex - Section:', sectionId, 'Content blocks:', Array.isArray(content) ? content.length : 'unknown');
					await updateSection({ sectionId: sectionId as any, content });
					lastFlushedRef.current = Date.now();
					onConvexSynced?.(lastFlushedRef.current);
				}
			} catch (error) {
				console.error('Error saving to Convex:', error);
			}
		}, 30000);

		return () => clearInterval(interval);
	}, [documentId, sectionId, connectionStatus.activeSync, updateSection, getCurrentContent, enableConvexBackup]);

	// Local buffer when offline
	useEffect(() => {
		if (!enableLocalBuffer) return;
		if (connectionStatus.activeSync !== 'local-only') return;

		const bufferTimer = setInterval(() => {
			try {
				const content = getCurrentContent();
				saveToLocalBuffer(content, documentId, sectionId);
			} catch {
				// ignore
			}
		}, 5000);

		return () => clearInterval(bufferTimer);
	}, [connectionStatus.activeSync, documentId, sectionId, getCurrentContent, enableLocalBuffer]);

	// Flush local buffer when we regain connectivity (Convex or Y-sweet)
	useEffect(() => {
		if (!documentId || !sectionId) return;
		if (connectionStatus.activeSync === 'local-only') return;
		const buffered = readFromLocalBuffer(documentId, sectionId);
		if (!buffered) return;

		(async () => {
			try {
				const content = buffered.content ?? getCurrentContent();
				await updateSection({ sectionId: sectionId as any, content });
				clearLocalBuffer(documentId, sectionId);
				lastFlushedRef.current = Date.now();
				onConvexSynced?.(lastFlushedRef.current);
			} catch {
				// keep buffer for next attempt
			}
		})();
	}, [connectionStatus.activeSync, documentId, sectionId, updateSection, getCurrentContent]);
}
