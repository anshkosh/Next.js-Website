import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

export class StartupQuotaError extends Error {}
export async function createWithinStartupQuota(userId: string, limit: number, data: Prisma.StartupUncheckedCreateInput, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`startup-quota:${userId}`}))::text`;
    const count = await tx.startup.count({ where: { founderId: userId } });
    if (count >= limit) throw new StartupQuotaError(`You can only create up to ${limit} startup${limit === 1 ? "" : "s"}.`);
    return tx.startup.create({ data: { ...data, founderId: userId } });
  });
}
