"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import {
  submitCommentSchema,
  replyToCommentSchema,
} from "@/lib/validators/comment.schema";

const COMMENTS_PAGE_SIZE = 10;

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

    // Verify Turnstile CAPTCHA
    const tokenValid = await verifyTurnstileToken(turnstileToken);
    if (!tokenValid) {
      return { error: "CAPTCHA verification failed. Please try again." };
    }

    // Rate limiting: 3 comments per IP per hour
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";
    const fingerprint = generateFingerprint(ip, userAgent);
    const rateLimitKey = `rate-limit:comment:${fingerprint}`;
    const isAllowed = await checkRateLimit(rateLimitKey, 3, 3600);
    if (!isAllowed) {
      return {
        error: "You've posted too many comments recently. Please try again later.",
      };
    }

    // Ensure startup is LIVE
    const startup = await db.startup.findUnique({
      where: { id: startupId, status: "LIVE" },
      select: { id: true, slug: true },
    });
    if (!startup) {
      return { error: "Startup not found." };
    }

    await db.comment.create({
      data: {
        startupId,
        authorName,
        authorEmail,
        body,
        status: "PENDING",
      },
    });

    revalidatePath(`/startups/${startup.slug}`);
    return { success: true };
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
  try {
    const rows = await db.comment.findMany({
      where: { startupId, status: "APPROVED", startup: { status: "LIVE" } },
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
export async function approveComment(commentId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "reviewer")
    ) {
      return { error: "Unauthorized" };
    }

    const comment = await db.comment.update({
      where: { id: commentId },
      data: { status: "APPROVED" },
      include: { startup: { select: { slug: true } } },
    });

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/admin/comments");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err) {
    logger.error("approveComment error:", err);
    return { error: "Failed to approve comment." };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Admin — Reject a comment
// ──────────────────────────────────────────────────────────────────────────────
export async function rejectComment(commentId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (
      !session ||
      (session.user.role !== "admin" && session.user.role !== "reviewer")
    ) {
      return { error: "Unauthorized" };
    }

    const comment = await db.comment.update({
      where: { id: commentId },
      data: { status: "REJECTED" },
      include: { startup: { select: { slug: true } } },
    });

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/admin/comments");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err) {
    logger.error("rejectComment error:", err);
    return { error: "Failed to reject comment." };
  }
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
    if (!session) return { error: "Unauthorized" };

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

    await db.comment.update({
      where: { id: commentId },
      data: {
        reply,
        repliedAt: new Date(),
        repliedBy: session.user.name ?? "Founder",
      },
    });

    revalidatePath(`/startups/${comment.startup.slug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
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
    if (!session) return { error: "Unauthorized" };

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

    await db.comment.update({
      where: { id: commentId },
      data: { reply: null, repliedAt: null, repliedBy: null },
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
