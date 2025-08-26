"use client";
import { useEffect, useMemo, useRef, useCallback, type ReactElement } from "react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController } from "@blocknote/react";
import "@blocknote/shadcn/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteEditor, nodeToBlock, filterSuggestionItems } from "@blocknote/core";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ConvexThreadStore } from "../comments/ConvexThreadStore";
import { useAuthToken } from "@convex-dev/auth/react";
import { useTiptapSync } from "@convex-dev/prosemirror-sync/tiptap";
import { createRemoteCursorPlugin } from "./plugins/remote-cursor-plugin";
import { customSchema, type CustomBlockNoteEditor } from "./blocks/custom-schema";
import { getCustomSlashMenuItems } from "./blocks/slash-menu-items";

interface BlockNoteEditorProps {
	docId: string;
	onEditorReady?: (editor: CustomBlockNoteEditor) => void;
	showRemoteCursors?: boolean;
}

export function BlockNoteEditorComponent({ docId, onEditorReady, showRemoteCursors = true }: BlockNoteEditorProps): ReactElement {
	const presence = useQuery(api.presence.list, { docId }) ?? [];
	const me = useQuery(api.comments.me, {});
	const userId = (me as any)?.userId ?? null;
	const userEmail = (me as any)?.email ?? null;
	const threadsForDoc = (useQuery(api.comments.listByDoc, { docId, includeResolved: true }) ?? []) as Array<{ thread: any; comments: any[] }>;
	
	// Get manual save content as fallback
	const manualSaveData = useQuery(api.manualSaves.get, { docId });

	// Keep latest presence in a ref so the plugin can read it without recreating the editor
	const presenceRef = useRef<any[]>(presence as any);
	useEffect(() => { 
		presenceRef.current = presence as any;
	}, [presence]);

	// Keep userId in a ref to avoid editor recreation
	const userIdRef = useRef<string | null>(null);
	useEffect(() => { 
		userIdRef.current = userId;
	}, [userId]);

	const presenceMap = useMemo(() => {
		const map: Record<string, { name: string; color: string }> = {};
		for (const p of presence as any[]) {
			map[(p as any).userId] = { name: (p as any).name, color: (p as any).color };
		}
		return map;
	}, [presence]);

	const presenceMapRef = useRef<Record<string, { name: string; color: string }>>({});
	useEffect(() => { presenceMapRef.current = presenceMap; }, [presenceMap]);

	// Stable resolveUsers that reads from the ref (no editor re-instantiation on presence change)
	const resolveUsers = useCallback(async (userIds: string[]): Promise<Array<{ id: string; username: string; avatarUrl: string }>> => {
		return userIds.map((id) => ({ id, username: presenceMapRef.current[id]?.name ?? "User", avatarUrl: "" }));
	}, []);

	const createThreadMutation = useMutation(api.comments.createThread);
	const addCommentMutation = useMutation(api.comments.createComment);
	const updateCommentMutation = useMutation(api.comments.updateComment);
	const deleteCommentMutation = useMutation(api.comments.deleteComment);
	const resolveThreadMutation = useMutation(api.comments.resolveThread);

	const threadStore = useMemo(() => new ConvexThreadStore(docId, {
		userId: userId || "current",
		createThread: ({ docId: d, blockId, content }) => createThreadMutation({ docId: d, blockId: blockId ?? "", content }) as any,
		createComment: ({ docId: d, blockId, threadId, content }) => addCommentMutation({ docId: d, blockId: blockId ?? "", threadId, content }) as any,
		updateComment: ({ commentId, content }) => updateCommentMutation({ commentId: commentId as any, content }) as any,
		deleteComment: ({ commentId }) => deleteCommentMutation({ commentId: commentId as any }) as any,
		resolveThread: ({ threadId, resolved }) => resolveThreadMutation({ threadId, resolved }) as any,
	}), [docId, createThreadMutation, addCommentMutation, updateCommentMutation, deleteCommentMutation, resolveThreadMutation]);

	// Create sync API object structure that useTiptapSync expects
	const syncApi = useMemo(() => ({
		getSnapshot: api.documentSyncApi.getSnapshot,
		submitSnapshot: api.documentSyncApi.submitSnapshot,
		latestVersion: api.documentSyncApi.latestVersion,
		getSteps: api.documentSyncApi.getSteps,
		submitSteps: api.documentSyncApi.submitSteps,
	}), []);

	const tiptapSync = useTiptapSync(syncApi, docId, { snapshotDebounceMs: 1000 });
	

	const editorFromSync = useMemo(() => {
		let initialBlocks: any[] = [];
		
		// FIRST PRIORITY: Manual save content (since sync is broken)
		if (manualSaveData?.content) {
			try {
				const savedBlocks = JSON.parse(manualSaveData.content);
				if (Array.isArray(savedBlocks) && savedBlocks.length > 0) {
					initialBlocks = savedBlocks;
				}
			} catch (error) {
			}
		}
		
		// SECOND PRIORITY: Sync content (only if no manual save)
		if (initialBlocks.length === 0 && tiptapSync.initialContent && typeof tiptapSync.initialContent === 'object') {
			// Headless editor for PM->BlockNote conversion only (no comments in headless)
			// The TipTap snapshot may include a PM mark type named "comment" which
			// doesn't exist in BlockNote's headless schema. Strip those marks first.
			function stripUnsupportedMarks(node: any): any {
				if (!node || typeof node !== "object") return node;
				const clone: any = { ...node };
				if (Array.isArray(clone.marks)) {
					clone.marks = clone.marks.filter((m: any) => m?.type !== "comment");
				}
				if (Array.isArray(clone.content)) {
					clone.content = clone.content.map(stripUnsupportedMarks);
				}
				return clone;
			}
			const cleanedInitial = stripUnsupportedMarks(tiptapSync.initialContent as any);
			const headless = BlockNoteEditor.create({ schema: customSchema, resolveUsers, _headless: true });
			const pmNode = headless.pmSchema.nodeFromJSON(cleanedInitial as any);
			if ((pmNode as any).firstChild) {
				(pmNode as any).firstChild.descendants((node: any) => {
					initialBlocks.push(nodeToBlock(node, headless.pmSchema));
					return false;
				});
			}
		}
		
		// If we still don't have content, wait for data to load
		if (tiptapSync.initialContent === null && manualSaveData === undefined) {
			return null; // Still loading
		}
		
		// Create editor config with optional comments
		const editorConfig: any = {
			schema: customSchema,
			resolveUsers,
			_tiptapOptions: {
				extensions: [tiptapSync.extension],
			},
			_extensions: {
				remoteCursors: () => ({ plugin: createRemoteCursorPlugin(() => {
					if (!showRemoteCursors) return [] as any[];
					const filtered = (presenceRef.current as any[]).filter(p => p.userId !== userIdRef.current);
					return filtered;
				}) }),
			},
			initialContent: initialBlocks.length > 0 ? initialBlocks : undefined,
		};
		
		// Only add comments if threadStore is properly initialized
		if (threadStore) {
			editorConfig.comments = { threadStore: threadStore as any };
		}
		
		return BlockNoteEditor.create(editorConfig);
	// Re-create when sync content, manual save data, or thread store changes
	}, [tiptapSync.initialContent, manualSaveData, resolveUsers, threadStore, showRemoteCursors]);

	const sync = useMemo(() => ({
		editor: editorFromSync,
		isLoading: tiptapSync.isLoading,
		create: tiptapSync.create,
	}), [editorFromSync, tiptapSync.isLoading, tiptapSync.create]);

	const token = useAuthToken();
	const colorRef = useRef<string>(`hsl(${Math.floor(Math.random() * 360)} 70% 45%)`);
	const nameRef = useRef<string>("User");
	
	// Update nameRef when user email becomes available
	useEffect(() => {
		if (userEmail && nameRef.current === "User") {
			nameRef.current = userEmail;
		}
	}, [userEmail]);
	
	const heartbeat = useMutation(api.presence.heartbeat);
	useEffect(() => {
		if (!token) return;
		let active = true;
		const color = colorRef.current;
		const name = nameRef.current;
		const interval = setInterval(() => {
			if (!active) return;
			const pos = (sync as any)?.editor?.prosemirrorState?.selection?.head ?? 0;
			heartbeat({ docId, cursor: String(pos), name, color }).catch(() => {});
		}, 1000);
		return () => { active = false; clearInterval(interval); };
	}, [docId, heartbeat, token, (sync as any)?.editor]);

	const editorInst = (sync as any)?.editor as CustomBlockNoteEditor | null;
	useEffect(() => {
		if (onEditorReady && editorInst) onEditorReady(editorInst);
	}, [editorInst, onEditorReady]);



	const lastMarkedRef = useRef<Set<string>>(new Set());
	useEffect(() => {
		if (!editorInst) return;
		const current = new Set<string>((threadsForDoc as any[]).map((t: any) => t.thread.blockId));
		for (const oldId of Array.from(lastMarkedRef.current)) {
			if (!current.has(oldId)) {
				const trySelectors = [
					`[data-id="${oldId}"]`,
					`[data-block-id="${oldId}"]`,
					`[data-node-id="${oldId}"]`,
				];
				for (const sel of trySelectors) {
					const el = document.querySelector(sel) as HTMLElement | null;
					if (el) {
						el.removeAttribute("data-has-comment");
					}
				}
				lastMarkedRef.current.delete(oldId);
			}
		}
		for (const id of Array.from(current)) {
			const trySelectors = [
				`[data-id="${id}"]`,
				`[data-block-id="${id}"]`,
				`[data-node-id="${id}"]`,
			];
			let el: HTMLElement | null = null;
			for (const sel of trySelectors) {
				el = document.querySelector(sel) as HTMLElement | null;
				if (el) break;
			}
			if (el) {
				el.setAttribute("data-has-comment", "1");
				lastMarkedRef.current.add(id);
			}
		}
		(threadStore as any).setThreadsFromConvex(threadsForDoc as any);
	}, [threadsForDoc, threadStore, editorInst]);

	return (
		<div className="mt-4">
			{(sync as any)?.isLoading ? (
				<p style={{ padding: 16 }}>Loading…</p>
			) : editorInst ? (
				<BlockNoteView editor={editorInst} theme="light" slashMenu={false}>
					<SuggestionMenuController
						triggerCharacter="/"
						getItems={async (query) =>
							filterSuggestionItems(getCustomSlashMenuItems(editorInst as CustomBlockNoteEditor), query)
						}
					/>
				</BlockNoteView>
			) : (
				<div style={{ padding: 16 }}>Editor not ready</div>
			)}
		</div>
	);
}

export { BlockNoteEditorComponent as BlockNoteEditor };