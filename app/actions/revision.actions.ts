"use server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { revisionPatch } from "@/lib/startup-revisions";
import { mergeStartupMetadata } from "@/lib/startup-metadata";
import { emailQueue } from "@/lib/jobs/queues";
import { logger } from "@/lib/logger";

export async function reviewRevision(id: string, version: string, decision: "approve" | "reject", notes = "") {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role || "")) return { error: "Unauthorized" };
  if (!["approve", "reject"].includes(decision) || !Number.isFinite(Date.parse(version))) return { error: "Invalid review" };
  if (decision === "reject" && (!notes.trim() || notes.length > 2000)) return { error: "Give a reason, up to 2,000 characters." };
  try {
    const startup = await db.$transaction(async tx => {
      const lookup = await tx.startupRevision.findUniqueOrThrow({ where: { id } });
      await tx.$queryRaw`SELECT id FROM "Startup" WHERE id = ${lookup.startupId} FOR UPDATE`;
      const revision = await tx.startupRevision.findUniqueOrThrow({ where: { id } });
      if (revision.status !== "PENDING_REVIEW" || revision.updatedAt.toISOString() !== version) throw new Error("These changes were updated. Reload before reviewing.");
      const current = await tx.startup.findUniqueOrThrow({ where: { id: revision.startupId }, include: { founder: true } });
      if (current.status !== "LIVE") throw new Error("This startup is no longer live. Review its status first.");
      if (decision === "approve") {
        const patch = revisionPatch(revision.data, current.id);
        await tx.startup.update({ where: { id: current.id }, data: {
          ...patch, metadata: mergeStartupMetadata(current.metadata, patch.metadata), reviewedBy: session.user.id, reviewedAt: new Date(),
        } });
        await tx.startupRevision.delete({ where: { id } });
      } else {
        await tx.startupRevision.update({ where: { id }, data: { status: "REJECTED", notes: notes.trim() } });
      }
      return current;
    });
    await emailQueue.add(decision === "approve" ? "startup_approved" : "startup_rejected", {
      template: decision === "approve" ? "startup_approved" : "startup_rejected",
      to: startup.founder.email,
      data: { startupName: startup.name, slug: startup.slug, startupId: startup.id, notes },
    }).catch(error => logger.error("Revision review email failed", error));
    for (const path of ["/admin/moderation", "/dashboard", "/discover", "/", `/startups/${startup.slug}`]) revalidatePath(path);
    return { success: true };
  } catch (error) {
    logger.error("Revision review failed", error);
    return { error: "Review could not be saved. Reload to check for newer changes, then try again." };
  }
}
