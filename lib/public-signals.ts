import { createHash } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { publicCache, type PublicCache } from "./public-cache";
import { signalSnapshotQuery, signalNextChangeQuery, type SignalSnapshot } from "./startup-signals";

const MAX_AGE_MS = 15_000;
const count = z.number().int().nonnegative();
const snapshotSchema = z.object({
  readAt: z.number(), expiresAt: z.number(),
  rows: z.array(z.object({
    id: z.string(), name: z.string(), featured: z.boolean(),
    upvoteCount: count, downvoteCount: count, updateCount: count,
    founderDays: count, backers: count, discussions: count,
  })),
});

// Call only inside a read-only RepeatableRead transaction. The MVCC snapshot
// changes when a write becomes visible, including workers and account erasure.
// Unlike TTL-only invalidation, this cannot keep a newly hidden founder ranked.
export async function publicSignals(
  tx: Pick<Prisma.TransactionClient, "$queryRaw">,
  store: PublicCache = publicCache,
  now = new Date(),
): Promise<SignalSnapshot[]> {
  const [version] = await tx.$queryRaw<{ snapshot: string; database: string; schema: string }[]>`
    SELECT txid_current_snapshot()::text AS snapshot,
      current_database()::text AS database, current_schema()::text AS schema
  `;
  const key = `anshkosh:public-signals:v1:${createHash("sha256")
    .update(JSON.stringify(version)).digest("hex")}`;
  let value: string | null;
  try { value = await store.get(key); }
  catch { return tx.$queryRaw<SignalSnapshot[]>(signalSnapshotQuery(now)); }
  if (value) {
    try {
      const cached = snapshotSchema.safeParse(JSON.parse(value));
      if (cached.success && cached.data.expiresAt <= cached.data.readAt + MAX_AGE_MS
        && cached.data.readAt <= now.getTime() && now.getTime() < cached.data.expiresAt) {
        return cached.data.rows;
      }
    } catch { /* Corrupt/old cache entries are replaced from PostgreSQL. */ }
  }

  const rows = await tx.$queryRaw<SignalSnapshot[]>(signalSnapshotQuery(now));
  // Scheduled publication/feature expiry can change results without a write.
  const [boundary] = await tx.$queryRaw<{ nextChange: Date | null }[]>(signalNextChangeQuery(now));
  const expiresAt = Math.min(now.getTime() + MAX_AGE_MS, boundary.nextChange?.getTime() ?? Infinity);
  const ttlMs = expiresAt - Date.now();
  if (ttlMs > 0) {
    try { await store.set(key, JSON.stringify({ readAt: now.getTime(), expiresAt, rows }), ttlMs); }
    catch { /* Optional cache failures never discard a successful database read. */ }
  }
  return rows;
}
