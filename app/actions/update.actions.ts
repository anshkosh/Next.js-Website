"use server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createUpdateSchema, updateUpdateSchema } from "@/lib/validators/update.schema";

export async function getUpdates(startupId: string) {
  try {
    const updates = await db.startupUpdate.findMany({
      where: { startupId },
      orderBy: { createdAt: "desc" },
    });
    return { data: updates };
  } catch (error) {
    logger.error("Get updates error:", error);
    return { error: "Internal server error" };
  }
}

export async function createUpdate(data: {
  startupId: string;
  title: string;
  body: string;
  imageUrl?: string;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const startup = await db.startup.findUnique({ where: { id: data.startupId } });
    if (!startup || startup.founderId !== session.user.id) return { error: "Unauthorized" };

    if (startup.status !== "LIVE") {
      return { error: "Updates can only be posted on live startups" };
    }

    const validated = createUpdateSchema.safeParse(data);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((issue) => `• ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      return { error: `Validation failed:\n${errorMsg}` };
    }

    const update = await db.startupUpdate.create({
      data: {
        startupId: validated.data.startupId,
        title: validated.data.title,
        body: validated.data.body,
        imageUrl: validated.data.imageUrl || null,
      },
    });

    // Increment denormalized count
    await db.startup.update({
      where: { id: data.startupId },
      data: { updateCount: { increment: 1 } },
    });

    revalidatePath(`/startups/${startup.slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { data: update };
  } catch (error) {
    logger.error("Create update error:", error);
    return { error: "Internal server error" };
  }
}

export async function editUpdate(
  id: string,
  data: { title?: string; body?: string; imageUrl?: string }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const existing = await db.startupUpdate.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    const validated = updateUpdateSchema.safeParse({ id, ...data });
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((issue) => `• ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      return { error: `Validation failed:\n${errorMsg}` };
    }

    const { id: _id, ...updateData } = validated.data;
    // Clean up empty imageUrl
    const dataToUpdate: any = { ...updateData };
    if (dataToUpdate.imageUrl === "") {
      dataToUpdate.imageUrl = null;
    }

    const update = await db.startupUpdate.update({
      where: { id },
      data: dataToUpdate,
    });

    revalidatePath(`/startups/${existing.startup.slug}`);
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { data: update };
  } catch (error) {
    logger.error("Edit update error:", error);
    return { error: "Internal server error" };
  }
}

export async function deleteUpdate(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user) return { error: "Unauthorized" };

    const existing = await db.startupUpdate.findUnique({
      where: { id },
      include: { startup: true },
    });

    if (!existing || existing.startup.founderId !== session.user.id) {
      return { error: "Unauthorized" };
    }

    await db.startupUpdate.delete({ where: { id } });

    // Decrement denormalized count
    await db.startup.update({
      where: { id: existing.startupId },
      data: { updateCount: { decrement: 1 } },
    });

    revalidatePath(`/startups/${existing.startup.slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (error) {
    logger.error("Delete update error:", error);
    return { error: "Internal server error" };
  }
}
