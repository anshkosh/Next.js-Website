"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { lockFounderEntry, publishFounderRevision } from "@/lib/journal-publication";

async function reviewer() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.emailVerified && !session.user.banned && ["admin", "reviewer"].includes(session.user.role ?? "") ? session.user : null;
}
function refreshJournal() {
  revalidatePath("/admin/founder-journal"); revalidatePath("/dashboard/journal"); revalidatePath("/sitemap.xml");
  revalidatePath("/founder-journal/[id]/[slug]", "page"); revalidatePath("/startups/[slug]", "page");
}
export async function reviewFounderEntry(id: string, version: number, decision: "APPROVE" | "CHANGES", notes = "") {
  const user = await reviewer();
  if (!user) return { error: "Reviewer access required." };
  if (typeof id !== "string" || id.length > 100 || !Number.isSafeInteger(version) || !["APPROVE", "CHANGES"].includes(decision)) return { error: "Invalid review." };
  if (typeof notes !== "string" || notes.length > 2000 || decision === "CHANGES" && !notes.trim()) return { error: "Add a note explaining the changes needed (up to 2,000 characters)." };
  try {
    const result = await db.$transaction(async tx => {
      const first = await tx.founderJournalRevision.findUnique({ where: { id } });
      if (!first) return { error: "Submission no longer available." };
      await lockFounderEntry(tx, first.entryId);
      const revision = await tx.founderJournalRevision.findUnique({ where: { id }, include: { entry: true } });
      if (!revision || revision.version !== version || revision.entry.visibility !== "PUBLIC" || !["PENDING_REVIEW", "SCHEDULED"].includes(revision.status)) return { error: "This submission changed. Refresh before reviewing it." };
      const now = new Date();
      if (decision === "CHANGES" || revision.status === "PENDING_REVIEW" && revision.scheduledAt && revision.scheduledAt <= now) {
        const note = decision === "CHANGES" ? notes.trim() : "The requested publication time passed before approval. Choose a new future time or publish after approval, then submit again.";
        await tx.founderJournalRevision.update({ where: { id }, data: { status: "CHANGES_REQUESTED", reviewerNotes: note, reviewedBy: user.id, reviewedAt: now } });
        return { success: true, message: "Returned to the founder with a note." };
      }
      if (revision.status !== "PENDING_REVIEW") return { error: "This entry is already approved and scheduled." };
      await tx.founderJournalRevision.update({ where: { id }, data: { reviewedBy: user.id, reviewedAt: now, reviewerNotes: notes.trim() || null, status: revision.scheduledAt ? "SCHEDULED" : "PENDING_REVIEW" } });
      if (!revision.scheduledAt) {
        const published = await publishFounderRevision(tx, revision, now);
        return { success: true, message: published ? "Approved and published." : "Returned to the founder: a live owned startup is required." };
      }
      return { success: true, message: "Approved for scheduled publication." };
    });
    refreshJournal(); return result;
  } catch { return { error: "The review could not be saved. Refresh and try again." }; }
}
