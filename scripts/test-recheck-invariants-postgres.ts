import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { createTeamFounder, TeamFounderError } from "../lib/startup-team-store";
import { createStartupUpdate, removeStartupUpdate } from "../lib/startup-update-store";
import { featurePermanentStartup, featureLatestLiveStartup, placePublicStartup, removeFeaturedEntry, FeaturedStartupError } from "../lib/featured-startup-store";
import { visibleWallStartupWhere } from "../lib/startup-wall";
import { invariantTestDatabaseUrl } from "./invariant-test-database";

async function main() {
  const datasourceUrl = invariantTestDatabaseUrl(process.env.INVARIANTS_TEST_DATABASE_URL);
  const client = new PrismaClient({ datasourceUrl });
  const suffix = randomUUID(); let owner: string | undefined; let category: string | undefined;
  try {
    assert.equal(await client.featuredStartup.count(), 0, "Invariant fixtures require an empty featured list in the disposable DB");
    assert.equal(await client.startup.count(), 0, "Invariant fixtures require an empty startup table; never feature an unrelated listing");
    owner = (await client.user.create({ data: { name: "Invariant fixture", email: `invariants-${suffix}@example.test`, emailVerified: true } })).id;
    category = (await client.category.create({ data: { name: `Invariants ${suffix}`, slug: `invariants-${suffix}` } })).id;
    const startups = [];
    for (let index = 0; index < 9; index++) startups.push(await client.startup.create({ data: {
      founderId: owner, categoryId: category, status: "LIVE", name: `Invariant ${index}`, slug: `invariants-${suffix}-${index}`,
      tagline: "Disposable invariant fixture", description: "Not production data", websiteUrl: "https://example.test", founderName: "Fixture", galleryImages: [],
      createdAt: new Date(Date.UTC(2026, 0, 1, 0, index)),
      wallOptIn: index !== 8, logoUrl: index === 7 ? null : "/logo.svg",
    } }));
    const startupId = startups[0].id;
    for (let index = 0; index < 2; index++) await createTeamFounder(owner, { startupId, name: `Member ${index}` }, client);
    const team = await Promise.allSettled([createTeamFounder(owner, { startupId, name: "Third" }, client), createTeamFounder(owner, { startupId, name: "Fourth" }, client)]);
    assert.equal(team.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(team.filter(result => result.status === "rejected" && result.reason instanceof TeamFounderError).length, 1);
    assert.equal(await client.startupFounder.count({ where: { startupId } }), 3);
    assert.deepEqual((await client.startupFounder.findMany({ where: { startupId }, orderBy: { sortOrder: "asc" } })).map(member => member.sortOrder), [0, 1, 2]);

    // New profiles default out; neither consent nor an image may be bypassed by Admin.
    await assert.rejects(featurePermanentStartup(startups[8].id, undefined, client), FeaturedStartupError);
    await assert.rejects(featurePermanentStartup(startups[7].id, undefined, client), FeaturedStartupError);
    await client.user.update({ where: { id: owner }, data: { founderMode: false } });
    await assert.rejects(featurePermanentStartup(startups[0].id, undefined, client), FeaturedStartupError);
    await client.user.update({ where: { id: owner }, data: { founderMode: true } });

    for (const startup of startups.slice(0, 5)) await featurePermanentStartup(startup.id, undefined, client);
    const features = await Promise.allSettled([featurePermanentStartup(startups[5].id, undefined, client), featureLatestLiveStartup(client)]);
    assert.equal(features.filter(result => result.status === "fulfilled").length, 2);
    assert.equal(await client.featuredStartup.count(), 7);
    await featurePermanentStartup(startups[0].id, undefined, client);
    assert.equal(await client.featuredStartup.count(), 7);
    await removeFeaturedEntry({ startupId: startups[0].id }, client);
    await featureLatestLiveStartup(client);
    assert.equal(await client.featuredStartup.count(), 6);

    const adminStartup = startups[8];
    await placePublicStartup(adminStartup.id, client);
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: adminStartup.id, ...visibleWallStartupWhere } })).wallOptIn, false);
    await client.startup.update({ where: { id: adminStartup.id }, data: { wallAdminPlacement: false } });
    assert.equal(await client.startup.findUnique({ where: { id: adminStartup.id, ...visibleWallStartupWhere } }), null);
    await assert.rejects(placePublicStartup(adminStartup.id, client), FeaturedStartupError);

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
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: startupId } })).updateCount, 0);
    assert.equal(saved.update.status, "PENDING");
    await removeStartupUpdate(owner, saved.update.id, client);
    assert.equal((await client.startup.findUniqueOrThrow({ where: { id: startupId } })).updateCount, 0);
    console.log("Recheck invariants: concurrent team and Wall writes plus update rollback passed against PostgreSQL");
  } finally {
    if (owner) { await client.startup.deleteMany({ where: { founderId: owner } }); await client.user.delete({ where: { id: owner } }); }
    if (category) await client.category.delete({ where: { id: category } });
    await client.$disconnect();
  }
}
main().catch(() => { console.error("Recheck invariant verification failed"); process.exitCode = 1; });
