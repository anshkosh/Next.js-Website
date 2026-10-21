"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidateSavedPath } from "@/lib/cache-after-save";
import { profileSettingsSchema, founderModeSchema } from "@/lib/validators/profile.schema";
import { db } from "@/lib/db";

export async function saveProfileSettings(input: unknown) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user || session.user.banned)
    return { error: "Sign in to update your profile." };
  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.image && parsed.data.image !== session.user.image) {
    const prefix = "/api/uploads/serve/";
    if (!/^\/api\/uploads\/serve\/founders\/[a-zA-Z0-9_-]+\.webp$/.test(parsed.data.image))
      return { error: "Upload your profile photo using the photo picker." };
    const owned = await db.mediaUpload.findFirst({ where: { userId: session.user.id, key: parsed.data.image.slice(prefix.length) }, select: { id: true } });
    if (!owned) return { error: "Choose a photo uploaded by your account." };
  }
  try {
    await auth.api.updateUser({ headers: requestHeaders, body: { ...parsed.data, image: parsed.data.image || null } });
  } catch {
    return { error: "Your profile could not be saved. Please try again." };
  }
  revalidateSavedPath("/", "layout");
  return { success: true };
}

export async function saveFounderMode(input: unknown) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user || session.user.banned) return { error: "Sign in to change founder mode." };
  const parsed = founderModeSchema.safeParse(input);
  if (!parsed.success) return { error: "Choose on or off for founder mode." };
  try { await auth.api.updateUser({ headers: requestHeaders, body: parsed.data }); }
  catch { return { error: "Founder mode could not be saved. Please try again." }; }
  revalidateSavedPath("/", "layout");
  return { success: true };
}
