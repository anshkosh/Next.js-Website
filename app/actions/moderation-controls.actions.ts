"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deliverNotification } from "@/lib/notification-outbox";
import { storeApprovedCommentEmail } from "@/lib/comment-notifications";
import { commenterEmailHash, moderationExpiry, parseModerationDuration } from "@/lib/commenter-restrictions";
import { revalidateSavedPath } from "@/lib/cache-after-save";

const staffRoles = ["admin", "reviewer"];
type CommentModerationResult = { error: string } | { success: true; notificationPending?: boolean };

async function getModerator() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !staffRoles.includes(session.user.role ?? "")) return null;
  return session.user;
}

function validReason(reason: unknown): reason is string {
  return typeof reason === "string" && reason.trim().length >= 5 && reason.trim().length <= 500;
}

function validId(id: unknown): id is string {
  return typeof id === "string" && id.length > 0 && id.length <= 100;
}

function refreshModeration(commentSlug?: string) {
  revalidateSavedPath("/admin/comments");
  revalidateSavedPath("/admin/bans");
  revalidateSavedPath("/admin/content-review");
  revalidateSavedPath("/");
  revalidateSavedPath("/leaderboard");
  if (commentSlug) revalidateSavedPath(`/startups/${commentSlug}`);
}

export async function blockCommenterFromComment(commentId: string, reason: string, durationValue: string) {
  const moderator = await getModerator();
  if (!moderator) return { error: "Moderator access required." };
  if (!validId(commentId) || !validReason(reason)) return { error: "Add a reason of 5–500 characters." };
  const duration = parseModerationDuration(durationValue);
  if (!duration) return { error: "Choose a valid block duration." };

  const now = new Date();
  const expiresAt = moderationExpiry(duration, now);
  try {
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const comment = await tx.comment.findUnique({ where: { id: commentId }, select: { authorEmail: true, authorUserId: true, startup: { select: { slug: true } } } });
      if (!comment) return { error: "Comment no longer exists." };
      if (!comment.authorUserId) return { error: "This email was not verified when the comment was submitted, so it cannot be blocked safely." };
      const linkedUser = await tx.user.findUnique({ where: { id: comment.authorUserId }, select: { role: true } });
      if (linkedUser?.role !== "user") return { error: "Only ordinary user accounts can be restricted here." };
      const emailHash = commenterEmailHash(comment.authorEmail);
      if (!emailHash) return { error: "Commenter restrictions are unavailable until the server secret is configured." };
      const existing = await tx.commenterBlock.findUnique({ where: { emailHash } });
      if (existing && !existing.revokedAt && (!existing.expiresAt || existing.expiresAt > now)) return { error: "This email is already blocked from commenting." };
      if (existing) {
        await tx.commenterBlock.update({ where: { id: existing.id }, data: { reason: reason.trim(), sourceCommentId: commentId, accountBanId: null, expiresAt, createdAt: now, createdById: moderator.id, revokedAt: null, revokedById: null } });
      } else {
        await tx.commenterBlock.create({ data: { emailHash, reason: reason.trim(), sourceCommentId: commentId, expiresAt, createdById: moderator.id } });
      }
      return { success: true as const, slug: comment.startup.slug };
    });
    if (result.error) return result;
    refreshModeration(result.slug);
    return { success: true };
  } catch {
    return { error: "The commenter block could not be saved. Refresh and try again." };
  }
}

