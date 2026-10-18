"use server";
import { logger } from "@/lib/logger";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateSavedPath as revalidatePath } from "@/lib/cache-after-save";
import { storeNotification, deliverNotification } from "@/lib/notification-outbox";

export async function approveStartup(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.emailVerified || session.user.banned || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    const { event } = await db.$transaction(async tx => {
    const startup = await tx.startup.update({
      where: { id, status: "PENDING_REVIEW" },
      data: {
        status: "LIVE",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: { founder: true }
    });

    const event = await storeNotification(tx, "email", "startup_approved", {
      template: "startup_approved",
      to: startup.founder.email,
      data: {
        startupName: startup.name,
        slug: startup.slug,
      }
    });

    return { event };
    });
    const delivered = await deliverNotification(event.id);
    revalidatePath("/admin/moderation");
    revalidatePath("/");
    
    return { success: true, ...(!delivered ? { notificationPending: true } : {}) };
  } catch (error) {
    logger.error("Approve startup error:", error);
    return { error: "Failed to approve startup" };
  }
}

export async function rejectStartup(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.emailVerified || session.user.banned || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string;
  const adminNotes = formData.get("adminNotes") as string;

  if (!id || !adminNotes || adminNotes.trim() === "") {
    return { error: "Admin notes are required for rejection" };
  }

  try {
    const { event } = await db.$transaction(async tx => {
    const startup = await tx.startup.update({
      where: { id, status: "PENDING_REVIEW" },
      data: {
        status: "REJECTED",
        adminNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: { founder: true }
    });

    const event = await storeNotification(tx, "email", "startup_rejected", {
      template: "startup_rejected",
      to: startup.founder.email,
      data: {
        startupName: startup.name,
        startupId: startup.id,
        notes: adminNotes,
      }
    });

    return { event };
    });
    const delivered = await deliverNotification(event.id);
    revalidatePath("/admin/moderation");
    
    return { success: true, ...(!delivered ? { notificationPending: true } : {}) };
  } catch (error) {
    logger.error("Reject startup error:", error);
    return { error: "Failed to reject startup" };
  }
}

export async function suspendStartup(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized. Admin role required." };
  }

  try {
    await db.startup.update({
      where: { id },
      data: {
        status: "SUSPENDED",
      },
    });

    revalidatePath("/admin/startups");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    logger.error("Suspend startup error:", error);
    return { error: "Failed to suspend startup" };
  }
}

export async function unsuspendStartup(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized. Admin role required." };
  }

  try {
    await db.startup.update({
      where: { id },
      data: {
        status: "LIVE", // Assuming unsuspend makes it live again. Or it could go back to previous status if tracked.
      },
    });

    revalidatePath("/admin/startups");
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    logger.error("Unsuspend startup error:", error);
    return { error: "Failed to unsuspend startup" };
  }
}

export async function featureStartup(startupId: string, sortOrder: number = 0) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    await db.featuredStartup.upsert({
      where: { startupId },
      create: { startupId, sortOrder },
      update: { sortOrder, featuredUntil: null },
    });

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin/featured");

    return { success: true };
  } catch (error) {
    logger.error("Feature startup error:", error);
    return { error: "Failed to feature startup" };
  }
}

export async function unfeatureStartup(startupId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    await db.featuredStartup.deleteMany({
      where: { startupId },
    });

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin/featured");

    return { success: true };
  } catch (error) {
    logger.error("Unfeature startup error:", error);
    return { error: "Failed to unfeature startup" };
  }
}

export async function updateFeaturedSortOrder(featuredId: string, sortOrder: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    return { error: "Unauthorized" };
  }

  try {
    await db.featuredStartup.update({
      where: { id: featuredId },
      data: { sortOrder },
    });

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/admin/featured");

    return { success: true };
  } catch (error) {
    logger.error("Update featured sort order error:", error);
    return { error: "Failed to update sort order" };
  }
}

