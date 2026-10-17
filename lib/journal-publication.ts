import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { founderEntrySchema } from "@/lib/founder-journal";
import { journalMediaKeys, journalPlainText } from "@/lib/journal-rich-text";

export async function lockFounderEntry(tx: Prisma.TransactionClient, id: string) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`journal:${id}`}))::text`;
}

export async function publishFounderRevision(tx: Prisma.TransactionClient, revision: { id: string; entryId: string; data: Prisma.JsonValue }, now: Date) {
  const entry = await tx.founderJournalEntry.findUnique({ where: { id: revision.entryId } });
  if (!entry || entry.visibility !== "PUBLIC") return false;
  const parsed = founderEntrySchema.safeParse(revision.data);
  if (!parsed.success) throw new Error("Invalid submitted entry");
  const { scheduledFor: _scheduledFor, ...data } = parsed.data;
  void _scheduledFor;
  const startup = await tx.startup.findFirst({ where: { id: data.startupId ?? "", founderId: entry.authorId, status: "LIVE" }, select: { id: true } });
  if (!startup) {
    await tx.founderJournalRevision.update({ where: { id: revision.id }, data: { status: "CHANGES_REQUESTED", reviewerNotes: "Publication paused: choose one of your live startups and submit again." } });
    return false;
  }
  const rich = data.contentJson;
  const mediaKeys = rich ? journalMediaKeys(rich) : [];
  if (mediaKeys.some(key => !key.startsWith(`founder-journal/${entry.authorId}/`))) throw new Error("Invalid image ownership");
  if (mediaKeys.length && await tx.mediaUpload.count({ where: { userId: entry.authorId, key: { in: mediaKeys } } }) !== mediaKeys.length) throw new Error("Submitted image unavailable");
  await tx.founderJournalEntry.update({ where: { id: entry.id }, data: {
    ...data, startupId: startup.id, body: rich ? journalPlainText(rich) : data.body,
    contentJson: rich ?? Prisma.DbNull, milestone: data.milestone || null,
    milestoneDone: Boolean(data.milestone && data.milestoneDone), mediaKeys,
    approvedAt: now, publishedAt: entry.publishedAt ?? now,
  } });
  await tx.founderJournalRevision.update({ where: { id: revision.id }, data: { status: "PUBLISHED" } });
  return true;
}

export async function publishScheduledJournals(now = new Date()) {
  const revisions = await db.founderJournalRevision.findMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, select: { id: true, entryId: true }, orderBy: { scheduledAt: "asc" }, take: 100 });
  let founders = 0;
  let failed = 0;
  for (const item of revisions) {
    try {
      const published = await db.$transaction(async tx => {
        await lockFounderEntry(tx, item.entryId);
        const revision = await tx.founderJournalRevision.findUnique({ where: { id: item.id } });
        if (!revision || revision.status !== "SCHEDULED" || !revision.scheduledAt || revision.scheduledAt > now) return false;
        return publishFounderRevision(tx, revision, now);
      });
      if (published) founders++;
    } catch { failed++; }
  }
  const admins = await db.journalPost.updateMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now, scheduledAt: null } });
  if (failed) throw new Error(`${failed} scheduled founder publication(s) failed; retry required.`);
  return { founders, admins: admins.count };
}
