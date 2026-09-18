"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Read a single AppSetting value from the database.
 * Returns `defaultValue` when the key does not exist yet.
 */
export async function getSettingValue(key: string, defaultValue: string): Promise<string> {
  const setting = await db.appSetting.findUnique({ where: { key } });
  return setting?.value ?? defaultValue;
}

export async function updateSetting(key: string, value: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    return { error: "Unauthorized. Admin role required." };
  }

  try {
    await db.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Update setting error:", error);
    return { error: "Internal server error" };
  }
}
