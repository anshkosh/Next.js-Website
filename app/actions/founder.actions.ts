"use server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getFounders(startupId: string) {
  try {
    const founders = await db.startupFounder.findMany({
      where: { startupId },
      orderBy: { sortOrder: "asc" },
    });
    return { data: founders };
  } catch (error) {
    logger.error("Get founders error:", error);
    return { error: "Internal server error" };
  }
}

export async function createFounder(data: {
  startupId: string;
  name: string;
  role?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const startup = await db.startup.findUnique({ where: { id: data.startupId } });
    if (!startup || startup.founderId !== session.user.id) return { error: "Unauthorized" };

    const count = await db.startupFounder.count({ where: { startupId: data.startupId } });
    if (count >= 3) return { error: "Maximum of 3 founders allowed" };

    const founder = await db.startupFounder.create({
      data: {
        ...data,
        sortOrder: count,
      }
    });

    return { data: founder };
  } catch (error) {
    logger.error("Create founder error:", error);
    return { error: "Internal server error" };
  }
}

export async function updateFounder(id: string, data: {
  name?: string;
  role?: string;
  photoUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  sortOrder?: number;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const existing = await db.startupFounder.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const founder = await db.startupFounder.update({
      where: { id },
      data,
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
    if (!session || !session.user) return { error: "Unauthorized" };

    const existing = await db.startupFounder.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.startupFounder.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    logger.error("Delete founder error:", error);
    return { error: "Internal server error" };
  }
}
