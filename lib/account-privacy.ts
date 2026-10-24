import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";
import { db } from "./db";
import { commenterEmailHash } from "./commenter-restrictions";

export const privacyPurposeSchema = z.enum(["export", "delete"]);
export const privacyCodeSchema = z.string().trim().toLowerCase().regex(/^[a-f0-9]{32}$/, "Paste the complete confirmation code from your email.");
export const deleteAccountSchema = z.object({ code: privacyCodeSchema, confirmation: z.literal("DELETE", { error: "Type DELETE to confirm." }) }).strict();
export type PrivacyPurpose = z.infer<typeof privacyPurposeSchema>;
export type PrivacyActor = { userId: string; sessionId: string };
type Client = Pick<PrismaClient, "$transaction">;
const proofSchema = z.object({ email: z.string(), hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
const identifier = (userId: string, purpose: PrivacyPurpose) => `account-privacy:${userId}:${purpose}`;
const digest = (code: string) => createHash("sha256").update(code).digest("hex");
export class AccountPrivacyError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function lockedMember(tx: Prisma.TransactionClient, actor: PrivacyActor, deleting = false) {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actor.userId} FOR UPDATE`;
  const user = await tx.user.findUnique({ where: { id: actor.userId } });
  const session = await tx.session.findFirst({ where: { id: actor.sessionId, userId: actor.userId, expiresAt: { gt: new Date() } }, select: { id: true } });
  if (!user || !session || user.banned || !user.emailVerified) throw new AccountPrivacyError("Sign in with your verified account to continue.", 401);
  if (deleting && user.role !== "user") throw new AccountPrivacyError("Contact hello@anshkosh.com to close an account with staff access, so its responsibilities can be transferred safely.", 403);
  return user;
}

export async function issuePrivacyCode(actor: PrivacyActor, purpose: PrivacyPurpose, client: Client = db) {
  return client.$transaction(async tx => {
    const user = await lockedMember(tx, actor, purpose === "delete");
    const key = identifier(user.id, purpose);
    const previous = await tx.verification.findFirst({ where: { identifier: key }, select: { createdAt: true } });
    if (previous && Date.now() - previous.createdAt.getTime() < 60000) throw new AccountPrivacyError("Wait one minute before requesting another code.", 429);
    const code = randomBytes(16).toString("hex");
    await tx.verification.deleteMany({ where: { identifier: key } });
    const proof = await tx.verification.create({ data: { identifier: key, value: JSON.stringify({ email: user.email, hash: digest(code) }), expiresAt: new Date(Date.now() + 15 * 60000) }, select: { id: true, value: true } });
    return { code, email: user.email, proof };
  });
}

export async function discardUnsentPrivacyCode(proof: { id: string; value: string }, client = db) {
  // Never invalidate a newer request if a delayed mail attempt fails.
  await client.verification.deleteMany({ where: proof });
}

async function consumePrivacyCode(tx: Prisma.TransactionClient, user: { id: string; email: string }, purpose: PrivacyPurpose, code: string) {
  const proof = await tx.verification.findFirst({ where: { identifier: identifier(user.id, purpose), expiresAt: { gt: new Date() } } });
  let parsed: z.infer<typeof proofSchema> | undefined;
  try { parsed = proofSchema.parse(JSON.parse(proof?.value ?? "null")); } catch { /* Invalid stored proof fails closed. */ }
  if (!proof || !parsed || parsed.email !== user.email || !timingSafeEqual(Buffer.from(parsed.hash, "hex"), Buffer.from(digest(code), "hex"))) {
    throw new AccountPrivacyError("The code is invalid or expired. Request a new code and try again.");
  }
  await tx.verification.delete({ where: { id: proof.id } });
}

export async function exportAccountData(actor: PrivacyActor, code: string, client: Client = db) {
  return client.$transaction(async tx => {
    const user = await lockedMember(tx, actor);
    await consumePrivacyCode(tx, user, "export", code);
    // Measure uncompressed content in PostgreSQL before materializing it in the
    // web process. TOAST/compressed storage sizes would underestimate large JSON.
    const estimated = await tx.$queryRaw<Array<{ bytes: bigint }>>`
      SELECT COALESCE(SUM(content_bytes), 0)::bigint AS bytes FROM (
        SELECT octet_length(to_jsonb(s)::text)::bigint AS content_bytes FROM "Startup" s WHERE s."founderId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(r)::text)::bigint FROM "StartupRevision" r JOIN "Startup" s ON s.id = r."startupId" WHERE s."founderId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(f)::text)::bigint FROM "StartupFounder" f JOIN "Startup" s ON s.id = f."startupId" WHERE s."founderId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(b)::text)::bigint FROM "BetaTesterProgram" b JOIN "Startup" s ON s.id = b."startupId" WHERE s."founderId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(u)::text)::bigint FROM "StartupUpdate" u JOIN "Startup" s ON s.id = u."startupId" WHERE s."founderId" = ${user.id}
        UNION ALL SELECT octet_length(c.reply)::bigint FROM "Comment" c JOIN "Startup" s ON s.id = c."startupId" WHERE s."founderId" = ${user.id} AND c.reply IS NOT NULL
        UNION ALL SELECT octet_length(c."pendingReply")::bigint FROM "Comment" c JOIN "Startup" s ON s.id = c."startupId" WHERE s."founderId" = ${user.id} AND c."pendingReply" IS NOT NULL
        UNION ALL SELECT octet_length(to_jsonb(j)::text)::bigint FROM "FounderJournalEntry" j WHERE j."authorId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(r)::text)::bigint FROM "FounderJournalRevision" r JOIN "FounderJournalEntry" j ON j.id = r."entryId" WHERE j."authorId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(j)::text)::bigint FROM "JournalPost" j WHERE j."authorId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(m)::text)::bigint FROM "MediaUpload" m WHERE m."userId" = ${user.id}
        UNION ALL SELECT octet_length(to_jsonb(c)::text)::bigint FROM "Comment" c WHERE c."authorUserId" = ${user.id}
      ) owned_content`;
    if (!estimated[0] || estimated[0].bytes > BigInt(20 * 1024 * 1024)) throw new AccountPrivacyError("This account needs a larger export. Contact hello@anshkosh.com for assistance.", 413);
    // Explicit projections: never spread auth rows or export applicants/commenters.
    const account = {
      id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified,
      image: user.image, bio: user.bio, location: user.location, websiteUrl: user.websiteUrl,
      dateOfBirth: user.dateOfBirth, founderMode: user.founderMode,
      notifyStartupReviews: user.notifyStartupReviews, notifyVoteMilestones: user.notifyVoteMilestones,
      createdAt: user.createdAt, updatedAt: user.updatedAt,
    };
    const linkedSignIns = await tx.account.findMany({ where: { userId: user.id }, select: { providerId: true, createdAt: true } });
    const startups = await tx.startup.findMany({ where: { founderId: user.id }, take: 10001, select: {
      id: true, name: true, slug: true, tagline: true, description: true, websiteUrl: true,
      videoUrl: true, logoUrl: true, galleryImages: true, founderName: true, categoryId: true,
      status: true, metadata: true, createdAt: true, updatedAt: true, publishedAt: true,
      startupPhone: true, problemStatement: true, solutionStatement: true, targetAudience: true,
      prototypeStatus: true, tractionEvidence: true,
      founders: { select: { name: true, role: true, photoUrl: true, linkedinUrl: true, twitterUrl: true, sortOrder: true } },
      revision: { select: { data: true, status: true, createdAt: true, updatedAt: true } },
      betaTesterProgram: { select: { enabled: true, description: true, reward: true } },
    } });
    const updates = await tx.startupUpdate.findMany({ where: { startup: { founderId: user.id } }, take: 10001, select: { startupId: true, title: true, body: true, imageUrl: true, createdAt: true, updatedAt: true } });
    const replies = await tx.comment.findMany({ where: { startup: { founderId: user.id }, OR: [{ reply: { not: null } }, { pendingReply: { not: null } }] }, take: 10001, select: { startupId: true, reply: true, repliedAt: true, repliedBy: true, pendingReply: true, pendingRepliedBy: true } });
    const comments = await tx.comment.findMany({ where: { authorUserId: user.id }, take: 10001, select: {
      id: true, startupId: true, authorName: true, authorEmail: true, body: true, status: true, createdAt: true, updatedAt: true,
    } });
    const journal = await tx.founderJournalEntry.findMany({ where: { authorId: user.id }, take: 10001, select: {
      id: true, startupId: true, title: true, body: true, contentJson: true, mediaKeys: true,
      prompt: true, visibility: true, milestone: true, milestoneDone: true, publishedAt: true,
      createdAt: true, updatedAt: true, revision: { select: { data: true, status: true, scheduledAt: true, createdAt: true, updatedAt: true } },
    } });
    const editorialPosts = await tx.journalPost.findMany({ where: { authorId: user.id }, take: 10001, select: { id: true, title: true, slug: true, excerpt: true, authorName: true, contentJson: true, contentHtml: true, coverImageUrl: true, status: true, tags: true, metaTitle: true, metaDescription: true, metaKeywords: true, canonicalUrl: true, createdAt: true, updatedAt: true, publishedAt: true, scheduledAt: true } });
    const uploads = await tx.mediaUpload.findMany({ where: { userId: user.id, erasureRequestedAt: null }, take: 10001, select: { key: true, bytes: true, createdAt: true } });
    if ([startups, updates, replies, comments, journal, editorialPosts, uploads].some(rows => rows.length > 10000)) throw new AccountPrivacyError("This account needs a larger export. Contact hello@anshkosh.com for assistance.", 413);
    const result = {
      formatVersion: 1, exportedAt: new Date().toISOString(), account, linkedSignIns,
      startups, updates, replies, comments, journal, editorialPosts,
      uploads: uploads.map(upload => ({ ...upload, downloadPath: `/api/uploads/serve/${upload.key}` })),
      notes: ["Uploads are listed as download paths; their file bytes are not included.", "Other people's comments and beta application/contact details are excluded.", "Comments linked to this verified account are included; anonymous comments that only used an unverified email are not linked to this export.", "Anonymous votes, beta applications and newsletter subscriptions are separate from account-linked records.", "Passwords, session tokens, OAuth secrets and internal security/moderation records are excluded."],
    };
    const json = JSON.stringify(result, null, 2);
    if (Buffer.byteLength(json) > 25 * 1024 * 1024) throw new AccountPrivacyError("This account needs a larger export. Contact hello@anshkosh.com for assistance.", 413);
    return json;
  }, { isolationLevel: "RepeatableRead", timeout: 30000 });
}

export async function eraseAccount(actor: PrivacyActor, code: string, client: Client = db) {
  return client.$transaction(async tx => {
    // Same lock order as uploads. No in-flight upload can recreate an erased file.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`uploads:${actor.userId}`}))::text`;
    const user = await lockedMember(tx, actor, true);
    await consumePrivacyCode(tx, user, "delete", code);
    const authoredComments = await tx.comment.findMany({ where: { authorUserId: user.id }, select: { id: true, authorEmail: true } });
    await tx.mediaUpload.updateMany({ where: { userId: user.id }, data: { erasureRequestedAt: new Date() } });
    await tx.founderJournalRevision.deleteMany({ where: { entry: { authorId: user.id } } });
    await tx.founderJournalEntry.deleteMany({ where: { authorId: user.id } });
    // Preserve entries authored by someone else if they reference an owned startup.
    await tx.founderJournalEntry.updateMany({ where: { startup: { founderId: user.id } }, data: { startupId: null } });
    await tx.startupRevision.deleteMany({ where: { startup: { founderId: user.id } } });
    await tx.startup.deleteMany({ where: { founderId: user.id } });
    await tx.journalPost.deleteMany({ where: { authorId: user.id } });
    const oldEmailHashes = [...new Set(authoredComments.map(comment => commenterEmailHash(comment.authorEmail)).filter((hash): hash is string => Boolean(hash)))];
    if (oldEmailHashes.length) await tx.commenterBlock.deleteMany({ where: { emailHash: { in: oldEmailHashes } } });
    await tx.commenterBlock.deleteMany({ where: { sourceCommentId: { in: authoredComments.map(comment => comment.id) } } });
    await tx.comment.updateMany({ where: { authorUserId: user.id }, data: { authorUserId: null } });
    await tx.moderationAccountBan.deleteMany({ where: { targetUserId: user.id } });
    await tx.moderationAccountBan.updateMany({ where: { createdById: user.id }, data: { createdById: null } });
    await tx.moderationAccountBan.updateMany({ where: { revokedById: user.id }, data: { revokedById: null } });
    await tx.commenterBlock.updateMany({ where: { createdById: user.id }, data: { createdById: null } });
    await tx.commenterBlock.updateMany({ where: { revokedById: user.id }, data: { revokedById: null } });
    const emailHash = commenterEmailHash(user.email);
    if (emailHash) await tx.commenterBlock.deleteMany({ where: { emailHash } });
    await tx.notificationOutbox.deleteMany({ where: { payload: { path: ["to"], equals: user.email } } });
    await tx.verification.deleteMany({ where: { OR: [{ value: user.id }, { identifier: user.email }, { identifier: { startsWith: `account-privacy:${user.id}:` } }] } });
    await tx.user.delete({ where: { id: user.id } }); // Sessions and provider accounts cascade.
    return { success: true as const };
  }, { timeout: 30000 });
}
