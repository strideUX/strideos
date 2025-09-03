"use client";
import type { ReactElement } from "react";
import { ArrowLeft, MessageCircle, PanelLeftOpen, Settings, Share2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { PresenceAvatars } from "@/components/editor";
import { BlockInsertButton } from "@/components/editor/custom-blocks/block-insert-button";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui";
import type { Document } from "@/types/documents.types";
import type { CustomBlockNoteEditor } from "@/components/editor/custom-blocks/custom-schema";
import { toast } from "@/hooks";

interface TopBarProps {
	documentTitle: string;
	// Page-level docId (used by presence avatars)
	docId: string | null;
	// Database document id (used for publish/share)
	documentId?: string | null;
	// Read-only view (shared)
	readOnly?: boolean;
	onToggleComments: () => void;
	commentsOpen: boolean;
	optionsOpen: boolean;
	onToggleOptions: () => void;
	editor?: { manualSave?: () => Promise<void> } | CustomBlockNoteEditor | null;
	theme?: "light" | "dark";
}

export function TopBar({ documentTitle, docId, documentId, readOnly = false, onToggleComments, commentsOpen, optionsOpen, onToggleOptions, editor, theme = "light" }: TopBarProps): ReactElement {
    const router = useRouter();
	const documentsRaw = useQuery(api.documents.list, {}) as Array<{ _id: string; shareId?: string }> | undefined;
	const currentDoc = useMemo(() => {
		const docs = (documentsRaw ?? []) as Array<{ _id: string; shareId?: string }>;
		const match = docs.find(d => String(d._id) === String(documentId ?? ""));
		return (match as unknown as Document) ?? null;
	}, [documentsRaw, documentId]);
	const publishMutation = useMutation(api.documents.publish);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [localShareId, setLocalShareId] = useState<string | null>(null);
	const effectiveShareId = localShareId ?? (currentDoc?.shareId ?? null);
	const shareUrl = typeof window !== "undefined" && effectiveShareId ? `${window.location.origin}/s/${effectiveShareId}` : null;

	const isDark = theme === "dark";
	const containerClass = [
		"sticky top-0 z-10 flex w-full items-center gap-3 px-4 py-2 border-b",
		isDark ? "bg-neutral-900 text-neutral-100 border-neutral-800" : "bg-white text-neutral-900 border-neutral-200",
	].join(" ");
	const borderClass = isDark ? "border-neutral-800" : "border-neutral-200";
	const commentsBtnClass = [
		"inline-flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer",
		borderClass,
		commentsOpen ? (isDark ? "bg-neutral-800" : "bg-neutral-100") : (isDark ? "bg-neutral-900" : "bg-white"),
	].join(" ");
	const optionsBtnClass = [
		"inline-flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer",
		borderClass,
		optionsOpen ? (isDark ? "bg-neutral-800" : "bg-neutral-100") : (isDark ? "bg-neutral-900" : "bg-white"),
	].join(" ");

	const iconBtnClass = [
		"inline-flex h-8 w-8 items-center justify-center rounded-md border cursor-pointer",
		borderClass,
		isDark ? "bg-neutral-900 hover:bg-neutral-800" : "bg-white hover:bg-neutral-100",
	].join(" ");

	return (
		<div className={containerClass}>
			{!readOnly ? (
				<button className={["inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm cursor-pointer", borderClass].join(" ")} onClick={() => { router.push("/documents"); }}><ArrowLeft className="h-4 w-4" /> All docs</button>
			) : null}
			<div className="text-lg font-semibold">{documentTitle}</div>
			<div className="ml-auto flex items-center gap-2">
				{!readOnly && editor ? <BlockInsertButton editor={editor as CustomBlockNoteEditor} /> : null}
				{!readOnly && editor ? (
					<button
						aria-label="Save"
						className={iconBtnClass}
						onClick={async () => {
							try {
								console.log("Manual save: starting...");
								await (editor as { manualSave?: () => Promise<void> } | null)?.manualSave?.();
								console.log("Manual save: success");
								toast.success("Saved");
							} catch (err) {
								console.log("Manual save: failed", err);
								toast.error("Save failed");
							}
						}}
					>
						<Save className="h-4 w-4" />
					</button>
				) : null}
				{!readOnly ? (
					<button aria-label="Page options" className={optionsBtnClass} onClick={onToggleOptions}><Settings className="h-4 w-4" /></button>
				) : null}
				<button aria-label="Comments" className={commentsBtnClass} onClick={onToggleComments}><MessageCircle className="h-4 w-4" /></button>
				{!readOnly ? <PresenceAvatars docId={docId ?? undefined} /> : null}
				<div>
					<Button
						variant="default"
						onClick={async () => {
							if (!effectiveShareId) {
								setDialogOpen(true);
							} else {
								setDialogOpen(true);
							}
						}}
					>
						<Share2 className="h-4 w-4 mr-1" /> {effectiveShareId ? "Share" : "Publish"}
					</Button>
				</div>
			</div>

			{dialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setDialogOpen(false)}>
					<div className={["w-[420px] rounded-lg border p-4 shadow-xl", isDark ? "bg-neutral-900 text-neutral-100 border-neutral-700" : "bg-white border-neutral-200"].join(" ")} onClick={(e) => e.stopPropagation()}>
						{!effectiveShareId ? (
							<div>
								<h3 className="mb-2 text-lg font-semibold">Publish document?</h3>
								<p className={["mb-4 text-sm", isDark ? "text-neutral-400" : "text-neutral-600"].join(" ")}>This will create a read-only share link anyone can view.</p>
								<div className="flex justify-end gap-2">
									<button className={["inline-flex h-8 items-center rounded-md border px-2", borderClass].join(" ")} onClick={() => setDialogOpen(false)}>Cancel</button>
									<Button onClick={async () => {
										if (!currentDoc?._id) return;
										setPublishing(true);
										try {
								const r = await publishMutation({ documentId: currentDoc._id });
								const share = (r as unknown as { shareId?: string })?.shareId ?? null;
								setLocalShareId(share);
										} finally {
											setPublishing(false);
										}
									}} disabled={publishing}>{publishing ? "Publishing..." : "Publish"}</Button>
								</div>
							</div>
						) : (
							<div>
								<h3 className="mb-2 text-lg font-semibold">Share document</h3>
								<div className={["mb-3 break-all rounded-md border px-2 py-1 text-sm", borderClass].join(" ")}>{shareUrl}</div>
								<div className="flex justify-end gap-2">
									<Button onClick={() => { if (shareUrl) navigator.clipboard.writeText(shareUrl); }}>Copy link</Button>
									{!readOnly ? (
										<Button onClick={() => { if (shareUrl) window.open(shareUrl, "_blank"); }}>View</Button>
									) : null}
								</div>
							</div>
						)}
					</div>
				</div>
			)}
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
