import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { createTeamFounder, TeamFounderError } from "../lib/startup-team-store";
import { createStartupUpdate, removeStartupUpdate } from "../lib/startup-update-store";
import { featurePermanentStartup, featureLatestLiveStartup, removeFeaturedEntry, FeaturedStartupError } from "../lib/featured-startup-store";

async function main() {
  const url = new URL(process.env.INVARIANTS_TEST_DATABASE_URL || "http://invalid");
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/anshkosh_e2e") throw new Error("Disposable local anshkosh_e2e database required");
  const client = new PrismaClient({ datasourceUrl: url.toString() });
  const suffix = randomUUID(); let owner: string | undefined; let category: string | undefined;
  try {
    assert.equal(await client.featuredStartup.count(), 0, "Invariant fixtures require an empty featured list in the disposable DB");
    owner = (await client.user.create({ data: { name: "Invariant fixture", email: `invariants-${suffix}@example.test`, emailVerified: true } })).id;
    category = (await client.category.create({ data: { name: `Invariants ${suffix}`, slug: `invariants-${suffix}` } })).id;
    const startups = [];
    for (let index = 0; index < 9; index++) startups.push(await client.startup.create({ data: {
      founderId: owner, categoryId: category, status: "LIVE", name: `Invariant ${index}`, slug: `invariants-${suffix}-${index}`,
      tagline: "Disposable invariant fixture", description: "Not production data", websiteUrl: "https://example.test", founderName: "Fixture", galleryImages: [],
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
    } }));
    const startupId = startups[0].id;
    for (let index = 0; index < 2; index++) await createTeamFounder(owner, { startupId, name: `Member ${index}` }, client);
    const team = await Promise.allSettled([createTeamFounder(owner, { startupId, name: "Third" }, client), createTeamFounder(owner, { startupId, name: "Fourth" }, client)]);
    assert.equal(team.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(team.filter(result => result.status === "rejected" && result.reason instanceof TeamFounderError).length, 1);
    assert.equal(await client.startupFounder.count({ where: { startupId } }), 3);
    assert.deepEqual((await client.startupFounder.findMany({ where: { startupId }, orderBy: { sortOrder: "asc" } })).map(member => member.sortOrder), [0, 1, 2]);

    for (const startup of startups.slice(0, 5)) await featurePermanentStartup(startup.id, undefined, client);
    const features = await Promise.allSettled([featurePermanentStartup(startups[5].id, undefined, client), featureLatestLiveStartup(client)]);
    assert.equal(features.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(features.filter(result => result.status === "rejected" && result.reason instanceof FeaturedStartupError).length, 1);
    assert.equal(await client.featuredStartup.count(), 6);
    await featurePermanentStartup(startups[0].id, undefined, client); // renewal at capacity
    await removeFeaturedEntry({ startupId: startups[0].id }, client);
    await featureLatestLiveStartup(client);
    assert.ok(await client.featuredStartup.count() <= 6);

    // The failing delegate still uses a real PostgreSQL transaction: successful
    // inserts/deletes before the counter failure must be rolled back by Prisma.
    const failingClient = { $transaction: (operation: (tx: Prisma.TransactionClient) => Promise<unknown>) => client.$transaction(tx => operation(new Proxy(tx, {
      get(target, key, receiver) {
        if (key === "startup") return new Proxy(target.startup, { get(delegate, method, delegateReceiver) {
          if (method === "update") return async () => { throw new Error("Injected counter write failure"); };
          return Reflect.get(delegate, method, delegateReceiver);
        } });
        return Reflect.get(target, key, receiver);
      },
    }))) } as unknown as Pick<PrismaClient, "$transaction">;
    const updateData = { startupId, title: "A test update", body: "Disposable transactional progress fixture." };
    await assert.rejects(createStartupUpdate(owner, updateData, failingClient), /Injected counter/);
    assert.equal(await client.startupUpdate.count({ where: { startupId } }), 0);
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: startupId } })).updateCount, 0);
    const saved = await createStartupUpdate(owner, updateData, client);
    await assert.rejects(removeStartupUpdate(owner, saved.update.id, failingClient), /Injected counter/);
    assert.equal(await client.startupUpdate.count({ where: { startupId } }), 1);
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: startupId } })).updateCount, 1);
    await removeStartupUpdate(owner, saved.update.id, client);
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: startupId } })).updateCount, 0);
    console.log("Recheck invariants: concurrent team/feature limits and update rollback passed against PostgreSQL");
  } finally {
    if (owner) { await client.startup.deleteMany({ where: { founderId: owner } }); await client.user.delete({ where: { id: owner } }); }
    if (category) await client.category.delete({ where: { id: category } });
    await client.$disconnect();
  }
}
main().catch(() => { console.error("Recheck invariant verification failed"); process.exitCode = 1; });
