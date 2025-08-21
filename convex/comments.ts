import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function parseMentions(content: string): Array<{ userId: string; position: number; length: number }> {
  const results: Array<{ userId: string; position: number; length: number }> = [];
  const mentionRegex = /@\[[^\]]+\]\(user:([^\)]+)\)/g; // @[Name](user:userId)
  let match: RegExpExecArray | null;
  while ((match = mentionRegex.exec(content)) !== null) {
    const userId = match[1];
    const start = match.index;
    const len = match[0].length;
    if (userId) results.push({ userId, position: start, length: len });
  }
  return results;
}

function truncate(text: string, max = 120): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { userId: null, email: null } as const;
    const user = await ctx.db.get(userId);
    return { userId, email: (user as any)?.email ?? null } as const;
  },
});

export const resolveUsers = query({
  args: { ids: v.array(v.string()) },
  handler: async (ctx, { ids }) => {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const docs = await Promise.all(unique.map(async (id) => {
      try {
        const user = await ctx.db.get(id as any);
        return user ? { id, username: (user as any).email ?? "User", avatarUrl: "" } : null;
      } catch {
        return null;
      }
    }));
    return docs.filter(Boolean);
  },
});

export const listByDoc = query({
  args: { docId: v.string(), includeResolved: v.optional(v.boolean()) },
  handler: async (ctx, { docId, includeResolved }) => {
    const threads = await ctx.db
      .query("commentThreads")
      .withIndex("by_doc", (q) => q.eq("docId", docId))
      .collect();
    const visibleThreads = includeResolved ? threads : threads.filter((t) => !t.resolved);
    const results = await Promise.all(
      visibleThreads.map(async (t) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_thread", (q) => q.eq("threadId", t.id))
          .collect();
        comments.sort((a, b) => a.createdAt - b.createdAt);
        return { thread: t, comments };
      })
    );
    return results;
  },
});

export const listByTask = query({
  args: { taskId: v.id("tasks"), includeResolved: v.optional(v.boolean()) },
  handler: async (ctx, { taskId, includeResolved }) => {
    // First get all comment threads for this task
    const threads = await ctx.db
      .query("commentThreads")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
    
    // Filter threads based on resolved status
    const visibleThreads = includeResolved ? threads : threads.filter((t) => !t.resolved);
    
    // Get comments for each thread
    const results = await Promise.all(
      visibleThreads.map(async (thread) => {
        const comments = await ctx.db
          .query("comments")
          .withIndex("by_thread", (q) => q.eq("threadId", thread.id))
          .collect();
        comments.sort((a, b) => a.createdAt - b.createdAt);
        return { thread, comments };
      })
    );
    
    return results;
  },
});

export const listByThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return comments;
  },
});

export const getThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const thread = (await ctx.db
      .query("commentThreads")
      .collect()).find((t) => t.id === threadId);
    if (!thread) return null;
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    comments.sort((a, b) => a.createdAt - b.createdAt);
    return { thread, comments };
  },
});

export const createThread = mutation({
  args: {
    content: v.string(),
    docId: v.optional(v.string()),
    blockId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    entityType: v.optional(v.union(
      v.literal("document_block"),
      v.literal("task")
    )),
  },
  handler: async (ctx, { content, docId, blockId, taskId, entityType }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId as any);
    const now = Date.now();
    const threadId = `${now}-${Math.random().toString(36).slice(2, 10)}`;
    const inferredEntity = taskId ? "task" : (entityType ?? "document_block");
    await ctx.db.insert("commentThreads", {
      id: threadId,
      docId,
      blockId,
      taskId,
      entityType: inferredEntity,
      createdAt: now,
      resolved: false,
      creatorId: userId,
    });
    const mentions = parseMentions(content);
    const commentId = await ctx.db.insert("comments", {
      docId,
      blockId,
      taskId,
      entityType: inferredEntity,
      threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
    });
    if (mentions.length > 0) {
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      for (const m of mentions) {
        try {
          await ctx.db.insert("notifications", {
            type: "mention",
            title: `${authorName} mentioned you`,
            message: msg,
            userId: m.userId as any,
            isRead: false,
            relatedCommentId: commentId as any,
            priority: "medium",
            createdAt: Date.now(),
          });
        } catch (_e) {}
      }
    }
    return { threadId };
  },
});

