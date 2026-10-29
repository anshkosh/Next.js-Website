"use server";

import { publicStartupWhere } from "@/lib/startup-visibility";

import { db } from "@/lib/db";
import { queueModeration } from "@/lib/moderation-store";
import { commentContent, replyContent } from "@/lib/moderation-policy";
import { commentLanguageReasons, COMMENT_LANGUAGE_WARNING } from "@/lib/comment-language";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import { revalidateSavedPath as revalidatePath } from "@/lib/cache-after-save";
import { logger } from "@/lib/logger";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit, readRateLimit } from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { clientIp } from "@/lib/utils/client-ip";
import { commentIdSchema, startupIdSchema } from "@/lib/validators/id.schema";
import { addCommentReceipt, readCommentReceipts, COMMENT_RECEIPT_COOKIE, COMMENT_RECEIPT_TTL } from "@/lib/comment-receipts";
import {
  submitCommentSchema,
  replyToCommentSchema,
} from "@/lib/validators/comment.schema";
import { commenterEmailHash } from "@/lib/commenter-restrictions";
import { deliverNotification } from "@/lib/notification-outbox";
import { storeApprovedCommentEmail } from "@/lib/comment-notifications";
import { z } from "zod";

const COMMENTS_PAGE_SIZE = 10;
const COMMENT_LIMIT_MESSAGE = "This network has reached its limit of 3 comments per hour. Please try again later.";
const commentEditSchema = z.object({
  authorName: z.string().trim().min(2).max(80),
  body: z.string().trim().min(5).max(2000),
});
function isCommentOwner(comment: { authorEmail: string; authorUserId: string | null }, user: { id: string; email: string; emailVerified: boolean }) {
  if (!user.emailVerified) return false;
  const emailMatches = comment.authorEmail.trim().toLowerCase() === user.email.trim().toLowerCase();
  return comment.authorUserId === user.id || (!comment.authorUserId && emailMatches);
}

// Direct in-context owner controls. A verified account can manage an older
// anonymous comment when its verified email exactly matches the submitted email.
export async function editOwnComment(commentId: string, expectedUpdatedAt: string, data: { authorName: string; body: string }) {
  const parsed = commentEditSchema.safeParse(data);
  if (!commentIdSchema.safeParse(commentId).success || typeof expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(expectedUpdatedAt)) || !parsed.success) return { error: "Check the comment details and try again." };
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.emailVerified || session.user.banned) return { error: "Sign in with the verified account used for this comment." };
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const comment = await tx.comment.findUnique({ where: { id: commentId }, select: { id: true, authorName: true, authorEmail: true, authorUserId: true, body: true, updatedAt: true, deletedAt: true, startup: { select: { slug: true } } } });
      if (!comment || comment.deletedAt) return { error: "This comment is no longer available." };
      if (!isCommentOwner(comment, session.user)) return { error: "You can only edit your own comment." };
      if (comment.updatedAt.toISOString() !== expectedUpdatedAt) return { error: "This comment changed. Reload it before saving your edit." };
      if (comment.authorName === parsed.data.authorName && comment.body === parsed.data.body) return { slug: comment.startup.slug, pendingComment: null, message: "No changes to save." };
      const emailHash = commenterEmailHash(comment.authorEmail);
      if (emailHash) {
        const block = await tx.commenterBlock.findUnique({ where: { emailHash }, select: { revokedAt: true, expiresAt: true } });
        if (block && !block.revokedAt && (!block.expiresAt || block.expiresAt > new Date())) return { error: "This commenter is blocked from submitting edits." };
      }

      await tx.commentRevision.create({ data: { commentId, authorName: comment.authorName, body: comment.body, editorId: session.user.id } });
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { authorName: parsed.data.authorName, body: parsed.data.body, authorUserId: session.user.id, status: "PENDING", reviewedAt: null, reviewedBy: null, reviewNote: null },
        select: { id: true, authorName: true, body: true, createdAt: true, updatedAt: true },
      });
      await queueModeration(tx, "COMMENT", updated.id, commentContent(updated));
      return { slug: comment.startup.slug, pendingComment: { ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString(), canManage: true } };
    });
    if (result.error) return { error: result.error };
    revalidatePath(`/startups/${result.slug}`); revalidatePath("/admin/comments"); revalidatePath("/admin/content-review");
    return { success: true as const, message: result.message, pendingComment: result.pendingComment };
  } catch (err) {
    logger.error("Owner comment edit failed", err);
    return { error: "The comment could not be updated. Please try again." };
  }
}

