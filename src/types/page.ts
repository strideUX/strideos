export interface Page {
	_id: string;
	documentId: string;
	parentPageId?: string;
	docId: string;
	title: string;
	icon?: string;
	order: number;
	createdAt: number;
}

export interface PageOperations {
	renamePage: (pageId: string, title: string) => Promise<void>;
	reorderPage: (pageId: string, beforePageId?: string) => Promise<void>;
	removePage: (pageId: string) => Promise<void>;
	createSubpage: (parentPageId: string, title: string) => Promise<{ docId: string }>;
}
