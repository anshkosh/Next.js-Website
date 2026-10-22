import { db } from "@/lib/db";
import type { TemplateName } from "./templates";

export async function emailPreferenceAllows(template: TemplateName, to: string) {
  const preference = template === "upvote_milestone" ? "notifyVoteMilestones"
    : ["startup_approved", "startup_rejected"].includes(template) ? "notifyStartupReviews" : null;
  // Verification, recovery, contact and staff moderation messages are essential.
  if (!preference) return true;
  const user = await db.user.findFirst({
    where: { email: { equals: to, mode: "insensitive" } },
    select: { notifyStartupReviews: true, notifyVoteMilestones: true },
  });
  // These templates refer to owned startups; a deleted recipient no longer has one.
  return !!user && user[preference];
}
