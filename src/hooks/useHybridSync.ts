import { useEffect } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Basic hybrid sync foundation (non-destructive): logs what would be synced
export function useHybridSync(yDoc: any, documentId?: string, sectionId?: string): void {
	// Prefer section-level content update when enabled in the future
	const updateSection = useMutation(api.documentSections.updateDocumentSectionContent);

	useEffect(() => {
		const syncTimer = setInterval(async () => {
			if (!yDoc || !documentId || !sectionId) return;

			try {
				const content = typeof yDoc.toJSON === 'function' ? yDoc.toJSON() : null;
				const payloadInfo = {
					documentId,
					sectionId,
					contentLength: content ? JSON.stringify(content).length : 0,
					timestamp: new Date().toISOString(),
				};
				// Logging only for now
				// eslint-disable-next-line no-console
				console.log('Hybrid sync (dry-run):', payloadInfo);

				// When ready to enable real sync, uncomment below
				// await updateSection({
				//   sectionId: sectionId as any,
				//   content,
				// });
			} catch (error) {
				// eslint-disable-next-line no-console
				console.warn('Sync would have failed:', error);
			}
		}, 30000);

		return () => clearInterval(syncTimer);
	}, [yDoc, documentId, sectionId, updateSection]);
}
