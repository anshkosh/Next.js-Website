import { randomUUID } from "node:crypto";
import { db } from "./db";
import { checkContent, contentHash } from "./moderation-policy";
import { applyModeration, moderationSource } from "./moderation-source";
import { deliverNotification } from "./notification-outbox";

export function moderationConfig() {
  const accountId = process.env.MODERATION_CF_ACCOUNT_ID;
  const token = process.env.MODERATION_CF_API_TOKEN;
  return process.env.AI_MODERATION_ENABLED === "true" && accountId && /^[a-f0-9]{32}$/.test(accountId) && token ? { accountId, token } : null;
}
const tomorrow = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 1));

export async function reserveModerationRequest(now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  // Shared PostgreSQL reservation survives worker restarts and overlapping releases.
  // The provider's Workers Free plan remains the authoritative zero-overage cutoff.
  const rows = await db.$queryRaw<{ requests: number }[]>`
    INSERT INTO "ModerationBudget" (day, requests) VALUES (${day}, 1)
    ON CONFLICT (day) DO UPDATE SET requests = "ModerationBudget".requests + 1
      WHERE "ModerationBudget".requests < 100
    RETURNING requests`;
  return rows.length === 1;
}

export async function processModeration() {
  const config = moderationConfig();
  if (!config) return { checked: 0, configured: false };
  await db.contentModeration.updateMany({ where: { status: "CHECKING", attempts: { gte: 3 }, nextAttemptAt: { lte: new Date() } }, data: { status: "UNAVAILABLE", leaseToken: null, reasons: ["Interrupted checks exhausted automatic retries; human review required."] } });
  let checked = 0;
  for (let index = 0; index < 5; index++) {
    const now = new Date();
    const job = await db.contentModeration.findFirst({ where: { status: { in: ["PENDING", "UNAVAILABLE", "CHECKING"] }, attempts: { lt: 3 }, nextAttemptAt: { lte: now } }, orderBy: { nextAttemptAt: "asc" } });
    if (!job) break;
    const leaseToken = randomUUID();
    const claimed = await db.contentModeration.updateMany({ where: { id: job.id, contentHash: job.contentHash, status: job.status, nextAttemptAt: job.nextAttemptAt }, data: { status: "CHECKING", leaseToken, attempts: { increment: 1 }, nextAttemptAt: new Date(now.getTime() + 120000) } });
    if (!claimed.count) continue;
    const lease = { id: job.id, contentHash: job.contentHash, status: "CHECKING", leaseToken };
    try {
      const source = await moderationSource(db, job);
      if (!source || contentHash(source.content) !== job.contentHash) {
        await db.contentModeration.updateMany({ where: lease, data: { status: "STALE", leaseToken: null } }); continue;
      }
      if (!await reserveModerationRequest(now)) {
        await db.contentModeration.updateMany({ where: lease, data: { status: "UNAVAILABLE", leaseToken: null, attempts: { decrement: 1 }, nextAttemptAt: tomorrow(now), reasons: ["Daily moderation allowance reached; awaiting human review or the next UTC day."] } }); break;
      }
      const verdict = await checkContent(source.content, config.token, config.accountId);
      const result = await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${source.startupId} FOR UPDATE`;
        const saved = await tx.contentModeration.updateMany({ where: lease, data: { status: verdict.safe ? "SAFE" : "FLAGGED", reasons: verdict.reasons, checkedAt: new Date(), leaseToken: null } });
        if (!saved.count) return null;
        const fresh = await moderationSource(tx, job);
        const applied = verdict.safe ? await applyModeration(tx, job, true) : null;
        if (!fresh || contentHash(fresh.content) !== job.contentHash || verdict.safe && !applied) {
          await tx.contentModeration.update({ where: { id: job.id }, data: { status: "STALE" } });
          return null;
        }
        return applied && "notificationId" in applied && typeof applied.notificationId === "string" ? applied.notificationId : null;
      });
      if (result) await deliverNotification(result);
      checked++;
    } catch (error) {
      const quota = error instanceof Error && error.message === "quota";
      await db.contentModeration.updateMany({ where: lease, data: { status: "UNAVAILABLE", leaseToken: null, ...(quota ? { attempts: { decrement: 1 } } : {}), nextAttemptAt: quota ? tomorrow(now) : new Date(now.getTime() + 15 * 60000), reasons: [quota ? "Cloudflare allowance reached; awaiting human review or the next UTC day." : "AI check unavailable; human review required. No content was auto-approved."] } });
      if (quota) break;
    }
  }
  return { checked, configured: true };
}
