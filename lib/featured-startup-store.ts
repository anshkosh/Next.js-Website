import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

export class FeaturedStartupError extends Error {}
type Client = Pick<PrismaClient, "$transaction">;
type Tx = Prisma.TransactionClient;
const activeWhere = (now: Date) => ({ OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] });

function validId(id: string) {
  if (typeof id !== "string" || !id || id.length > 128) throw new FeaturedStartupError("Invalid featured startup ID.");
}
function validOrder(order: number) {
  if (!Number.isSafeInteger(order) || Math.abs(order) > 10000) throw new FeaturedStartupError("Invalid featured order.");
}
async function locked<T>(client: Client, operation: (tx: Tx) => Promise<T>) {
  return client.$transaction(async tx => {
    // Manual, temporary and legacy writers must share the same allocation lock.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('featured-startup-slots'))::text`;
    return operation(tx);
  });
}
async function allocate(tx: Tx, startupId: string, temporary: boolean, explicitOrder?: number) {
  const startup = await tx.startup.findUnique({ where: { id: startupId, status: "LIVE" }, select: { id: true, name: true } });
  if (!startup) throw new FeaturedStartupError("Only live startups can be featured.");
  const now = new Date();
  const existing = await tx.featuredStartup.findUnique({ where: { startupId } });
  const count = await tx.featuredStartup.count({ where: activeWhere(now) });
  const existingIsActive = existing && (!existing.featuredUntil || existing.featuredUntil > now);
  if (count >= 6 && !existingIsActive) throw new FeaturedStartupError(temporary
    ? "All 6 featured slots are in use. Remove a startup or wait for a temporary feature to expire."
    : "Maximum limit of 6 featured startups reached.");
  const order = await tx.featuredStartup.aggregate({ where: activeWhere(now), _min: { sortOrder: true }, _max: { sortOrder: true } });
  const sortOrder = explicitOrder ?? (temporary ? (order._min.sortOrder ?? 0) - 1 : (order._max.sortOrder ?? -1) + 1);
  const featuredUntil = temporary ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : null;
  await tx.featuredStartup.upsert({
    where: { startupId }, create: { startupId, sortOrder, featuredUntil }, update: { sortOrder, featuredUntil },
  });
  return { startupName: startup.name, featuredUntil };
}

export async function featurePermanentStartup(startupId: string, sortOrder?: number, client: Client = db) {
  validId(startupId);
  if (sortOrder !== undefined) validOrder(sortOrder);
  return locked(client, tx => allocate(tx, startupId, false, sortOrder));
}
export async function featureLatestLiveStartup(client: Client = db) {
  return locked(client, async tx => {
    const startup = await tx.startup.findFirst({ where: { status: "LIVE" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true } });
    if (!startup) throw new FeaturedStartupError("There are no live startups to feature yet.");
    const result = await allocate(tx, startup.id, true);
    return { startupName: result.startupName, featuredUntil: result.featuredUntil! };
  });
}
export async function removeFeaturedEntry(where: { id: string } | { startupId: string }, client: Client = db) {
  validId("id" in where ? where.id : where.startupId);
  return locked(client, tx => tx.featuredStartup.deleteMany({ where }));
}
export async function setFeaturedEntryOrder(id: string, sortOrder: number, client: Client = db) {
  validId(id); validOrder(sortOrder);
  return locked(client, tx => tx.featuredStartup.update({ where: { id }, data: { sortOrder } }));
}
export async function reorderFeaturedEntries(ids: string[], client: Client = db) {
  if (!Array.isArray(ids) || ids.length > 100 || new Set(ids).size !== ids.length) throw new FeaturedStartupError("Invalid featured order.");
  ids.forEach(validId);
  return locked(client, async tx => {
    const entries = await tx.featuredStartup.findMany({ where: activeWhere(new Date()), select: { id: true } });
    if (entries.length !== ids.length || entries.some(entry => !ids.includes(entry.id))) throw new FeaturedStartupError("The featured list changed. Refresh and try again.");
    for (const [sortOrder, id] of ids.entries()) await tx.featuredStartup.update({ where: { id }, data: { sortOrder } });
  });
}
