"use client";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, PanelLeftOpen, Settings, Save, Loader2 } from "lucide-react";
import { useConvex, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { PresenceAvatars } from "./PresenceAvatars";
import { BlockInsertButton } from "./blocks/BlockInsertButton";

interface TopBarProps {
	documentTitle: string;
	docId: string | null;
	onToggleComments: () => void;
	commentsOpen: boolean;
	optionsOpen: boolean;
	onToggleOptions: () => void;
	editor?: any;
}

export function TopBar({ documentTitle, docId, onToggleComments, commentsOpen, optionsOpen, onToggleOptions, editor }: TopBarProps): ReactElement {
	const [isSaving, setIsSaving] = useState<boolean>(false);
	const convex = useConvex();
	const latestVersion = useQuery(
		api.documentSyncApi.latestVersion as any,
		docId ? ({ id: docId } as any) : ("skip" as any)
	) as number | null;
	const submitSnapshot = useMutation(api.documentSyncApi.submitSnapshot);

	const handleManualSave = useCallback(async () => {
		if (!editor || !docId) return;
		try {
			setIsSaving(true);
			const pmState = (editor as any)?.prosemirrorState;
			const pmEditor = (editor as any)?.prosemirrorEditor;
			const pmView = (editor as any)?.prosemirrorView;
			const tiptap = (editor as any)?._tiptapEditor;
			const pmDoc = pmState?.doc || pmEditor?.state?.doc || pmView?.state?.doc || tiptap?.state?.doc;
			if (!pmDoc) {
				console.warn("Manual save: PM doc not found", {
					hasPMState: Boolean(pmState),
					hasPMEditor: Boolean(pmEditor),
					hasPMView: Boolean(pmView),
					hasTiptap: Boolean(tiptap)
				});
			}
			const pmJson = pmDoc?.toJSON?.();
			if (!pmJson) throw new Error("Editor content unavailable");
			const content = JSON.stringify(pmJson);
			console.log("Manual save starting", {
				docId,
				initialLatestVersion: latestVersion,
				contentLength: content.length
			});
			// Fetch the freshest version at save time to avoid conflicts
			let currentVersion: number | null = null;
			try {
				currentVersion = await convex.query(api.documentSyncApi.latestVersion, { id: docId } as any);
			} catch (verErr) {
				console.warn("Failed to fetch latest version during save; falling back to cached", verErr);
			}
			const baseVersion = typeof currentVersion === "number" ? currentVersion : (typeof latestVersion === "number" ? latestVersion : 0);
			console.log("Manual save version info", { currentVersion, baseVersion, submittingVersion: baseVersion + 1 });
			const attemptSave = async (versionToUse: number) => {
				return submitSnapshot({ id: docId, content, version: versionToUse });
			};

			try {
				await attemptSave(baseVersion + 1);
			} catch (firstErr) {
				// Retry once with a refreshed version in case of a race
				try {
					const refreshed = await convex.query(api.documentSyncApi.latestVersion, { id: docId } as any);
					const next = (typeof refreshed === "number" ? refreshed : baseVersion) + 1;
					await attemptSave(next);
				} catch (secondErr) {
					console.error("Manual save second attempt failed", secondErr);
					throw secondErr;
				}
			}
			toast.success("Document saved");
		} catch (e) {
			console.error("Manual save failed", { docId, error: e });
			const message = (e as any)?.message || "Failed to save document";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	}, [editor, docId, latestVersion, submitSnapshot]);

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "s") {
				e.preventDefault();
				handleManualSave();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [handleManualSave]);

	const isDisabled = isSaving || !editor || !docId;

	return (
		<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
			<button className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm" onClick={() => { window.location.href = "/documents"; }}><ArrowLeft className="h-4 w-4" /> All docs</button>
			<div className="text-lg font-semibold">{documentTitle}</div>
			<div className="ml-auto flex items-center gap-2">
				{editor && <BlockInsertButton editor={editor} />}
				<button aria-label="Comments" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", commentsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={onToggleComments}><MessageCircle className="h-4 w-4" /></button>
				<button aria-label="Page options" className={["inline-flex h-8 w-8 items-center justify-center rounded-md border", optionsOpen ? "bg-neutral-100" : "bg-white"].join(" ")} onClick={onToggleOptions}><Settings className="h-4 w-4" /></button>
				<PresenceAvatars docId={docId} />
				<button
					aria-label="Save"
					className={[
						"inline-flex h-8 w-8 items-center justify-center rounded-md border",
						isDisabled ? "opacity-50 cursor-not-allowed" : "bg-white"
					].join(" ")}
					onClick={handleManualSave}
					disabled={isDisabled}
					title={isSaving ? "Saving…" : (!editor || !docId ? "Editor not ready" : "Save (⌘/Ctrl+S)")}
				>
					{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
				</button>
			</div>
		</div>
	);
}

export function SidebarOpenButton({ onOpen }: { onOpen: () => void }): ReactElement {
	return (
		<button 
			aria-label="Open sidebar" 
			className="absolute left-4 top-2 z-20 text-neutral-600 hover:text-neutral-900 transition-all duration-300 ease-in-out animate-in fade-in"
			onClick={onOpen}
		>
			<PanelLeftOpen className="h-5 w-5" />
		</button>
	);
}