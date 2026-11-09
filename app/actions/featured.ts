"use server";

import { revalidateSavedPath } from "@/lib/cache-after-save";
import { logger } from "@/lib/logger";
import {
  FeaturedStartupError, featurePermanentStartup, featureLatestLiveStartup, placePublicStartup,
  removeFeaturedEntry, setFeaturedEntryOrder, reorderFeaturedEntries,
} from "@/lib/featured-startup-store";
import { getStaffSession } from "@/lib/staff-session";

type FeaturedResult = { success: true; error?: never } | { error: string; success?: never };

async function moderator() {
  return !!(await getStaffSession());
}
function refreshFeatured() {
  for (const path of ["/admin/featured", "/startup-wall"]) revalidateSavedPath(path);
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
  } catch (error) { return failure(error, "Failed to add Wall startup"); }
}

export async function addAdminWallPlacement(startupId: string): Promise<FeaturedResult> {
  const session = await getStaffSession({ adminOnly: true });
  if (!session) return { error: "Unauthorized" };
  try {
    await placePublicStartup(startupId);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to add the public profile to the Wall"); }
}
export async function featureLatestStartupForOneDay(): Promise<
  { success: true; startupName: string; featuredUntil: Date } | { error: string }
> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    const result = await featureLatestLiveStartup();
    refreshFeatured();
    return { success: true, ...result };
  } catch (error) { return failure(error, "Failed to spotlight the newest eligible startup."); }
}
export async function removeFeaturedStartup(id: string): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await removeFeaturedEntry({ id });
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to remove Wall startup"); }
}
export async function unfeatureStartupById(startupId: string): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await removeFeaturedEntry({ startupId });
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to remove Wall startup"); }
}
export async function setFeaturedStartupSortOrder(id: string, sortOrder: number): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await setFeaturedEntryOrder(id, sortOrder);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to update Wall order"); }
}
export async function reorderFeaturedStartups(orderedIds: string[]): Promise<FeaturedResult> {
  if (!await moderator()) return { error: "Unauthorized" };
  try {
    await reorderFeaturedEntries(orderedIds);
    refreshFeatured();
    return { success: true };
  } catch (error) { return failure(error, "Failed to reorder Wall spotlights"); }
}
