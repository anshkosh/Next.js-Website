"use server";
import { logger } from "@/lib/logger";

import { db } from "@/lib/db";
import { headers } from "next/headers";
import { generateFingerprint } from "@/lib/utils/fingerprint";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { emailQueue } from "@/lib/jobs/queues";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

export async function toggleUpvote(startupId: string) {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headersList.get("user-agent") || "unknown";

    const fingerprint = generateFingerprint(ip, userAgent);
    const rateLimitKey = `rate-limit:upvote:${fingerprint}`;

    const isAllowed = await checkRateLimit(rateLimitKey, 10, 3600); // 10 per hour

    if (!isAllowed) {
      return { error: "Rate limit exceeded. Please try again later." };
    }

    const cookieStore = await cookies();
    let cookieId = cookieStore.get("anshkosh_vid")?.value;

    if (!cookieId) {
      cookieId = uuidv4();
      cookieStore.set("anshkosh_vid", cookieId, { maxAge: 60 * 60 * 24 * 365, httpOnly: true }); // 1 year
    }

    const startup = await db.startup.findUnique({
      where: { id: startupId },
      include: { founder: { select: { email: true } } }
    });

    if (!startup) {
      return { error: "Startup not found" };
    }

    if (startup.status !== "LIVE") {
      return { error: "Cannot upvote a non-live startup" };
    }

    const existingUpvote = await db.upvote.findFirst({
      where: {
        startupId,
        OR: [
          { fingerprintHash: fingerprint },
          { cookieId },
        ],
      },
    });

    let newCount = startup.upvoteCount;

    if (existingUpvote) {
      // Remove upvote
      await db.$transaction([
        db.upvote.delete({ where: { id: existingUpvote.id } }),
        db.startup.update({
          where: { id: startupId },
          data: { upvoteCount: { decrement: 1 } },
        }),
      ]);
      newCount -= 1;
    } else {
      // Add upvote
      await db.$transaction([
        db.upvote.create({
          data: {
            startupId,
            fingerprintHash: fingerprint,
            cookieId,
          },
        }),
        db.startup.update({
          where: { id: startupId },
          data: { upvoteCount: { increment: 1 } },
        }),
      ]);
      newCount += 1;

      // Check milestones
      const setting = await db.appSetting.findUnique({
        where: { key: "upvote_milestones" },
      });
      let milestones: number[] = [10, 50, 100, 500];
      if (setting?.value) {
        try {
          milestones = JSON.parse(setting.value);
        } catch (e) {
          console.error("Failed to parse upvote_milestones setting", e);
        }
      }

      if (milestones.includes(newCount)) {
        await emailQueue.add("milestone_reached", {
          template: "upvote_milestone",
          to: startup.founder?.email || "", // we need founder email
          data: {
            startupName: startup.name,
            milestone: newCount,
            slug: startup.slug,
          }
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/discover");
    revalidatePath("/leaderboard");
    revalidatePath(`/startups/${startup.slug}`);
    
    return { success: true, count: newCount, upvoted: !existingUpvote };
  } catch (error) {
    logger.error("Toggle upvote error:", error);
    return { error: "Internal server error" };
  }
}
