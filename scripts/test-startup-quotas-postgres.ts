import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createWithinStartupQuota, StartupQuotaError } from "../lib/startup-quota";

async function main() {
  const url = new URL(process.env.QUOTA_TEST_DATABASE_URL || "http://invalid");
  if (!["localhost", "127.0.0.1"].includes(url.hostname) || url.pathname !== "/anshkosh_e2e") throw new Error("Disposable local anshkosh_e2e database required");
  const client = new PrismaClient({ datasourceUrl: url.toString() });
  const suffix = randomUUID(); let owner: string | undefined; let category: string | undefined;
  try {
    owner = (await client.user.create({ data: { email: `quota-${suffix}@example.test`, name: "Quota fixture", emailVerified: true } })).id;
    category = (await client.category.create({ data: { name: `Quota ${suffix}`, slug: `quota-${suffix}` } })).id;
    const data = (number: number) => ({ founderId: owner!, categoryId: category!, name: `Quota ${number}`, slug: `quota-${suffix}-${number}`, tagline: "Concurrent quota fixture", description: "Disposable test only", websiteUrl: "https://example.test", founderName: "Fixture", galleryImages: [] });
    const first = await Promise.allSettled([createWithinStartupQuota(owner, 1, data(1), client), createWithinStartupQuota(owner, 1, data(2), client)]);
    assert.equal(first.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(first.filter(result => result.status === "rejected" && result.reason instanceof StartupQuotaError).length, 1);
    assert.equal(await client.startup.count({ where: { founderId: owner } }), 1);
    const next = await Promise.allSettled([createWithinStartupQuota(owner, 2, data(3), client), createWithinStartupQuota(owner, 2, data(4), client)]);
    assert.equal(next.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(await client.startup.count({ where: { founderId: owner } }), 2);
    console.log("Startup quota concurrency: default and configurable limits passed against PostgreSQL");
  } finally {
    if (owner) { await client.startup.deleteMany({ where: { founderId: owner } }); await client.user.delete({ where: { id: owner } }); }
    if (category) await client.category.delete({ where: { id: category } });
    await client.$disconnect();
  }
}
main().catch(() => { console.error("Startup quota concurrency verification failed"); process.exitCode = 1; });
