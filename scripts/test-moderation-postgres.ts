import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { invariantTestDatabaseUrl } from "./invariant-test-database";

async function main() {
  process.env.DATABASE_URL = invariantTestDatabaseUrl(process.env.MODERATION_TEST_DATABASE_URL);
  process.env.AI_MODERATION_ENABLED = "true";
  process.env.MODERATION_CF_ACCOUNT_ID = "a".repeat(32);
  process.env.MODERATION_CF_API_TOKEN = "isolated-fixture-never-a-real-token";
  const { db } = await import("../lib/db");
  const { processModeration, reserveModerationRequest } = await import("../lib/moderation-worker");
  const { queueModeration } = await import("../lib/moderation-store");
  const { commentContent, replyContent, journalContent } = await import("../lib/moderation-policy");
  const { createStartupUpdate, editStartupUpdate } = await import("../lib/startup-update-store");
  const { applyModeration } = await import("../lib/moderation-source");
  const { publicStartupCardSelect } = await import("../lib/public-startup-card");
  const oldFetch = globalThis.fetch;
  let respond: () => Promise<Response> = async () => Response.json({ success: true, result: { response: "safe" } });
  let requests = 0;
  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), `https://api.cloudflare.com/client/v4/accounts/${"a".repeat(32)}/ai/run/@cf/meta/llama-guard-3-8b`);
    assert.ok(!String(init?.body).includes("never-send@example.test"), "Private comment email must not be sent to AI");
    requests++; return respond();
  };
  let owner: string | undefined; let category: string | undefined;
  const budgetDay = new Date().toISOString().slice(0, 10);
  const futureDay = "2099-01-02";
  try {
    assert.equal(await db.startup.count(), 0, "Disposable moderation tests require an empty startup table");
    assert.equal(await db.contentModeration.count(), 0, "Disposable moderation tests require an empty moderation table");
    assert.equal(await db.moderationBudget.count(), 0, "Disposable moderation tests require an empty budget table");
    const suffix = randomUUID();
    owner = (await db.user.create({ data: { name: "Moderation fixture", email: `moderation-${suffix}@example.test`, emailVerified: true } })).id;
    category = (await db.category.create({ data: { name: "Moderation fixture", slug: `moderation-${suffix}` } })).id;
    const startup = await db.startup.create({ data: { founderId: owner, categoryId: category, status: "LIVE", name: "Moderation fixture", slug: `moderation-${suffix}`, tagline: "Disposable fixture", description: "Not production data", websiteUrl: "https://example.test", founderName: "Fixture", galleryImages: [] } });
    async function comment(body = "What did the interviews teach you?") {
      return db.$transaction(async tx => {
        const row = await tx.comment.create({ data: { startupId: startup.id, authorName: "Visitor", authorEmail: "never-send@example.test", body } });
        await queueModeration(tx, "COMMENT", row.id, commentContent(row)); return row;
      });
    }
    const safe = await comment("This product sucks. I would not pay for it. Build something useful.");
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: safe.id } })).status, "APPROVED");

    const abusive = await comment("You are a useless fraud and an idiot. Nobody with a brain would use this garbage, shut it down.");
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: abusive.id } })).status, "PENDING", "A safe model response cannot publish a detected personal attack");
    assert.equal((await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "COMMENT", targetId: abusive.id } } })).status, "FLAGGED");

    const r3Attack = await comment("[MODTEST-R3 #3] You are a clueless fraud and a complete idiot, nobody with a working brain would trust an incompetent clown like you.");
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: r3Attack.id } })).status, "PENDING", "The R3 personal insult must stay private even with a safe model response");
    assert.equal((await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "COMMENT", targetId: r3Attack.id } } })).status, "FLAGGED");

    const threat = await comment("Shut down this fake WardDesk pilot right now or we will show up at the test booth and smash your register table.");
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: threat.id } })).status, "PENDING", "A safe model response cannot publish a detected physical threat");
    assert.equal((await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "COMMENT", targetId: threat.id } } })).status, "FLAGGED");

    const held = await comment();
    respond = async () => Response.json({ success: true, result: { response: "unsafe\nS10" } });
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: held.id } })).status, "PENDING");
    assert.equal((await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "COMMENT", targetId: held.id } } })).status, "FLAGGED");

    const created = await createStartupUpdate(owner, { startupId: startup.id, title: "Interview lessons", body: "Five founders helped us improve onboarding." });
    assert.equal(created.update.status, "PENDING");
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id } })).updateCount, 0);
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id }, select: publicStartupCardSelect() })).updates.length, 0, "Pending updates must not leak through public cards");
    respond = async () => Response.json({ success: true, result: { response: "safe" } });
    await processModeration();
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id } })).updateCount, 1);
    await editStartupUpdate(owner, created.update.id, { body: "We are testing a different onboarding flow." });
    assert.equal(await db.startupUpdate.count({ where: { startupId: startup.id, status: "APPROVED" } }), 0);
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id } })).updateCount, 0);
    await processModeration();
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id } })).updateCount, 1);

    // A reply replacement changes while its first request is in flight. The
    // original published reply survives both the obsolete result and a flag.
    await db.comment.update({ where: { id: safe.id }, data: { reply: "Original approved reply", repliedBy: "Founder", repliedAt: new Date() } });
    await db.$transaction(async tx => {
      const row = await tx.comment.update({ where: { id: safe.id }, data: { pendingReply: "First replacement", pendingRepliedBy: "Founder" } });
      await queueModeration(tx, "REPLY", safe.id, replyContent(row));
    });
    respond = async () => {
      await db.$transaction(async tx => {
        const row = await tx.comment.update({ where: { id: safe.id }, data: { pendingReply: "Changed during inference" } });
        await queueModeration(tx, "REPLY", safe.id, replyContent(row));
      });
      respond = async () => Response.json({ success: true, result: { response: "unsafe\nS10" } });
      return Response.json({ success: true, result: { response: "safe" } });
    };
    await processModeration();
    const reply = await db.comment.findUniqueOrThrow({ where: { id: safe.id } });
    assert.equal(reply.reply, "Original approved reply"); assert.equal(reply.pendingReply, "Changed during inference");

    const entry = await db.founderJournalEntry.create({ data: { authorId: owner, startupId: startup.id, title: "Private thoughts", body: "PRIVATE-FIXTURE-MUST-NOT-LEAVE", visibility: "PRIVATE" } });
    const submitted = { title: "Journal submission", body: "What we learned in the pilot.", visibility: "PUBLIC", startupId: startup.id };
    const revision = await db.founderJournalRevision.create({ data: { entryId: entry.id, data: submitted } });
    await db.$transaction(tx => queueModeration(tx, "JOURNAL", revision.id, journalContent(submitted, 1)));
    const beforePrivate = requests; await processModeration(); assert.equal(requests, beforePrivate, "Withdrawn/private entries must not trigger AI calls");
    await db.founderJournalEntry.update({ where: { id: entry.id }, data: { visibility: "PUBLIC" } });
    await db.$transaction(tx => queueModeration(tx, "JOURNAL", revision.id, journalContent(submitted, 1)));
    respond = async () => Response.json({ success: true, result: { response: "safe" } });
    await processModeration();
    assert.equal((await db.founderJournalRevision.findUniqueOrThrow({ where: { id: revision.id } })).status, "PENDING_REVIEW");
    assert.equal((await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "JOURNAL", targetId: revision.id } } })).status, "SAFE", "JSONB persistence must not invalidate the journal content hash");
    assert.equal((await db.founderJournalEntry.findUniqueOrThrow({ where: { id: entry.id } })).approvedAt, null);

    // Reviewers can remove an AI-approved update, with its counter committed too.
    const approved = await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "UPDATE", targetId: created.update.id } } });
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${startup.id} FOR UPDATE`;
      assert.ok(await applyModeration(tx, approved, false, true));
    });
    assert.equal((await db.startup.findUniqueOrThrow({ where: { id: startup.id } })).updateCount, 0);

    const unavailable = await comment();
    respond = async () => Response.json({ success: true, result: { response: "safe except this explanation" } });
    await processModeration();
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: unavailable.id } })).status, "PENDING");
    const failure = await db.contentModeration.findUniqueOrThrow({ where: { kind_targetId: { kind: "COMMENT", targetId: unavailable.id } } });
    assert.equal(failure.status, "UNAVAILABLE");

    const banned = await comment();
    await db.user.update({ where: { id: owner }, data: { banned: true } });
    const beforeBan = requests; await processModeration(); assert.equal(requests, beforeBan, "Do not infer or auto-publish for a banned founder");
    assert.equal((await db.comment.findUniqueOrThrow({ where: { id: banned.id } })).status, "PENDING");
    await db.user.update({ where: { id: owner }, data: { banned: false } });

    const reservations = await Promise.all(Array.from({ length: 120 }, () => reserveModerationRequest(new Date(`${futureDay}T12:00:00Z`))));
    assert.equal(reservations.filter(Boolean).length, 100, "Concurrent workers must share the hard request cap");
    assert.equal((await db.moderationBudget.findUniqueOrThrow({ where: { day: futureDay } })).requests, 100);

    await db.founderJournalRevision.delete({ where: { id: revision.id } });
    assert.equal(await db.contentModeration.count({ where: { revisionId: revision.id } }), 0, "Journal withdrawal erases moderation metadata");
    await db.comment.delete({ where: { id: safe.id } });
    assert.equal(await db.contentModeration.count({ where: { commentId: safe.id } }), 0, "Deletion cascades to reply and comment moderation metadata");
    console.log("Moderation PostgreSQL: pending visibility, safe publication, edits, private drafts, human overrides, cascades and concurrent daily cap passed; no external requests.");
  } finally {
    globalThis.fetch = oldFetch;
    if (owner) {
      await db.founderJournalRevision.deleteMany({ where: { entry: { authorId: owner } } });
      await db.founderJournalEntry.deleteMany({ where: { authorId: owner } });
      await db.startup.deleteMany({ where: { founderId: owner } }); await db.user.delete({ where: { id: owner } });
      await db.moderationBudget.deleteMany({ where: { day: { in: [budgetDay, futureDay] } } });
    }
    if (category) await db.category.delete({ where: { id: category } });
    await db.$disconnect();
  }
}
main().catch(() => { console.error("Disposable moderation verification failed"); process.exitCode = 1; });
