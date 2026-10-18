"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidateSavedPath } from "@/lib/cache-after-save";
import { logger } from "@/lib/logger";
import {
  FeaturedStartupError, featurePermanentStartup, featureLatestLiveStartup,
  removeFeaturedEntry, setFeaturedEntryOrder, reorderFeaturedEntries,
} from "@/lib/featured-startup-store";

type FeaturedResult = { success: true; error?: never } | { error: string; success?: never };

async function moderator() {
  const session = await auth.api.getSession({ headers: await headers() });
  return !!session?.user.emailVerified && !session.user.banned && ["admin", "reviewer"].includes(session.user.role ?? "");
}
function refreshFeatured() {
  for (const path of ["/admin/featured", "/discover"]) revalidateSavedPath(path);
}
function failure(error: unknown, message: string) {
  if (error instanceof FeaturedStartupError) return { error: error.message };
  logger.error(message, error);
  return { error: message };
}

export async function addFeaturedStartup(startupId: string, sortOrder?: number): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await featurePermanentStartup(startupId, sortOrder);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to add featured startup"); }
}
export async function featureLatestStartupForOneDay(): Promise<
  { success: true; startupName: string; featuredUntil: Date } | { error: string }
> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    const result = await featureLatestLiveStartup();
    refreshFeatured();
    return { success: true, ...result };
  } catch (error) { return failure(error, "Failed to feature the newest live startup."); }
}
export async function removeFeaturedStartup(id: string): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await removeFeaturedEntry({ id });
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to remove featured startup"); }
}
export async function unfeatureStartupById(startupId: string): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await removeFeaturedEntry({ startupId });
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to remove featured startup"); }
}
export async function setFeaturedStartupSortOrder(id: string, sortOrder: number): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await setFeaturedEntryOrder(id, sortOrder);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to update featured order"); }
}
export async function reorderFeaturedStartups(orderedIds: string[]): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await reorderFeaturedEntries(orderedIds);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to reorder featured startups"); }
}
