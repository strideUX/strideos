export function getLocalBufferKey(documentId?: string, sectionId?: string): string {
	return `doc:${documentId || 'unknown'}:section:${sectionId || 'unknown'}:buffer`;
}

export function saveToLocalBuffer(content: unknown, documentId?: string, sectionId?: string): void {
	try {
		const key = getLocalBufferKey(documentId, sectionId);
		localStorage.setItem(key, JSON.stringify({ content, ts: Date.now() }));
	} catch {
		// ignore storage errors
	}
}

export function readFromLocalBuffer(documentId?: string, sectionId?: string): { content: unknown; ts: number } | null {
	try {
		const key = getLocalBufferKey(documentId, sectionId);
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function clearLocalBuffer(documentId?: string, sectionId?: string): void {
	try {
		const key = getLocalBufferKey(documentId, sectionId);
		localStorage.removeItem(key);
	} catch {
		// ignore
	}
}

export function getExponentialBackoffMs(attempt: number, baseMs = 30000, maxMs = 5 * 60 * 1000): number {
	const ms = baseMs * Math.pow(2, Math.max(0, attempt - 1));
	return Math.min(ms, maxMs);
}
