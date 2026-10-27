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

const COMMENTS_PAGE_SIZE = 10;
const COMMENT_LIMIT_MESSAGE = "This network has reached its limit of 3 comments per hour. Please try again later.";

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
}

export async function fetchOwnPendingComments(startupId: string): Promise<PendingComment[]> {
  if (!startupIdSchema.safeParse(startupId).success) return [];
  const ids = readCommentReceipts((await cookies()).get(COMMENT_RECEIPT_COOKIE)?.value, process.env.BETTER_AUTH_SECRET);
  if (!ids.length) return [];
  const rows = await db.comment.findMany({
    where: { id: { in: ids }, startupId, status: "PENDING", startup: publicStartupWhere },
    orderBy: { createdAt: "desc" }, take: 20,
    select: { id: true, authorName: true, body: true, createdAt: true },
  });
  return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
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
    const authorUserId = signedIn?.user.emailVerified && !signedIn.user.banned && signedIn.user.email.trim().toLowerCase() === authorEmail
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
      select: { id: true, authorName: true, body: true, createdAt: true },
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
    return { success: true, warning: commentLanguageReasons(`${authorName}\n${body}`).length ? COMMENT_LANGUAGE_WARNING : undefined, pendingComment: { ...comment, createdAt: comment.createdAt.toISOString() } };
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
        // authorEmail is intentionally excluded from public fetch
      },
    });

    const hasMore = rows.length > COMMENTS_PAGE_SIZE;
    const slice = hasMore ? rows.slice(0, COMMENTS_PAGE_SIZE) : rows;

    return {
      comments: slice.map((c) => ({
        ...c,
        repliedAt: c.repliedAt?.toISOString() ?? null,
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

    await db.$transaction(async tx => {
      await tx.comment.update({
        where: { id: commentId },
        data: { reply: null, repliedAt: null, repliedBy: null, pendingReply: null, pendingRepliedBy: null },
      });
      await tx.contentModeration.deleteMany({ where: { kind: "REPLY", targetId: commentId } });
    });

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err) {
    logger.error("deleteReply error:", err);
    return { error: "Failed to delete reply." };
  }
}
