import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { invariantTestDatabaseUrl } from "./invariant-test-database";
import { publicSignals } from "../lib/public-signals";
import type { PublicCache } from "../lib/public-cache";

async function main() {
  const client = new PrismaClient({ datasourceUrl: invariantTestDatabaseUrl(process.env.PERFORMANCE_TEST_DATABASE_URL) });
  const suffix = randomUUID();
  let ownerId: string | undefined; let categoryId: string | undefined;
  const entries = new Map<string, string>(); let writes = 0;
  const store: PublicCache = {
    get: async key => entries.get(key) ?? null,
    set: async (key, value) => { writes++; entries.set(key, value); },
  };
  const read = (now = new Date()) => client.$transaction(tx => publicSignals(tx, store, now), { isolationLevel: "RepeatableRead" });
  try {
    ownerId = (await client.user.create({ data: { name: "Cache fixture", email: `cache-${suffix}@example.test`, emailVerified: true, founderMode: true } })).id;
    categoryId = (await client.category.create({ data: { name: `Cache ${suffix}`, slug: `cache-${suffix}` } })).id;
    const startup = await client.startup.create({ data: {
      name: "Disposable public-cache fixture", slug: `cache-${suffix}`, status: "LIVE", founderId: ownerId, categoryId,
      tagline: "Synthetic performance regression", description: "Isolated cache fixture", websiteUrl: "https://example.test", founderName: "Fixture", galleryImages: [],
    } });
    assert.ok((await read()).some(row => row.id === startup.id));
    const warmedWrites = writes;
    assert.ok((await read()).some(row => row.id === startup.id));
    assert.equal(writes, warmedWrites, "Same committed snapshot must reuse its aggregate cache");

    await client.user.update({ where: { id: ownerId }, data: { founderMode: false } });
    assert.ok(!(await read()).some(row => row.id === startup.id), "Founder mode off must hide a cached row immediately");
    await client.user.update({ where: { id: ownerId }, data: { founderMode: true } });
    await client.upvote.create({ data: { startupId: startup.id, fingerprintHash: suffix, cookieId: suffix } });
    assert.equal((await read()).find(row => row.id === startup.id)?.upvoteCount, 1, "Committed votes must replace cached counts");

    // An uncommitted hide must not contaminate a concurrent reader's cache.
    let releaseWriter!: () => void; let writerReady!: () => void;
    const gate = new Promise<void>(resolve => { releaseWriter = resolve; });
    const ready = new Promise<void>(resolve => { writerReady = resolve; });
    const writer = client.$transaction(async tx => {
      await tx.user.update({ where: { id: ownerId }, data: { founderMode: false } });
      writerReady(); await gate;
    }, { timeout: 15000 });
    try {
      await ready;
      assert.ok((await read()).some(row => row.id === startup.id), "Uncommitted visibility changes are not public yet");
    } finally { releaseWriter(); await writer; }
    assert.ok(!(await read()).some(row => row.id === startup.id), "Committed hide invalidates the in-progress snapshot too");
    await client.user.update({ where: { id: ownerId }, data: { founderMode: true } });

    // A future approved publishing day becomes eligible without another write.
    const future = new Date(Date.now() + 2000);
    const update = await client.startupUpdate.create({ data: { startupId: startup.id, title: "Scheduled test", body: "Scheduled fixture progress", status: "APPROVED", createdAt: future } });
    assert.equal((await read()).find(row => row.id === startup.id)?.founderDays, 0);
    assert.equal((await read(new Date(future.getTime() + 1))).find(row => row.id === startup.id)?.founderDays, 1, "Clock boundary must expire a cache even with no database write");
    await client.startupUpdate.update({ where: { id: update.id }, data: { status: "REJECTED" } });
    assert.equal((await read()).find(row => row.id === startup.id)?.updateCount, 0, "Moderation removal must refresh cached counts");
    console.log("Public-signal cache: reuse, vote changes, concurrent visibility, scheduled expiry and moderation passed against PostgreSQL");
  } finally {
    if (ownerId) { await client.startup.deleteMany({ where: { founderId: ownerId } }); await client.user.delete({ where: { id: ownerId } }); }
    if (categoryId) await client.category.delete({ where: { id: categoryId } });
    await client.$disconnect();
  }
}
main().catch(error => { console.error(error instanceof assert.AssertionError ? error.message : "Public-signal PostgreSQL verification failed"); process.exitCode = 1; });
