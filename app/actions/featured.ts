"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function addFeaturedStartup(startupId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    const count = await db.featuredStartup.count();
    if (count >= 6) {
      return { error: "Maximum limit of 6 featured startups reached." };
    }

    const lastFeatured = await db.featuredStartup.findFirst({
      orderBy: { sortOrder: "desc" },
    });

    const nextSortOrder = lastFeatured ? lastFeatured.sortOrder + 1 : 0;

    await db.featuredStartup.upsert({
      where: { startupId },
      create: { startupId, sortOrder: nextSortOrder },
      update: { sortOrder: nextSortOrder },
    });

    revalidatePath("/admin/featured");
    revalidatePath("/");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Add featured startup error:", error);
    return { error: "Failed to add featured startup" };
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
    revalidatePath("/");
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
    revalidatePath("/");
    revalidatePath("/discover");

    return { success: true };
  } catch (error) {
    console.error("Reorder featured startups error:", error);
    return { error: "Failed to reorder featured startups" };
  }
}
