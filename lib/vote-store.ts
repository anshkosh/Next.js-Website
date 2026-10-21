import { db } from "./db";
import { voteTransition } from "./voting";
import { publicStartupWhere } from "./startup-visibility";

// Serialize changes to both vote tables and the counters using the startup row.
export async function recordVote(startupId: string, requested: -1 | 1, identity: { fingerprintHash: string; cookieId: string }) {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${startupId} FOR UPDATE`;
    const startup = await tx.startup.findUnique({
      where: { id: startupId, ...publicStartupWhere },
      select: { id: true, status: true, name: true, slug: true, category: { select: { slug: true } }, founder: { select: { email: true } } },
    });
    if (!startup || startup.status !== "LIVE") return { success: false as const, error: "Only published startups can receive votes." };
    const where = { startupId, OR: [{ fingerprintHash: identity.fingerprintHash }, { cookieId: identity.cookieId }] };
    const upvotes = await tx.upvote.findMany({ where, select: { id: true } });
    const downvotes = await tx.downvote.findMany({ where, select: { id: true } });
    const current = upvotes.length ? 1 : downvotes.length ? -1 : 0;
    const { next } = voteTransition(current, requested);
    // Also reconcile matching records left by an older client, preserving other votes.
    if (upvotes.length) await tx.upvote.deleteMany({ where: { id: { in: upvotes.map(vote => vote.id) } } });
    if (downvotes.length) await tx.downvote.deleteMany({ where: { id: { in: downvotes.map(vote => vote.id) } } });
    if (next === 1) await tx.upvote.create({ data: { startupId, ...identity } });
    if (next === -1) await tx.downvote.create({ data: { startupId, ...identity } });
    const counts = await tx.startup.update({
      where: { id: startupId },
      data: {
        upvoteCount: { increment: Number(next === 1) - upvotes.length },
        downvoteCount: { increment: Number(next === -1) - downvotes.length },
      },
      select: { upvoteCount: true, downvoteCount: true, signalCount: true },
    });
    return { success: true as const, vote: next, ...counts, startup, addedUpvote: next === 1 && !upvotes.length };
  });
}

export async function recountVotes() {
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Startup" ORDER BY id FOR UPDATE`;
    return tx.$executeRaw`
      UPDATE "Startup" SET
        "upvoteCount" = (SELECT COUNT(*)::integer FROM "Upvote" WHERE "Upvote"."startupId" = "Startup"."id"),
        "downvoteCount" = (SELECT COUNT(*)::integer FROM "Downvote" WHERE "Downvote"."startupId" = "Startup"."id")
    `;
  });
}
