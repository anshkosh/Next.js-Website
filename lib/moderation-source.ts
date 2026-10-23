import type { ContentModeration, Prisma } from "@prisma/client";
import { commentContent, replyContent, updateContent, journalContent, contentHash, type ModerationContent } from "./moderation-policy";
import { publicStartupWhere } from "./startup-visibility";

type Source = { content: ModerationContent; slug: string; startupId: string; mediaUrl?: string | null };
export async function moderationSource(tx: Prisma.TransactionClient, job: Pick<ContentModeration, "kind" | "targetId">, includePublished = false): Promise<Source | null> {
  if (job.kind === "COMMENT" || job.kind === "REPLY") {
    const row = await tx.comment.findFirst({ where: { id: job.targetId, status: job.kind === "COMMENT" ? (includePublished ? { in: ["PENDING", "APPROVED"] } : "PENDING") : "APPROVED", startup: publicStartupWhere }, include: { startup: { select: { slug: true } } } });
    if (!row || job.kind === "REPLY" && !row.pendingReply && !(includePublished && row.reply)) return null;
    return { content: job.kind === "COMMENT" ? commentContent(row) : replyContent(row.pendingReply ? row : { pendingReply: row.reply, pendingRepliedBy: row.repliedBy }), slug: row.startup.slug, startupId: row.startupId };
  }
  if (job.kind === "UPDATE") {
    const row = await tx.startupUpdate.findFirst({ where: { id: job.targetId, status: includePublished ? { in: ["PENDING", "APPROVED"] } : "PENDING", startup: publicStartupWhere }, include: { startup: { select: { slug: true } } } });
    return row ? { content: updateContent(row), slug: row.startup.slug, startupId: row.startupId, mediaUrl: row.imageUrl } : null;
  }
  if (job.kind === "JOURNAL") {
    // Private entries and withdrawn/reviewed revisions must never be sent to AI.
    const row = await tx.founderJournalRevision.findFirst({ where: { id: job.targetId, status: "PENDING_REVIEW", entry: { visibility: "PUBLIC", startup: publicStartupWhere } }, include: { entry: { select: { startupId: true, startup: { select: { slug: true } } } } } });
    return row?.entry.startup ? { content: journalContent(row.data, row.version), slug: row.entry.startup.slug, startupId: row.entry.startupId! } : null;
  }
  return null;
}

// Re-read inside the committing transaction, then condition each public write on
// the exact content checked. A result for an old submission cannot publish an edit.
export async function applyModeration(tx: Prisma.TransactionClient, job: Pick<ContentModeration, "kind" | "targetId" | "contentHash">, approve: boolean, includePublished = false) {
  const source = await moderationSource(tx, job, includePublished);
  if (!source || contentHash(source.content) !== job.contentHash) return null;
  if (job.kind === "JOURNAL") return source; // Editorial approval remains human.
  let count = 0;
  if (job.kind === "COMMENT") {
    const row = await tx.comment.findUniqueOrThrow({ where: { id: job.targetId } });
    if (!includePublished && row.status !== "PENDING") return null;
    if (contentHash(commentContent(row)) !== job.contentHash) return null;
    count = (await tx.comment.updateMany({ where: { id: row.id, status: row.status, authorName: row.authorName, body: row.body, startup: publicStartupWhere }, data: { status: approve ? "APPROVED" : "REJECTED" } })).count;
  } else if (job.kind === "UPDATE") {
    const row = await tx.startupUpdate.findUniqueOrThrow({ where: { id: job.targetId } });
    if (!includePublished && row.status !== "PENDING") return null;
    // Guard against a source edit between our reads as well as during inference.
    if (contentHash(updateContent(row)) !== job.contentHash) return null;
    count = (await tx.startupUpdate.updateMany({ where: { id: row.id, status: row.status, title: row.title, body: row.body, imageUrl: row.imageUrl, startup: publicStartupWhere }, data: { status: approve ? "APPROVED" : "REJECTED" } })).count;
    if (count) await tx.startup.update({ where: { id: row.startupId }, data: { updateCount: await tx.startupUpdate.count({ where: { startupId: row.startupId, status: "APPROVED" } }) } });
  } else {
    const row = await tx.comment.findUniqueOrThrow({ where: { id: job.targetId } });
    const published = includePublished && !row.pendingReply;
    if (contentHash(replyContent(published ? { pendingReply: row.reply, pendingRepliedBy: row.repliedBy } : row)) !== job.contentHash) return null;
    count = (await tx.comment.updateMany({ where: { id: row.id, status: "APPROVED", reply: row.reply, repliedBy: row.repliedBy, pendingReply: row.pendingReply, pendingRepliedBy: row.pendingRepliedBy, startup: publicStartupWhere }, data: {
      ...(approve ? { reply: row.pendingReply ?? row.reply, repliedBy: row.pendingRepliedBy ?? row.repliedBy, repliedAt: new Date() } : published ? { reply: null, repliedBy: null, repliedAt: null } : {}), pendingReply: null, pendingRepliedBy: null,
    } })).count;
  }
  return count ? source : null;
}