export async function banCommentAccount(commentId: string, reason: string, durationValue: string) {
  const moderator = await getModerator();
  if (!moderator) return { error: "Moderator access required." };
  if (!validId(commentId) || !validReason(reason)) return { error: "Add a reason of 5–500 characters." };
  const duration = parseModerationDuration(durationValue);
  if (!duration) return { error: "Choose a valid ban duration." };

  const comment = await db.comment.findUnique({ where: { id: commentId }, select: { authorUserId: true, authorEmail: true, startup: { select: { slug: true } } } });
  if (!comment?.authorUserId) return { error: "This comment is not linked to a verified Anshkosh account. Use the commenter block instead." };

  const now = new Date();
  const expiresAt = moderationExpiry(duration, now);
  const banId = randomUUID();
  const banMarker = `[moderation-ban:${banId}]`;
  try {
    const result = await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${comment.authorUserId} FOR UPDATE`;
      const target = await tx.user.findUnique({ where: { id: comment.authorUserId! }, select: { id: true, role: true, banned: true, banReason: true, banExpires: true } });
      if (!target || target.role !== "user" || target.id === moderator.id) return { error: "Only ordinary user accounts linked to this comment can be banned here." };
      if (target.banned && (!target.banExpires || target.banExpires > now)) return { error: "This account already has an active ban." };

      await tx.$queryRaw`SELECT id FROM "Comment" WHERE id = ${commentId} FOR UPDATE`;
      const lockedComment = await tx.comment.findUnique({ where: { id: commentId }, select: { authorEmail: true, authorUserId: true, startup: { select: { slug: true } } } });
      if (!lockedComment || lockedComment.authorUserId !== target.id) return { error: "The verified account link changed or the comment no longer exists." };
      const emailHash = commenterEmailHash(lockedComment.authorEmail);
      if (!emailHash) return { error: "Account bans are unavailable until the server secret is configured." };

      const previous = await tx.moderationAccountBan.findFirst({ where: { targetUserId: target.id, revokedAt: null }, orderBy: { createdAt: "desc" } });
      if (previous) {
        const stillOwnsBan = target.banned && target.banReason?.includes(previous.banMarker);
        if (stillOwnsBan && (!previous.expiresAt || previous.expiresAt > now)) return { error: "This account already has an active moderation ban." };
        await tx.moderationAccountBan.update({ where: { id: previous.id }, data: { revokedAt: previous.expiresAt && previous.expiresAt <= now ? previous.expiresAt : now, sourceCommentId: null } });
      }

      await tx.moderationAccountBan.create({ data: { id: banId, targetUserId: target.id, sourceCommentId: commentId, reason: reason.trim(), banMarker, expiresAt, createdById: moderator.id } });
      await tx.user.update({ where: { id: target.id }, data: { banned: true, banReason: `${banMarker} ${reason.trim()}`, banExpires: expiresAt } });
      await tx.session.deleteMany({ where: { userId: target.id } });

      const existingBlock = await tx.commenterBlock.findUnique({ where: { emailHash } });
      const existingBlockActive = existingBlock && !existingBlock.revokedAt && (!existingBlock.expiresAt || existingBlock.expiresAt > now);
      if (!existingBlockActive) {
        if (existingBlock) {
          await tx.commenterBlock.update({ where: { id: existingBlock.id }, data: { reason: reason.trim(), sourceCommentId: commentId, accountBanId: banId, expiresAt, createdAt: now, createdById: moderator.id, revokedAt: null, revokedById: null } });
        } else {
          await tx.commenterBlock.create({ data: { emailHash, reason: reason.trim(), sourceCommentId: commentId, accountBanId: banId, expiresAt, createdById: moderator.id } });
        }
      }
      return { success: true as const, slug: lockedComment.startup.slug };
    });
    if (result.error) return result;
    refreshModeration(result.slug);
    return { success: true };
  } catch {
    return { error: "The account ban could not be saved. Refresh and try again." };
  }
}

export async function revokeCommenterBlock(blockId: string) {
  const moderator = await getModerator();
  if (!moderator) return { error: "Moderator access required." };
  if (!validId(blockId)) return { error: "Invalid block." };
  try {
    const result = await db.$transaction(async tx => {
      const block = await tx.commenterBlock.findUnique({ where: { id: blockId } });
      if (!block || block.revokedAt || (block.expiresAt && block.expiresAt <= new Date())) return { error: "This commenter block is no longer active." };
      if (block.accountBanId) {
        const accountBan = await tx.moderationAccountBan.findUnique({ where: { id: block.accountBanId } });
        if (accountBan && !accountBan.revokedAt && (!accountBan.expiresAt || accountBan.expiresAt > new Date())) {
          const target = await tx.user.findUnique({ where: { id: accountBan.targetUserId }, select: { banned: true, banReason: true } });
          if (target?.banned && target.banReason?.includes(accountBan.banMarker)) return { error: "This email block is linked to an account ban. Revoke that ban to release both." };
          await tx.moderationAccountBan.update({ where: { id: accountBan.id }, data: { revokedAt: new Date(), revokedById: moderator.id, sourceCommentId: null } });
        }
      }
      await tx.commenterBlock.update({ where: { id: blockId }, data: { revokedAt: new Date(), revokedById: moderator.id, sourceCommentId: null, accountBanId: null } });
      return { success: true as const };
    });
    if (result.error) return result;
    refreshModeration();
    return { success: true };
  } catch {
    return { error: "The commenter block could not be removed. Refresh and try again." };
  }
}

export async function revokeModerationAccountBan(banId: string) {
  const moderator = await getModerator();
  if (!moderator) return { error: "Moderator access required." };
  if (!validId(banId)) return { error: "Invalid account ban." };
  try {
    const result = await db.$transaction(async tx => {
      const ban = await tx.moderationAccountBan.findUnique({ where: { id: banId } });
      if (!ban || ban.revokedAt) return { error: "This account ban is no longer active." };
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${ban.targetUserId} FOR UPDATE`;
      const target = await tx.user.findUnique({ where: { id: ban.targetUserId }, select: { id: true, banned: true, banReason: true } });
      if (!target) return { error: "The account no longer exists." };
      const stillOwnsBan = target.banned && target.banReason?.includes(ban.banMarker);
      const expiredAndClearedByAuth = Boolean(ban.expiresAt && ban.expiresAt <= new Date() && !target.banned);
      if (!stillOwnsBan && !expiredAndClearedByAuth) return { error: "The account ban changed elsewhere; no account access was changed." };
      if (stillOwnsBan) await tx.user.update({ where: { id: target.id }, data: { banned: false, banReason: null, banExpires: null } });
      await tx.moderationAccountBan.update({ where: { id: banId }, data: { revokedAt: new Date(), revokedById: moderator.id, sourceCommentId: null } });
      await tx.commenterBlock.updateMany({ where: { accountBanId: banId, revokedAt: null }, data: { revokedAt: new Date(), revokedById: moderator.id, sourceCommentId: null, accountBanId: null } });
      return { success: true as const };
    });
    if (result.error) return result;
    refreshModeration();
    return { success: true };
  } catch {
    return { error: "The account ban could not be removed. Refresh and try again." };
  }
}

