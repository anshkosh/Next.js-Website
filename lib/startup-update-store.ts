import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { queueModeration } from "./moderation-store";
import { updateContent } from "./moderation-policy";

export class StartupUpdateError extends Error {}
type UpdateProfile = Pick<Prisma.StartupUpdateUncheckedCreateInput, "startupId" | "title" | "body" | "imageUrl">;

async function ownedStartup(tx: Prisma.TransactionClient, startupId: string, ownerId: string) {
  await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${startupId} FOR UPDATE`;
  const startup = await tx.startup.findUnique({ where: { id: startupId, founderId: ownerId }, select: { id: true, slug: true, status: true } });
  if (!startup) throw new StartupUpdateError("Unauthorized");
  return startup;
}

async function recount(tx: Prisma.TransactionClient, startupId: string) {
  const updateCount = await tx.startupUpdate.count({ where: { startupId, status: "APPROVED" } });
  await tx.startup.update({ where: { id: startupId }, data: { updateCount } });
}

export async function createStartupUpdate(ownerId: string, data: UpdateProfile, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    const startup = await ownedStartup(tx, data.startupId, ownerId);
    if (startup.status !== "LIVE") throw new StartupUpdateError("Updates can only be posted on live startups");
    const update = await tx.startupUpdate.create({ data: {
      startupId: startup.id, title: data.title, body: data.body, imageUrl: data.imageUrl || null, status: "PENDING",
    } });
    await queueModeration(tx, "UPDATE", update.id, updateContent(update));
    await recount(tx, startup.id);
    return { update, slug: startup.slug };
  });
}

export async function editStartupUpdate(ownerId: string, id: string, data: { title?: string; body?: string; imageUrl?: string | null }, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    const existing = await tx.startupUpdate.findUnique({ where: { id }, select: { startupId: true } });
    if (!existing) throw new StartupUpdateError("Unauthorized");
    const startup = await ownedStartup(tx, existing.startupId, ownerId);
    if (startup.status !== "LIVE") throw new StartupUpdateError("Updates can only be posted on live startups");
    const update = await tx.startupUpdate.update({ where: { id, startup: { founderId: ownerId } }, data: { ...data, status: "PENDING" } });
    await queueModeration(tx, "UPDATE", id, updateContent(update));
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
