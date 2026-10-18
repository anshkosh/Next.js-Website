import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";

export class TeamFounderError extends Error {}
type FounderProfile = Pick<Prisma.StartupFounderUncheckedCreateInput,
  "startupId" | "name" | "role" | "photoUrl" | "linkedinUrl" | "twitterUrl">;

export async function createTeamFounder(ownerId: string, profile: FounderProfile, client: Pick<PrismaClient, "$transaction"> = db) {
  return client.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${profile.startupId} FOR UPDATE`;
    const startup = await tx.startup.findUnique({ where: { id: profile.startupId, founderId: ownerId }, select: { id: true } });
    if (!startup) throw new TeamFounderError("Unauthorized");
    const members = await tx.startupFounder.findMany({ where: { startupId: startup.id }, select: { sortOrder: true }, take: 3 });
    if (members.length >= 3) throw new TeamFounderError("Maximum of 3 founders allowed");
    const sortOrder = [0, 1, 2].find(position => !members.some(member => member.sortOrder === position))!;
    return tx.startupFounder.create({ data: {
      startupId: startup.id, name: profile.name, role: profile.role, photoUrl: profile.photoUrl,
      linkedinUrl: profile.linkedinUrl, twitterUrl: profile.twitterUrl, sortOrder,
    } });
  });
}
