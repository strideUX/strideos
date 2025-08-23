"use client";
import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, MessageCircle, PanelLeftOpen, Settings, Save, Loader2 } from "lucide-react";
import { useMutation } from "convex/react";
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
	const manualSaveContent = useMutation(api.manualSaves.save);
	
	// Debouncing and mutex refs
	const debounceMs = 500;
	const saveTimerRef = (globalThis as any)._bnManualSaveTimerRef ?? ((globalThis as any)._bnManualSaveTimerRef = { id: null as any });
	const saveMutexRef = (globalThis as any)._bnManualSaveMutexRef ?? ((globalThis as any)._bnManualSaveMutexRef = { locked: false });
	const lastSavedContentRef = (globalThis as any)._bnManualSaveLastContentRef ?? ((globalThis as any)._bnManualSaveLastContentRef = { json: null as string | null });

	const performSave = useCallback(async (): Promise<void> => {
		if (!editor || !docId) return;
		if (saveMutexRef.locked) return; // prevent concurrent saves
		
		saveMutexRef.locked = true;
		setIsSaving(true);
		
		try {
			// Get BlockNote document (array of blocks)
			const blocks = editor.document;
			if (!blocks) {
				throw new Error("No content to save");
			}
			
			// Convert to JSON string
			const content = JSON.stringify(blocks);
			
			// Check if content has changed
			if (lastSavedContentRef.json === content) {
				toast.success("Already saved");
				return;
			}
			
			// Save using our simple mutation
			await manualSaveContent({ 
				docId, 
				content 
			});
			
			lastSavedContentRef.json = content;
			toast.success("Saved");
			
		} catch (error) {
			console.error("Manual save failed:", error);
			toast.error("Failed to save document");
		} finally {
			setIsSaving(false);
			saveMutexRef.locked = false;
		}
	}, [editor, docId, manualSaveContent]);

	const scheduleSave = useCallback((immediate?: boolean) => {
		if (immediate) {
			if (saveTimerRef.id) { 
				clearTimeout(saveTimerRef.id); 
				saveTimerRef.id = null; 
			}
			void performSave();
			return;
		}
		if (saveTimerRef.id) { 
			clearTimeout(saveTimerRef.id); 
		}
		saveTimerRef.id = setTimeout(() => { 
			void performSave(); 
		}, debounceMs);
	}, [performSave]);

	// Keyboard shortcut handler
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && String(e.key).toLowerCase() === "s") {
				e.preventDefault();
				scheduleSave(true);
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [scheduleSave]);

	const isDisabled = isSaving || !editor || !docId;

	return (
		<div className="sticky top-0 z-10 flex w-full items-center gap-3 border-b bg-white px-4 py-2">
			<button 
				className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-sm" 
				onClick={() => { window.location.href = "/documents"; }}
			>
				<ArrowLeft className="h-4 w-4" /> All docs
			</button>
			<div className="text-lg font-semibold">{documentTitle}</div>
			<div className="ml-auto flex items-center gap-2">
				{editor && <BlockInsertButton editor={editor} />}
				<button 
					aria-label="Comments" 
					className={[
						"inline-flex h-8 w-8 items-center justify-center rounded-md border", 
						commentsOpen ? "bg-neutral-100" : "bg-white"
					].join(" ")} 
					onClick={onToggleComments}
				>
					<MessageCircle className="h-4 w-4" />
				</button>
				<button 
					aria-label="Page options" 
					className={[
						"inline-flex h-8 w-8 items-center justify-center rounded-md border", 
						optionsOpen ? "bg-neutral-100" : "bg-white"
					].join(" ")} 
					onClick={onToggleOptions}
				>
					<Settings className="h-4 w-4" />
				</button>
				<PresenceAvatars docId={docId} />
				<button
					aria-label="Save"
					className={[
						"inline-flex h-8 w-8 items-center justify-center rounded-md border",
						isDisabled ? "opacity-50 cursor-not-allowed" : "bg-white hover:bg-neutral-50"
					].join(" ")}
					onClick={() => scheduleSave(true)}
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