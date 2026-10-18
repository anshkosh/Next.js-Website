"use server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createFounderSchema, updateFounderSchema } from "@/lib/validators/founder.schema";
import { startupReadWhere } from "@/lib/startup-read-access";

export async function getFounders(startupId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const founders = await db.startupFounder.findMany({
      where: { startupId, startup: startupReadWhere(session?.user) },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, role: true, photoUrl: true, linkedinUrl: true, twitterUrl: true, sortOrder: true },
    });
    return { data: founders };
  } catch (error) {
    logger.error("Get founders error:", error);
    return { error: "Internal server error" };
  }
}

export async function createFounder(input: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.emailVerified || session.user.banned) return { error: "Unauthorized" };

    const parsed = createFounderSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid founder details" };
    const data = parsed.data;

    const startup = await db.startup.findUnique({ where: { id: data.startupId } });
    if (!startup || startup.founderId !== session.user.id) return { error: "Unauthorized" };

    const count = await db.startupFounder.count({ where: { startupId: data.startupId } });
    if (count >= 3) return { error: "Maximum of 3 founders allowed" };

    const founder = await db.startupFounder.create({
      data: {
        startupId: data.startupId,
        name: data.name,
        role: data.role,
        photoUrl: data.photoUrl,
        linkedinUrl: data.linkedinUrl,
        twitterUrl: data.twitterUrl,
        sortOrder: count,
      }
    });

    return { data: founder };
  } catch (error) {
    logger.error("Create founder error:", error);
    return { error: "Internal server error" };
  }
}

export async function updateFounder(id: string, input: unknown) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.emailVerified || session.user.banned) return { error: "Unauthorized" };
    if (typeof id !== "string" || !id || id.length > 128) return { error: "Invalid founder ID" };
    const parsed = updateFounderSchema.safeParse(input);
    if (!parsed.success) return { error: "Invalid founder details" };
    const data = parsed.data;

    const existing = await db.startupFounder.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const founder = await db.startupFounder.update({
      where: { id, startup: { founderId: session.user.id } },
      data: {
        name: data.name,
        role: data.role,
        photoUrl: data.photoUrl,
        linkedinUrl: data.linkedinUrl,
        twitterUrl: data.twitterUrl,
        sortOrder: data.sortOrder,
      },
    });

    return { data: founder };
  } catch (error) {
    logger.error("Update founder error:", error);
    return { error: "Internal server error" };
  }
}

export async function deleteFounder(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.emailVerified || session.user.banned) return { error: "Unauthorized" };

    const existing = await db.startupFounder.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.startupFounder.delete({ where: { id, startup: { founderId: session.user.id } } });

    return { success: true };
  } catch (error) {
    logger.error("Delete founder error:", error);
    return { error: "Internal server error" };
  }
}
