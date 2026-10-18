import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

export class StartupUpdateError extends Error {}
type UpdateProfile = Pick<Prisma.StartupUpdateUncheckedCreateInput, "startupId" | "title" | "body" | "imageUrl">;

async function ownedStartup(tx: Prisma.TransactionClient, startupId: string, ownerId: string) {
  await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${startupId} FOR UPDATE`;
  const startup = await tx.startup.findUnique({ where: { id: startupId, founderId: ownerId }, select: { id: true, slug: true, status: true } });
  if (!startup) throw new StartupUpdateError("Unauthorized");
  return startup;
}

async function recount(tx: Prisma.TransactionClient, startupId: string) {
  const updateCount = await tx.startupUpdate.count({ where: { startupId } });
  await tx.startup.update({ where: { id: startupId }, data: { updateCount } });
}

export async function createStartupUpdate(ownerId: string, data: UpdateProfile, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    const startup = await ownedStartup(tx, data.startupId, ownerId);
    if (startup.status !== "LIVE") throw new StartupUpdateError("Updates can only be posted on live startups");
    const update = await tx.startupUpdate.create({ data: {
      startupId: startup.id, title: data.title, body: data.body, imageUrl: data.imageUrl || null,
    } });
    await recount(tx, startup.id);
    return { update, slug: startup.slug };
  });
}

export async function removeStartupUpdate(ownerId: string, id: string, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    const existing = await tx.startupUpdate.findUnique({ where: { id }, select: { startupId: true } });
    if (!existing) throw new StartupUpdateError("Unauthorized");
    const startup = await ownedStartup(tx, existing.startupId, ownerId);
    await tx.startupUpdate.delete({ where: { id, startup: { founderId: ownerId } } });
    await recount(tx, startup.id);
    return { slug: startup.slug };
  });
}
