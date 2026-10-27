"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { applyModeration, moderationSource } from "@/lib/moderation-source";
import { revalidateSavedPath } from "@/lib/cache-after-save";
import { deliverNotification } from "@/lib/notification-outbox";

export async function reviewContent(id: string, hash: string, approve: boolean) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) return { error: "Reviewer access required." };
  if (typeof id !== "string" || !id || id.length > 100 || typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash) || typeof approve !== "boolean") return { error: "Invalid review." };
  try {
    const result = await db.$transaction(async tx => {
      const first = await tx.contentModeration.findUnique({ where: { id } });
      if (!first) return { error: "Submission no longer available." };
      const original = await moderationSource(tx, first, !approve);
      if (!original) return { error: "Submission no longer available." };
      await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${original.startupId} FOR UPDATE`;
      const claimed = await tx.contentModeration.updateMany({ where: { id, contentHash: hash, kind: { not: "JOURNAL" }, status: { in: ["PENDING", "CHECKING", "FLAGGED", "UNAVAILABLE", ...(!approve ? ["SAFE", "APPROVED"] : [])] } }, data: { status: approve ? "APPROVED" : "REJECTED", leaseToken: null, reviewedBy: session.user.id, reviewedAt: new Date() } });
      if (!claimed.count) return { error: "This submission changed or was already reviewed. Refresh before reviewing it." };
      const job = await tx.contentModeration.findUniqueOrThrow({ where: { id } });
      const source = await applyModeration(tx, job, approve, !approve);
      if (!source) {
        await tx.contentModeration.update({ where: { id }, data: { status: "STALE" } });
        return { error: "This submission changed or its startup is no longer public. Refresh before reviewing it." };
      }
      return { slug: source.slug, notificationId: "notificationId" in source ? source.notificationId : null };
    });
    if ("error" in result) return { error: result.error };
    const notificationDelivered = result.notificationId ? await deliverNotification(result.notificationId) : true;
    for (const path of ["/admin/content-review", "/admin/comments", "/dashboard", "/", "/leaderboard", `/startups/${result.slug}`]) revalidateSavedPath(path);
    return { success: true, ...(result.notificationId && !notificationDelivered ? { notificationPending: true } : {}) };
  } catch { return { error: "The review could not be saved. Refresh and try again." }; }
}