export async function setCommentModerationStatus(commentId: string, expectedStatus: string, nextStatus: string, note = ""): Promise<CommentModerationResult> {
  const moderator = await getModerator();
  if (!moderator) return { error: "Moderator access required." };
  if (!validId(commentId) || !["PENDING", "APPROVED", "REJECTED"].includes(expectedStatus) || !["APPROVED", "REJECTED"].includes(nextStatus) || expectedStatus === nextStatus) return { error: "Invalid comment review." };
  if (typeof note !== "string" || note.trim().length > 500 || (nextStatus === "REJECTED" && note.trim().length < 5)) return { error: "Add a review reason of at least 5 characters when hiding or rejecting a comment." };
  try {
    const result = await db.$transaction(async tx => {
      const comment = await tx.comment.findUnique({ where: { id: commentId }, select: { id: true, status: true, startup: { select: { slug: true } } } });
      if (!comment || comment.status !== expectedStatus) return { error: "This comment changed in another review. Refresh before deciding." };
      const reviewedAt = new Date();
      const changed = await tx.comment.updateMany({ where: { id: commentId, status: expectedStatus as "PENDING" | "APPROVED" | "REJECTED" }, data: { status: nextStatus as "APPROVED" | "REJECTED", reviewedBy: moderator.id, reviewedAt, reviewNote: note.trim() || null } });
      if (!changed.count) return { error: "This comment changed in another review. Refresh before deciding." };
      await tx.contentModeration.updateMany({ where: { kind: "COMMENT", targetId: commentId }, data: { status: nextStatus, leaseToken: null, reviewedBy: moderator.id, reviewedAt } });
      const notification = nextStatus === "APPROVED" ? await storeApprovedCommentEmail(tx, commentId) : null;
      return { success: true as const, slug: comment.startup.slug, notificationId: notification?.id ?? null };
    });
    if ("error" in result && typeof result.error === "string") return { error: result.error };
    const notificationDelivered = result.notificationId ? await deliverNotification(result.notificationId) : true;
    refreshModeration(result.slug);
    return { success: true, ...(result.notificationId && !notificationDelivered ? { notificationPending: true } : {}) };
  } catch {
    return { error: "The comment decision could not be saved. Refresh and try again." };
  }
}