export async function deleteOwnComment(commentId: string) {
  if (!commentIdSchema.safeParse(commentId).success) return { error: "Invalid comment." };
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.emailVerified || session.user.banned) return { error: "Sign in with the verified account used for this comment." };
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const comment = await tx.comment.findUnique({ where: { id: commentId }, select: { authorEmail: true, authorUserId: true, deletedAt: true, startup: { select: { slug: true } } } });
      if (!comment || comment.deletedAt) return { error: "This comment is no longer available." };
      if (!isCommentOwner(comment, session.user)) return { error: "You can only delete your own comment." };
      await tx.commenterBlock.updateMany({ where: { sourceCommentId: commentId }, data: { sourceCommentId: null } });
      await tx.moderationAccountBan.updateMany({ where: { sourceCommentId: commentId }, data: { sourceCommentId: null } });
      await tx.commentStaffEvent.deleteMany({ where: { commentId } });
      await tx.comment.delete({ where: { id: commentId } });
      return { slug: comment.startup.slug };
    });
    if (result.error) return { error: result.error };
    revalidatePath(`/startups/${result.slug}`); revalidatePath("/admin/comments"); revalidatePath("/admin/content-review"); revalidatePath("/"); revalidatePath("/leaderboard");
    return { success: true as const };
  } catch (err) {
    logger.error("Owner comment delete failed", err);
    return { error: "The comment could not be deleted. Please try again." };
  }
}

export async function getCommentAvailability() {
  const fingerprint = generateFingerprint(clientIp(await headers()), "comment-v2");
  const status = await readRateLimit(`rate-limit:comment:${fingerprint}`, 3);
  return { ...status, message: status.allowed ? "" : status.available ? COMMENT_LIMIT_MESSAGE : "Comment protection is temporarily unavailable. Please try again shortly." };
}

export interface PendingComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  canManage: boolean;
}

