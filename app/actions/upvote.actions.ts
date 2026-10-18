"use server";

import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { headers, cookies } from "next/headers";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { emailQueue } from "@/lib/jobs/queues";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { recordVote } from "@/lib/vote-store";
import { clientIp } from "@/lib/utils/client-ip";

export async function toggleVote(startupId: string, direction: -1 | 1) {
  if (typeof startupId !== "string" || !startupId || startupId.length > 128 || (direction !== 1 && direction !== -1)) return { success: false as const, error: "Invalid vote." };
  try {
    const headersList = await headers();
    const ip = clientIp(headersList);
    // Network identity excludes client-controlled user agents and cookies.
    const fingerprintHash = generateFingerprint(ip, "anonymous-vote-v2");
    if (!await checkRateLimit(`rate-limit:upvote:${fingerprintHash}`, 10, 3600)) return { success: false as const, error: "Rate limit exceeded. Please try again later." };
    const cookieStore = await cookies();
    let cookieId = cookieStore.get("anshkosh_vid")?.value;
    if (!cookieId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cookieId)) {
      cookieId = uuidv4();
      cookieStore.set("anshkosh_vid", cookieId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
    }
    const result = await recordVote(startupId, direction, { fingerprintHash, cookieId });
    if (!result.success) return { success: false as const, error: result.error };
    // A notification failure must not report a committed vote as unsaved.
    try {
      if (result.addedUpvote && result.startup.founder?.email) {
        const setting = await db.appSetting.findUnique({ where: { key: "upvote_milestones" } });
        let milestones: number[] = [10, 50, 100, 500];
        if (setting?.value) {
          try {
            const parsed: unknown = JSON.parse(setting.value);
            if (Array.isArray(parsed) && parsed.every(value => Number.isSafeInteger(value) && value > 0)) milestones = parsed;
          } catch { logger.warn("Invalid upvote milestones setting"); }
        }
        if (milestones.includes(result.upvoteCount)) await emailQueue.add("milestone_reached", {
          template: "upvote_milestone", to: result.startup.founder.email,
          data: { startupName: result.startup.name, milestone: result.upvoteCount, slug: result.startup.slug },
        });
      }
    } catch (error) { logger.error("Vote milestone notification failed", error); }
    try {
      for (const path of ["/", "/discover", "/leaderboard", "/search", "/dashboard", "/admin/dashboard", "/admin/startups", `/category/${result.startup.category.slug}`, `/startups/${result.startup.slug}`]) revalidatePath(path);
    } catch (error) { logger.error("Vote cache refresh failed", error); }
    return { success: true as const, vote: result.vote, upvoteCount: result.upvoteCount, downvoteCount: result.downvoteCount, signalCount: result.signalCount };
  } catch (error) {
    logger.error("Toggle vote error", error);
    return { success: false as const, error: "Your vote could not be saved. Please try again." };
  }
}

// Retain the existing action for old clients during a release switch.
export async function toggleUpvote(startupId: string) {
  const result = await toggleVote(startupId, 1);
  return result.success ? { ...result, count: result.upvoteCount, upvoted: result.vote === 1 } : result;
}
