import "server-only";
import { db } from "@/lib/db";

// Public reads have their own projection and never load private entries into a
// public component, including when the visitor happens to be their author.
export async function publicFounderEntries(startupId: string, authorId: string, page = 1) {
  return db.founderJournalEntry.findMany({
    where: { startupId, authorId, visibility: "PUBLIC", startup: { status: "LIVE", founderId: authorId } },
    select: { id: true, title: true, body: true, milestone: true, milestoneDone: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * 10,
    take: 11,
  });
}
