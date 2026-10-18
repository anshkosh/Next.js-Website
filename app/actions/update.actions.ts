"use server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateSavedPath as revalidatePath } from "@/lib/cache-after-save";
import { createUpdateSchema, updateUpdateSchema } from "@/lib/validators/update.schema";
import { startupReadWhere } from "@/lib/startup-read-access";
import { createStartupUpdate, removeStartupUpdate, StartupUpdateError } from "@/lib/startup-update-store";

export async function getUpdates(startupId: string) {
  if (typeof startupId !== "string" || !startupId || startupId.length > 128) return { error: "Invalid startup ID" };
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const updates = await db.startupUpdate.findMany({
      where: { startupId, startup: startupReadWhere(session?.user) },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, body: true, imageUrl: true, createdAt: true, updatedAt: true },
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

    const validated = createUpdateSchema.safeParse(data);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((issue) => `• ${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      return { error: `Validation failed:\n${errorMsg}` };
    }

    const { update, slug } = await createStartupUpdate(session.user.id, validated.data);

    revalidatePath(`/startups/${slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { data: update };
  } catch (error) {
    if (error instanceof StartupUpdateError) return { error: error.message };
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

    const dataToUpdate = { title: validated.data.title, body: validated.data.body,
      imageUrl: validated.data.imageUrl === "" ? null : validated.data.imageUrl };

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

    if (typeof id !== "string" || !id || id.length > 128) return { error: "Invalid update ID" };
    const { slug } = await removeStartupUpdate(session.user.id, id);

    revalidatePath(`/startups/${slug}`);
    revalidatePath("/dashboard");
    revalidatePath("/");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (error) {
    if (error instanceof StartupUpdateError) return { error: error.message };
    logger.error("Delete update error:", error);
    return { error: "Internal server error" };
  }
}