export const createComment = mutation({
  args: {
    threadId: v.string(),
    content: v.string(),
    docId: v.optional(v.string()),
    blockId: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
    entityType: v.optional(v.union(
      v.literal("document_block"),
      v.literal("task")
    )),
  },
  handler: async (ctx, { threadId, content, docId, blockId, taskId, entityType }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId as any);
    const now = Date.now();
    const thread = (await ctx.db
      .query("commentThreads")
      .collect()).find((t) => (t as any).id === threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.docId && (thread.blockId !== blockId)) {
      throw new Error("Invalid block for thread");
    }
    const mentions = parseMentions(content);
    const inserted = await ctx.db.insert("comments", {
      docId: docId ?? (thread as any).docId,
      blockId: blockId ?? (thread as any).blockId,
      taskId: taskId ?? (thread as any).taskId,
      entityType: entityType ?? ((thread as any).entityType || (taskId ? "task" : "document_block")),
      threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
    });
    if (mentions.length > 0) {
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      for (const m of mentions) {
        try {
          await ctx.db.insert("notifications", {
            type: "mention",
            title: `${authorName} mentioned you`,
            message: msg,
            userId: m.userId as any,
            isRead: false,
            relatedCommentId: inserted as any,
            priority: "medium",
            createdAt: Date.now(),
          });
        } catch (_e) {}
      }
    }
    return inserted;
  },
});

export const replyToComment = mutation({
  args: { parentCommentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { parentCommentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const author = await ctx.db.get(userId as any);
    const parent = await ctx.db.get(parentCommentId);
    if (!parent) throw new Error("Parent comment not found");
    const now = Date.now();
    const mentions = parseMentions(content);
    const inserted = await ctx.db.insert("comments", {
      docId: (parent as any).docId,
      blockId: (parent as any).blockId,
      taskId: (parent as any).taskId,
      entityType: (parent as any).entityType ?? ((parent as any).taskId ? "task" : "document_block"),
      threadId: (parent as any).threadId,
      content,
      authorId: userId,
      mentions,
      createdAt: now,
      updatedAt: now,
      parentCommentId: parentCommentId,
    });
    if (mentions.length > 0) {
      const authorName = (author as any)?.name ?? (author as any)?.email ?? "Someone";
      const msg = truncate(content);
      for (const m of mentions) {
        try {
          await ctx.db.insert("notifications", {
            type: "mention",
            title: `${authorName} mentioned you`,
            message: msg,
            userId: m.userId as any,
            isRead: false,
            relatedCommentId: inserted as any,
            priority: "medium",
            createdAt: Date.now(),
          });
        } catch (_e) {}
      }
    }
    return inserted;
  },
});

export const updateComment = mutation({
  args: { commentId: v.id("comments"), content: v.string() },
  handler: async (ctx, { commentId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.patch(commentId, { content, updatedAt: Date.now() });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const existing = await ctx.db.get(commentId);
    if (!existing) throw new Error("Comment not found");
    if (existing.authorId !== userId) throw new Error("Forbidden");
    await ctx.db.delete(commentId);
  },
});

export const resolveThread = mutation({
  args: { threadId: v.string(), resolved: v.optional(v.boolean()) },
  handler: async (ctx, { threadId, resolved }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) throw new Error("Unauthenticated");
    const thread = (await ctx.db.query("commentThreads").collect()).find((t) => t.id === threadId);
    if (!thread) throw new Error("Thread not found");
    if (thread.creatorId && thread.creatorId !== userId) throw new Error("Forbidden");
    const newResolved = resolved ?? true;
    await ctx.db.patch(thread._id, { resolved: newResolved });
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_thread", (q) => q.eq("threadId", threadId))
      .collect();
    await Promise.all(comments.map((c) => ctx.db.patch(c._id, { resolved: newResolved })));
  },
});

export const searchUsers = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { query: q, limit }) => {
    const queryLower = q.trim().toLowerCase();
    if (queryLower.length === 0) return [] as Array<{ id: string; username: string; avatarUrl: string }>;
    const users = await ctx.db.query("users").collect();
    const matches = users.filter((u: any) => {
      const name = (u.name ?? "").toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      return name.includes(queryLower) || email.includes(queryLower);
    });
    const mapped = matches.map((u: any) => ({ id: u._id, username: u.name ?? u.email ?? "User", avatarUrl: u.image ?? "" }));
    return (limit ? mapped.slice(0, limit) : mapped);
  },
});


