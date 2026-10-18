"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

type FeatureLatestStartupResult =
  | { success: true; startupName: string; featuredUntil: Date }
  | { error: string };

export async function addFeaturedStartup(startupId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    const now = new Date();
    const activeWhere = { OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] };
    const existing = await db.featuredStartup.findUnique({ where: { startupId } });
    const count = await db.featuredStartup.count({ where: activeWhere });
    const existingIsActive = existing && (!existing.featuredUntil || existing.featuredUntil > now);
    if (count >= 6 && !existingIsActive) {
      return { error: "Maximum limit of 6 featured startups reached." };
    }

    const lastFeatured = await db.featuredStartup.findFirst({
      where: activeWhere,
      orderBy: { sortOrder: "desc" },
    });

    const nextSortOrder = lastFeatured ? lastFeatured.sortOrder + 1 : 0;

    await db.featuredStartup.upsert({
      where: { startupId },
      create: { startupId, sortOrder: nextSortOrder },
      update: { sortOrder: nextSortOrder, featuredUntil: null },
    });

    revalidatePath("/admin/featured");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Add featured startup error:", error);
    return { error: "Failed to add featured startup" };
  }
}

export async function featureLatestStartupForOneDay(): Promise<FeatureLatestStartupResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    const now = new Date();
    const featuredUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const result = await db.$transaction<FeatureLatestStartupResult>(async (tx) => {
      const latestStartup = await tx.startup.findFirst({
        where: { status: "LIVE" },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { id: true, name: true },
      });
      if (!latestStartup) return { error: "There are no live startups to feature yet." };

      const activeWhere = { OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] };
      const existing = await tx.featuredStartup.findUnique({ where: { startupId: latestStartup.id } });
      const activeCount = await tx.featuredStartup.count({ where: activeWhere });
      const existingIsActive = existing && (!existing.featuredUntil || existing.featuredUntil > now);
      if (!existingIsActive && activeCount >= 6) {
        return { error: "All 6 featured slots are in use. Remove a startup or wait for a temporary feature to expire." };
      }

      const firstActive = await tx.featuredStartup.aggregate({
        where: activeWhere,
        _min: { sortOrder: true },
      });
      const sortOrder = (firstActive._min.sortOrder ?? 0) - 1;
      await tx.featuredStartup.upsert({
        where: { startupId: latestStartup.id },
        create: { startupId: latestStartup.id, sortOrder, featuredUntil },
        update: { sortOrder, featuredUntil },
      });

      return { success: true, startupName: latestStartup.name, featuredUntil };
    });

    if ("error" in result) return result;
    revalidatePath("/admin/featured");
    revalidatePath("/discover");
    return result;
  } catch (error) {
    console.error("Feature newest startup error:", error);
    return { error: "Failed to feature the newest live startup." };
  }
}

export async function removeFeaturedStartup(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    await db.featuredStartup.delete({
      where: { id },
    });

    revalidatePath("/admin/featured");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Remove featured startup error:", error);
    return { error: "Failed to remove featured startup" };
  }
}

export async function reorderFeaturedStartups(orderedIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    for (let index = 0; index < orderedIds.length; index++) {
      await db.featuredStartup.update({
        where: { id: orderedIds[index] },
        data: { sortOrder: index },
      });
    }

    revalidatePath("/admin/featured");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Reorder featured startups error:", error);
    return { error: "Failed to reorder featured startups" };
  }
}
