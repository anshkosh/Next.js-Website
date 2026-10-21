"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { revalidateSavedPath } from "@/lib/cache-after-save";
import { profileSettingsSchema } from "@/lib/validators/profile.schema";

export async function saveProfileSettings(input: unknown) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user || session.user.banned)
    return { error: "Sign in to update your profile." };
  const parsed = profileSettingsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    await auth.api.updateUser({ headers: requestHeaders, body: parsed.data });
  } catch {
    return { error: "Your profile could not be saved. Please try again." };
  }
  revalidateSavedPath("/", "layout");
  return { success: true };
}