export async function fetchOwnPendingComments(startupId: string): Promise<PendingComment[]> {
  if (!startupIdSchema.safeParse(startupId).success) return [];
  const ids = readCommentReceipts((await cookies()).get(COMMENT_RECEIPT_COOKIE)?.value, process.env.BETTER_AUTH_SECRET);
  const session = await auth.api.getSession({ headers: await headers() });
  const verifiedUser = session?.user.emailVerified && !session.user.banned ? session.user : null;
  const email = verifiedUser?.email.trim().toLowerCase();
  if (!ids.length && !verifiedUser) return [];
  const rows = await db.comment.findMany({
    where: {
      startupId,
      status: "PENDING",
      startup: publicStartupWhere,
      OR: [
        ...(ids.length ? [{ id: { in: ids } }] : []),
        ...(verifiedUser ? [{ authorUserId: verifiedUser.id }, { authorUserId: null, authorEmail: { equals: email, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: { createdAt: "desc" }, take: 20,
    select: { id: true, authorName: true, body: true, authorEmail: true, authorUserId: true, createdAt: true, updatedAt: true },
  });
  return rows.map(row => ({ id: row.id, authorName: row.authorName, body: row.body, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(), canManage: Boolean(verifiedUser && isCommentOwner(row, verifiedUser)) }));
}

// ──────────────────────────────────────────────────────────────────────────────
// Public — Submit a new comment (pending admin approval)
// ──────────────────────────────────────────────────────────────────────────────
export async function submitComment(formData: {
  startupId: string;
  authorName: string;
  authorEmail: string;
  body: string;
  turnstileToken: string;
}) {
  try {
    const parsed = submitCommentSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { startupId, authorName, authorEmail, body, turnstileToken } =
      parsed.data;

    // Read without consuming the allowance before asking the visitor for CAPTCHA.
    const availability = await getCommentAvailability();
    if (!availability.allowed) return { error: availability.message };

    // Verify Turnstile CAPTCHA
    const tokenValid = await verifyTurnstileToken(turnstileToken);
    if (!tokenValid) {
      return { error: "CAPTCHA verification failed. Please try again." };
    }

    // Rate limiting: 3 comments per IP per hour
    const headersList = await headers();
    const fingerprint = generateFingerprint(clientIp(headersList), "comment-v2");
    const rateLimitKey = `rate-limit:comment:${fingerprint}`;
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 3600);
    if (!isAllowed) {
      return {
        error: COMMENT_LIMIT_MESSAGE,
      };
    }

    // Only publicly visible startups accept comments.
    const startup = await db.startup.findUnique({
      where: { id: startupId, ...publicStartupWhere },
      select: { id: true, slug: true },
    });
    if (!startup) {
      return { error: "Startup not found." };
    }

    // Block anonymous commenters by a keyed email digest. The private email
    // remains on the source comment and is never copied into a ban record.
    const emailHash = commenterEmailHash(authorEmail);
    if (emailHash) {
      const block = await db.commenterBlock.findUnique({ where: { emailHash }, select: { revokedAt: true, expiresAt: true } });
      if (block && !block.revokedAt && (!block.expiresAt || block.expiresAt > new Date())) {
        return { error: "We cannot accept this comment right now. Contact hello@anshkosh.com if you think this is a mistake." };
      }
    }

    const signedIn = await auth.api.getSession({ headers: headersList });
    const authorUserId = signedIn?.user.emailVerified && !signedIn.user.banned && signedIn.user.email.trim().toLowerCase() === authorEmail.trim().toLowerCase()
      ? signedIn.user.id
      : null;

    const comment = await db.$transaction(async tx => {
      const saved = await tx.comment.create({
      data: {
        startupId,
        authorName,
        authorEmail,
        authorUserId,
        body,
        status: "PENDING",
      },
      select: { id: true, authorName: true, body: true, createdAt: true, updatedAt: true },
      });
      await queueModeration(tx, "COMMENT", saved.id, commentContent(saved));
      return saved;
    });

    // A private, signed receipt allows reloads without exposing pending comments
    // to anyone who knows (or guesses) the author's unverified email address.
    try {
      const jar = await cookies();
      const receipt = addCommentReceipt(jar.get(COMMENT_RECEIPT_COOKIE)?.value, comment.id, process.env.BETTER_AUTH_SECRET);
      if (receipt) jar.set(COMMENT_RECEIPT_COOKIE, receipt, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: COMMENT_RECEIPT_TTL });
    } catch { logger.warn("Comment saved; private browser receipt unavailable"); }

    revalidatePath(`/startups/${startup.slug}`);
    return { success: true, warning: commentLanguageReasons(`${authorName}\n${body}`).length ? COMMENT_LANGUAGE_WARNING : undefined, pendingComment: { ...comment, createdAt: comment.createdAt.toISOString(), updatedAt: comment.updatedAt.toISOString(), canManage: Boolean(authorUserId) } };
  } catch (err) {
    logger.error("submitComment error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Public — Fetch approved comments (paginated, newest first)
// ──────────────────────────────────────────────────────────────────────────────
export interface PublicComment {
  id: string;
  authorName: string;
  body: string;
  updatedAt: string;
  canManage: boolean;
  reply: string | null;
  repliedAt: string | null;
  repliedBy: string | null;
  createdAt: string;
}

export async function fetchApprovedComments(
  startupId: string,
  cursor?: string
): Promise<{ comments: PublicComment[]; nextCursor: string | null }> {
  if (typeof startupId !== "string" || !startupId || startupId.length > 128 || (cursor !== undefined && (typeof cursor !== "string" || !cursor || cursor.length > 128))) return { comments: [], nextCursor: null };
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const viewer = session?.user.emailVerified && !session.user.banned ? session.user : null;
    const rows = await db.comment.findMany({
      where: { startupId, status: "APPROVED", startup: publicStartupWhere },
      orderBy: { createdAt: "desc" },
      take: COMMENTS_PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        authorName: true,
        body: true,
        reply: true,
        repliedAt: true,
        repliedBy: true,
        createdAt: true,
        updatedAt: true,
        authorEmail: true,
        authorUserId: true,
      },
    });

    const hasMore = rows.length > COMMENTS_PAGE_SIZE;
    const slice = hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows;

    return {
      comments: slice.map((c) => ({
        id: c.id,
        authorName: c.authorName,
        body: c.body,
        updatedAt: c.updatedAt.toISOString(),
        canManage: Boolean(viewer && isCommentOwner(c, viewer)),
        reply: c.reply,
        repliedAt: c.repliedAt?.toISOString() ?? null,
        repliedBy: c.repliedBy,
        createdAt: c.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? slice[slice.length - 1].id : null,
    };
  } catch (err) {
    logger.error("fetchApprovedComments error:", err);
    return { comments: [], nextCursor: null };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin — Approve a comment
// ──────────────────────────────────────────────────────────────────────────────
async function changeLegacyCommentStatus(commentId: string, nextStatus: "APPROVED" | "REJECTED") {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) return { error: "Unauthorized" };
    if (!commentIdSchema.safeParse(commentId).success) return { error: "Invalid comment." };

    const result = await db.$transaction(async tx => {
      const current = await tx.comment.findUnique({ where: { id: commentId }, select: { status: true, startup: { select: { slug: true } } } });
      if (!current) return { error: "Comment no longer exists." };
      if (current.status === nextStatus) return { slug: current.startup.slug, notificationId: null };
      const reviewedAt = new Date();
      const changed = await tx.comment.updateMany({ where: { id: commentId, status: current.status }, data: { status: nextStatus, reviewedBy: session.user.id, reviewedAt, reviewNote: nextStatus === "REJECTED" ? "Rejected by staff" : null } });
      if (!changed.count) return { error: "This comment changed in another review. Refresh before deciding." };
      await tx.contentModeration.updateMany({ where: { kind: "COMMENT", targetId: commentId }, data: { status: nextStatus, leaseToken: null, reviewedBy: session.user.id, reviewedAt } });
      const notification = nextStatus === "APPROVED" ? await storeApprovedCommentEmail(tx, commentId) : null;
      return { slug: current.startup.slug, notificationId: notification?.id ?? null };
    });
    if ("error" in result) return result;
    const notificationDelivered = result.notificationId ? await deliverNotification(result.notificationId) : true;
    revalidatePath(`/startups/${result.slug}`);
    revalidatePath("/admin/comments");
    revalidatePath("/admin/content-review");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true, ...(result.notificationId && !notificationDelivered ? { notificationPending: true } : {}) };
  } catch (err) {
    logger.error("changeCommentStatus error:", err);
    return { error: "Failed to save the comment decision." };
  }
}

export async function approveComment(commentId: string) {
  return changeLegacyCommentStatus(commentId, "APPROVED");
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin — Reject a comment
// ──────────────────────────────────────────────────────────────────────────────
export async function rejectComment(commentId: string) {
  return changeLegacyCommentStatus(commentId, "REJECTED");
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder — Reply to an approved comment
// ──────────────────────────────────────────────────────────────────────────────
export async function replyToComment(data: {
  commentId: string;
  reply: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.emailVerified || session.user.banned) return { error: "Sign in with a verified account." };

    const parsed = replyToCommentSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const { commentId, reply } = parsed.data;

    // Verify ownership: the logged-in user must be the founder of the startup
    const comment = await db.comment.findUnique({
      where: { id: commentId, status: "APPROVED" },
      include: { startup: { select: { slug: true, founderId: true } } },
    });

    if (!comment) return { error: "Comment not found." };
    if (comment.startup.founderId !== session.user.id) {
      return { error: "You can only reply to comments on your own startup." };
    }

    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const current = await tx.comment.findUnique({ where: { id: commentId, status: "APPROVED", startup: { founderId: session.user.id, ...publicStartupWhere } }, select: { reply: true, repliedBy: true, pendingReply: true, pendingRepliedBy: true } });
      if (!current) throw new Error("Comment changed before reply edit");
      const previousReply = current.pendingReply ?? current.reply;
      if (previousReply) await tx.founderReplyRevision.create({ data: { commentId, reply: previousReply, repliedBy: current.pendingRepliedBy ?? current.repliedBy, editorId: session.user.id } });
      const saved = await tx.comment.update({
        where: { id: commentId, status: "APPROVED", startup: { founderId: session.user.id, ...publicStartupWhere } },
        data: { pendingReply: reply, pendingRepliedBy: session.user.name ?? "Founder" },
      });
      await queueModeration(tx, "REPLY", commentId, replyContent(saved));
    });

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true, message: "Reply saved for moderation. Your published reply stays visible until the replacement is approved." };
  } catch (err) {
    logger.error("replyToComment error:", err);
    return { error: "Failed to save reply." };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Founder / Admin — Delete a founder reply
// ──────────────────────────────────────────────────────────────────────────────
export async function deleteReply(commentId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.emailVerified || session.user.banned) return { error: "Unauthorized" };

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: { startup: { select: { slug: true, founderId: true } } },
    });

    if (!comment) return { error: "Comment not found." };

    const isAdmin =
      session.user.role === "admin" || session.user.role === "reviewer";
    const isOwner = comment.startup.founderId === session.user.id;

    if (!isAdmin && !isOwner) {
      return { error: "Unauthorized" };
    }

    const deleted = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const current = await tx.comment.findUnique({ where: { id: commentId }, select: { reply: true, repliedBy: true, pendingReply: true, pendingRepliedBy: true } });
      if (!current) return false;
      if (current.pendingReply) await tx.founderReplyRevision.create({ data: { commentId, reply: current.pendingReply, repliedBy: current.pendingRepliedBy, editorId: session.user.id } });
      if (current.reply && current.reply !== current.pendingReply) await tx.founderReplyRevision.create({ data: { commentId, reply: current.reply, repliedBy: current.repliedBy, editorId: session.user.id } });
      await tx.comment.update({
        where: { id: commentId },
        data: { reply: null, repliedAt: null, repliedBy: null, pendingReply: null, pendingRepliedBy: null },
      });
      await tx.contentModeration.deleteMany({ where: { kind: "REPLY", targetId: commentId } });
      return true;
    });
    if (!deleted) return { error: "Comment not found." };

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err) {
    logger.error("deleteReply error:", err);
    return { error: "Failed to delete reply." };
  }
}
