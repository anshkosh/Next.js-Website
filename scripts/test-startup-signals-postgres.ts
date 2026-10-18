// Run with SIGNALS_TEST_DATABASE_URL=... npx tsx scripts/test-startup-signals-postgres.ts.
// All fixtures use session-local temporary tables that shadow the application
// tables. Nothing reads/writes application rows. The transaction always rolls back.
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { rankSignals, signalSnapshotQuery, type SignalSnapshot } from "../lib/startup-signals";

export async function verifySignalsPostgres(db: PrismaClient) {
  const rollback = new Error("rollback temporary signal fixtures");
  try {
    await db.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET LOCAL TIME ZONE 'America/Denver'");
      const tables = [
        '"User" (id text, email text, name text)',
        '"Startup" (id text, name text, "founderId" text, status text)',
        '"Upvote" ("startupId" text)',
        '"Downvote" ("startupId" text)',
        '"FeaturedStartup" ("startupId" text, "featuredUntil" timestamp)',
        '"StartupUpdate" ("startupId" text, "createdAt" timestamp, body text DEFAULT \'Progress fixture\')',
        '"FounderJournalEntry" ("startupId" text, "authorId" text, visibility text, "approvedAt" timestamp, "publishedAt" timestamp, body text DEFAULT \'Journal fixture\')',
        '"Comment" ("startupId" text, "authorEmail" text, body text, status text, reply text, "repliedAt" timestamp, "createdAt" timestamp, "authorName" text DEFAULT \'Fixture commenter\')',
      ];
      for (const table of tables) await tx.$executeRawUnsafe(`CREATE TEMP TABLE ${table} ON COMMIT DROP`);
      await tx.$executeRawUnsafe(`INSERT INTO "User" VALUES ('owner', 'owner@example.invalid', 'Owner')`);
      await tx.$executeRawUnsafe(`INSERT INTO "Startup" VALUES ('one','One','owner','LIVE'),('two','Two','owner','LIVE'),('draft','Draft','owner','DRAFT')`);
      await tx.$executeRawUnsafe(`INSERT INTO "Upvote" VALUES ('one'),('one'),('two')`);
      await tx.$executeRawUnsafe(`INSERT INTO "Downvote" VALUES ('one')`);
      await tx.$executeRawUnsafe(`INSERT INTO "FeaturedStartup" ("startupId") VALUES ('one')`);
      await tx.$executeRawUnsafe(`INSERT INTO "StartupUpdate" ("startupId","createdAt") VALUES ('one','2026-10-01 00:01'),('one','2026-10-01 23:59'),('one','2026-10-02'),('two','2026-10-01')`);
      await tx.$executeRawUnsafe(`INSERT INTO "StartupUpdate" VALUES ('one','2026-10-10','   ')`);
      await tx.$executeRawUnsafe(`INSERT INTO "FounderJournalEntry" ("startupId","authorId",visibility,"approvedAt","publishedAt") VALUES
        ('one','owner','PUBLIC','2026-10-01','2026-10-01'),
        ('one','owner','PUBLIC','2026-10-17 23:59','2026-10-17 23:59'),
        ('one','owner','PRIVATE','2026-10-04','2026-10-04'),
        ('one','owner','PUBLIC',NULL,'2026-10-05'),
        ('one','owner','PUBLIC','2026-10-06','2026-11-01'),
        ('one','someone-else','PUBLIC','2026-10-07','2026-10-07')`);
      await tx.$executeRawUnsafe(`INSERT INTO "Comment" ("startupId","authorEmail",body,status,reply,"repliedAt","createdAt") VALUES
        ('one',' A@example.invalid ','Feedback','APPROVED','Reply','2026-10-17 23:59','2026-10-17 23:59'),
        ('one','a@EXAMPLE.invalid','Repeated feedback','APPROVED','Edited reply','2026-10-03','2026-10-02'),
        ('one','b@example.invalid','Feedback','APPROVED','   ','2026-10-02','2026-10-01'),
        ('one','c@example.invalid','Feedback','APPROVED','Undated reply',NULL,'2026-10-01'),
        ('one',' OWNER@example.invalid ','Self','APPROVED','Self reply','2026-10-02','2026-10-01'),
        ('one','pending@example.invalid','Pending','PENDING','Reply','2026-10-02','2026-10-01'),
        ('one','rejected@example.invalid','Rejected','REJECTED','Reply','2026-10-02','2026-10-01'),
        ('one','blank@example.invalid','   ','APPROVED',NULL,NULL,'2026-10-01'),
        ('one','','No address','APPROVED',NULL,NULL,'2026-10-01'),
        ('two','a@example.invalid','Different startup','APPROVED','Reply','2026-10-02','2026-10-01')`);
      await tx.$executeRawUnsafe(`UPDATE "Comment" SET "authorName"='' WHERE body='No address'`);
      await tx.$executeRawUnsafe(`INSERT INTO "Comment" VALUES
        ('one','','Legacy feedback','APPROVED','Legacy reply','2026-10-02','2026-10-01','Legacy backer'),
        ('one','','Repeat legacy feedback','APPROVED','Repeat reply','2026-10-02','2026-10-01',' LEGACY BACKER '),
        ('one','','Owner legacy feedback','APPROVED','Self reply','2026-10-02','2026-10-01',' Owner ')`);
      const snapshot = () => tx.$queryRaw<SignalSnapshot[]>(signalSnapshotQuery(new Date("2026-10-18T00:00:00Z")));
      const first = rankSignals(await snapshot());
      assert.equal(first.length, 2);
      assert.deepEqual(first.map(row => [row.id, row.founderDays, row.backers, row.discussions, row.leaderboardScore, row.rank]), [
        ['one', 3, 4, 2, 21, 1], ['two', 1, 1, 1, 8, 2],
      ]);
      await tx.$executeRawUnsafe(`UPDATE "Comment" SET status='REJECTED' WHERE "startupId"='one' AND LOWER(BTRIM("authorEmail"))='a@example.invalid'`);
      const [afterReject] = rankSignals(await snapshot());
      assert.equal(afterReject.leaderboardScore, 16);
      await tx.$executeRawUnsafe(`DELETE FROM "StartupUpdate" WHERE "startupId"='one' AND "createdAt"::date='2026-10-02'`);
      const [afterDelete] = rankSignals(await snapshot());
      assert.equal(afterDelete.leaderboardScore, 14);
      assert.equal(JSON.stringify(afterDelete).includes('example.invalid'), false);
      throw rollback;
    }, { timeout: 15000 });
  } catch (error) { if (error !== rollback) throw error; }
}

if (process.env.SIGNALS_TEST_DATABASE_URL) {
  const db = new PrismaClient({ datasourceUrl: process.env.SIGNALS_TEST_DATABASE_URL });
  verifySignalsPostgres(db).then(() => console.log("PostgreSQL signal eligibility, deduplication, deletion and privacy fixtures passed."))
    .catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
}
