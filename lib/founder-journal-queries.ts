import { publicStartupWhere } from "@/lib/startup-visibility";
import "server-only";
import { db } from "@/lib/db";
import { cache } from "react";

// Public reads have their own projection and never load private entries into a
// public component, including when the visitor happens to be their author.
export async function publicFounderEntries(startupId: string, authorId: string, page = 1) {
  return db.founderJournalEntry.findMany({
    where: { startupId, authorId, visibility: "PUBLIC", approvedAt: { not: null }, publishedAt: { lte: new Date() }, startup: { ...publicStartupWhere, founderId: authorId } },
    select: { id: true, title: true, body: true, contentJson: true, milestone: true, milestoneDone: true, publishedAt: true },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * 10,
    take: 11,
  });
}

// Request-local memoization shares this check between metadata and page rendering.
// There is no cross-request cache or privileged owner/admin preview of this URL.
export const publicFounderEntry = cache(async (id: string) => {
  if (!process.env.DATABASE_URL) return null;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  const row = await db.founderJournalEntry.findFirst({
    where: { id, visibility: "PUBLIC", approvedAt: { not: null }, publishedAt: { lte: new Date() }, startup: publicStartupWhere },
    select: {
      id: true, title: true, body: true, contentJson: true, milestone: true, milestoneDone: true, publishedAt: true, updatedAt: true,
      authorId: true,
      startup: { select: { founderId: true, name: true, slug: true, founderName: true, websiteUrl: true } },
    },
  });
  if (!row?.startup || row.authorId !== row.startup.founderId) return null;
  // Ownership identifiers are used for access checks, not public presentation.
  return {
    id: row.id, title: row.title, body: row.body, contentJson: row.contentJson,
    milestone: row.milestone, milestoneDone: row.milestoneDone, publishedAt: row.publishedAt, updatedAt: row.updatedAt,
    startup: { name: row.startup.name, slug: row.startup.slug, founderName: row.startup.founderName, websiteUrl: row.startup.websiteUrl },
  };
});
