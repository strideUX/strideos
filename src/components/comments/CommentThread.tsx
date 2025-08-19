"use client";
import { useMemo, useState, type ReactElement } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CommentThread({ threadId, onJumpToBlock }: { threadId: string; onJumpToBlock?: (blockId: string) => void }): ReactElement {
  const data = useQuery(api.comments.getThread, { threadId }) as any;
  const [expanded, setExpanded] = useState<boolean>(true);
  const deleteComment = useMutation(api.comments.deleteComment);
  const resolveThread = useMutation(api.comments.resolveThread);

  if (!data) return <div className="text-sm text-neutral-500">Loading…</div> as any;
  const { thread, comments } = data;
  const first = comments[0];
  const replies = comments.slice(1);

  return (
    <div className="rounded border p-2">
      <div className="flex items-center justify-between">
        <button className="text-left font-medium hover:underline" onClick={() => onJumpToBlock?.(thread.blockId)}>
          {first?.content?.slice(0, 80) || "(No content)"}
        </button>
        <div className="flex items-center gap-2">
          <button className="text-xs text-neutral-500" onClick={() => setExpanded((v) => !v)}>{expanded ? "Hide" : "Show"}</button>
          {thread.resolved ? (<span className="text-xs text-green-600">Resolved</span>) : null}
        </div>
      </div>
      <div className="mt-1 text-xs text-neutral-500">{new Date(thread.createdAt).toLocaleString()}</div>
      {expanded ? (
        <div className="mt-2 space-y-2">
          <div className="text-sm">{first?.content}</div>
          {replies.length > 0 ? (
            <div className="pl-3 border-l space-y-2">
              {replies.map((c: any) => (
                <div key={c._id} className="text-sm flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-xs text-neutral-500">{new Date(c.createdAt).toLocaleString()}</div>
                    <div>{c.content}</div>
                  </div>
                  <button className="text-xs text-red-600 hover:underline" onClick={() => deleteComment({ commentId: c._id }).catch(() => {})}>Delete</button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-2 flex gap-2">
            {!thread.resolved ? (
              <button className="text-xs rounded border px-2 py-1" onClick={() => resolveThread({ threadId: thread.id, resolved: true }).catch(() => {})}>Resolve</button>
            ) : (
              <button className="text-xs rounded border px-2 py-1" onClick={() => resolveThread({ threadId: thread.id, resolved: false }).catch(() => {})}>Reopen</button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}


