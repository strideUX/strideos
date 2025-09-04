"use client";
import { useMemo, useState, type ReactElement } from "react";
import { ChevronDown, ChevronRight, MessageCircle, PanelLeftClose, Plus } from "lucide-react";
import { usePages } from "@/hooks";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Page } from "@/types/pages.types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PageSidebarProps {
	documentId: string | null;
	activePageDocId: string | null;
	onSelect: (docId: string) => void;
	onCreatePage: () => void;
	onCollapse: () => void;
	theme?: "light" | "dark";
}

export function PageSidebar(props: PageSidebarProps): ReactElement {
	const { topLevelPages, childrenByParent, operations } = usePages(props.documentId as unknown as Id<"documents"> | null);
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const docIds = useMemo(() => {
		const ids: string[] = [];
		for (const p of topLevelPages) ids.push(p.docId);
		for (const key of Object.keys(childrenByParent)) {
			for (const c of (childrenByParent as Record<string, Page[]>)[key] ?? []) ids.push(c.docId);
		}
		return Array.from(new Set(ids));
	}, [topLevelPages, childrenByParent]);
	const unresolvedByDoc = useQuery(api.comments.getUnresolvedCountsByDoc, docIds.length > 0 ? { docIds } : "skip") as Record<string, number> | undefined;
	// Dialog states
	const [renameState, setRenameState] = useState<{ pageId: Id<"documentPages">; currentTitle: string } | null>(null);
	const [renameTitle, setRenameTitle] = useState<string>("");
	const [subpageState, setSubpageState] = useState<{ parentId: Id<"documentPages">; parentTitle: string } | null>(null);
	const [subpageTitle, setSubpageTitle] = useState<string>("Untitled page");
	const [deleteState, setDeleteState] = useState<{ page: Page } | null>(null);
	const isDark = props.theme === "dark";
	const containerClass = [
		"w-64 h-full border-r p-2 transition-transform duration-300 ease-in-out",
		isDark ? "bg-neutral-900 text-neutral-100 border-neutral-800" : "bg-white text-neutral-900 border-neutral-200",
	].join(" ");
	const hoverRow = isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-50";
	const activeRow = isDark ? "bg-neutral-800" : "bg-neutral-100";
	const menuSurface = ["absolute right-2 top-7 z-20 rounded-md border p-1 shadow-md", isDark ? "bg-neutral-900 border-neutral-700" : "bg-white"].join(" ");
	const menuItem = ["block w-full rounded px-2 py-1 text-left text-sm", isDark ? "hover:bg-neutral-800" : "hover:bg-neutral-100"].join(" ");
	const dangerItem = ["block w-full rounded px-2 py-1 text-left text-sm text-red-600", isDark ? "hover:bg-red-900/20" : "hover:bg-red-50"].join(" ");
	return (
		<div className={containerClass}>
			<div className="flex items-center justify-between px-1 py-2">
				<span className="text-xs font-semibold text-neutral-500">Pages</span>
				<button aria-label="Collapse sidebar" className="text-neutral-400 hover:text-neutral-200 transition-colors" onClick={props.onCollapse}><PanelLeftClose className="h-5 w-5" /></button>
			</div>
			<div className="flex flex-col gap-1">
				{topLevelPages.map((p: Page, idx: number) => {
					const children: Page[] = childrenByParent[String(p._id)] ?? [];
					const hasChildren = children.length > 0;
					const isExpanded = expanded[String(p._id)] ?? false;
					const siblings = topLevelPages;
					return (
						<div key={p._id} className="relative">
							<div className={["group relative flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === p.docId ? activeRow : hoverRow].join(" ")}>
								{hasChildren ? (
									<button
										aria-label={isExpanded ? "Collapse" : "Expand"}
										className="text-neutral-500 hover:text-neutral-900"
										onClick={(e) => { e.stopPropagation(); setExpanded((prev) => ({ ...prev, [String(p._id)]: !isExpanded })); }}
									>
										{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
									</button>
								) : <span className="w-4" />}
								<button onClick={() => props.onSelect(p.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
									<span className="text-sm">{p.icon ?? ""}</span>
									<span className="truncate" data-page-title-doc-id={p.docId}>{p.title || "Untitled"}</span>
								</button>
								{(unresolvedByDoc?.[p.docId] ?? 0) > 0 ? (
									<span title="Unresolved comments" className="ml-1 inline-flex items-center">
										<MessageCircle className={["h-3.5 w-3.5", isDark ? "text-neutral-400" : "text-neutral-500"].join(" ")} />
									</span>
								) : null}
								<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(p._id) ? null : String(p._id))}>⋯</button>
								{openMenuId === String(p._id) ? (
									<div className={menuSurface}>
										<button className={menuItem} onClick={async () => {
											setRenameState({ pageId: p._id, currentTitle: p.title });
											setRenameTitle(p.title);
											setOpenMenuId(null);
										}}>Rename</button>
										{idx > 0 ? (
											<button className={menuItem} onClick={async () => {
												await operations.reorderPage(p._id, siblings[idx - 1]._id);
												setOpenMenuId(null);
											}}>Move Up</button>
										) : null}
										{idx < siblings.length - 1 ? (
											<button className={menuItem} onClick={async () => {
												const targetBefore = idx + 2 < siblings.length ? siblings[idx + 2]._id : undefined;
												if (targetBefore) {
													await operations.reorderPage(p._id, targetBefore);
												} else {
													await operations.reorderPage(p._id);
												}
												setOpenMenuId(null);
											}}>Move Down</button>
										) : null}
										<button className={menuItem} onClick={async () => {
											setSubpageState({ parentId: p._id, parentTitle: p.title });
											setSubpageTitle("Untitled page");
											setOpenMenuId(null);
										}}>Add subpage</button>
										<button className={dangerItem} onClick={async () => {
											setDeleteState({ page: p });
											setOpenMenuId(null);
										}}>Delete Page</button>
									</div>
								) : null}
							</div>

							{hasChildren && isExpanded ? (
								<div className="mt-1">
										{children.map((c: Page, cIdx: number) => {
										const cSiblings = children;
										return (
											<div key={c._id} className={["group relative ml-4 flex items-center gap-2 rounded-md px-2 py-1", props.activePageDocId === c.docId ? activeRow : hoverRow].join(" ")}>
											<span className="w-4" />
											<button onClick={() => props.onSelect(c.docId)} className="flex flex-1 items-center gap-2 text-left text-sm">
												<span className="text-sm">{c.icon ?? ""}</span>
												<span className="truncate" data-page-title-doc-id={c.docId}>{c.title || "Untitled"}</span>
											</button>
											{(unresolvedByDoc?.[c.docId] ?? 0) > 0 ? (
												<span title="Unresolved comments" className="ml-1 inline-flex items-center">
													<MessageCircle className={["h-3.5 w-3.5", isDark ? "text-neutral-400" : "text-neutral-500"].join(" ")} />
												</span>
											) : null}
											<button aria-label="Page menu" className="invisible h-6 w-6 rounded-md border text-xs group-hover:visible" onClick={() => setOpenMenuId(openMenuId === String(c._id) ? null : String(c._id))}>⋯</button>
											{openMenuId === String(c._id) ? (
												<div className={menuSurface}>
													<button className={menuItem} onClick={async () => {
														setRenameState({ pageId: c._id, currentTitle: c.title });
														setRenameTitle(c.title);
														setOpenMenuId(null);
													}}>Rename</button>
													{cIdx > 0 ? (
														<button className={menuItem} onClick={async () => {
															await operations.reorderPage(c._id, cSiblings[cIdx - 1]._id);
															setOpenMenuId(null);
														}}>Move Up</button>
													) : null}
													{cIdx < cSiblings.length - 1 ? (
														<button className={menuItem} onClick={async () => {
															const targetBefore = cIdx + 2 < cSiblings.length ? cSiblings[cIdx + 2]._id : undefined;
															if (targetBefore) {
																await operations.reorderPage(c._id, targetBefore);
															} else {
																await operations.reorderPage(c._id);
															}
															setOpenMenuId(null);
														}}>Move Down</button>
													) : null}
													<button className={dangerItem} onClick={async () => {
														setDeleteState({ page: c });
														setOpenMenuId(null);
													}}>Delete Page</button>
												</div>
											) : null}
										</div>
									);
								})}
							</div>
						) : null}
					</div>
				);
			})}
			</div>
			<button className={["mt-2 flex w-full items-center gap-1 px-2 py-1 text-left text-sm", isDark ? "text-neutral-300 hover:text-white" : "text-neutral-600 hover:text-neutral-900"].join(" ")} onClick={props.onCreatePage} disabled={!props.documentId}><Plus className="h-4 w-4" /> New page</button>

			{/* Rename Dialog */}
			<Dialog open={!!renameState} onOpenChange={(open) => { if (!open) setRenameState(null); }}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Rename page</DialogTitle>
					</DialogHeader>
					<Input autoFocus value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} placeholder="Untitled" />
					<DialogFooter>
						<Button variant="outline" onClick={() => setRenameState(null)}>Cancel</Button>
						<Button onClick={async () => {
							if (!renameState) return;
							await operations.renamePage(renameState.pageId, renameTitle || "Untitled");
							setRenameState(null);
						}}>Save</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* New Subpage Dialog */}
			<Dialog open={!!subpageState} onOpenChange={(open) => { if (!open) setSubpageState(null); }}>
				<DialogContent className="sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>New subpage</DialogTitle>
					</DialogHeader>
					<Input value={subpageTitle} onChange={(e) => setSubpageTitle(e.target.value)} placeholder="Untitled page" />
					<DialogFooter>
						<Button variant="outline" onClick={() => setSubpageState(null)}>Cancel</Button>
						<Button onClick={async () => {
							if (!subpageState) return;
							const res = await operations.createSubpage(subpageState.parentId, subpageTitle || "Untitled page");
							setExpanded((prev) => ({ ...prev, [String(subpageState.parentId)]: true }));
							props.onSelect(res.docId);
							setSubpageState(null);
						}}>Create</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Page Confirm */}
			<AlertDialog open={!!deleteState} onOpenChange={(open) => { if (!open) setDeleteState(null); }}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete page?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. The page "{deleteState?.page.title}" will be permanently deleted.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setDeleteState(null)}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={async () => {
							if (!deleteState) return;
							await operations.removePage(deleteState.page._id);
							if (props.activePageDocId === deleteState.page.docId) props.onSelect("");
							setDeleteState(null);
						}}>Delete</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
