"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { founderEntrySchema } from "@/lib/founder-journal";
import { journalMediaKeys, journalPlainText } from "@/lib/journal-rich-text";
import { Prisma } from "@prisma/client";

function invalidate(slugs: (string | null | undefined)[]) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journal");
  revalidatePath("/founder-journal/[id]/[slug]", "page");
  revalidatePath("/sitemap.xml");
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(`/startups/${slug}`);
}

export async function saveFounderEntry(id: string | null, input: unknown) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.emailVerified || session.user.banned) return { error: "Sign in with a verified account to save an entry." };
  const parsed = founderEntrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id !== null && (typeof id !== "string" || !id || id.length > 100)) return { error: "Entry not found." };

  try {
    const rich = parsed.data.contentJson;
    const mediaKeys = rich ? journalMediaKeys(rich) : [];
    if (mediaKeys.some(key => !key.startsWith(`founder-journal/${session.user.id}/`))) return { error: "Use images uploaded to your own journal." };
    if (mediaKeys.length && await db.mediaUpload.count({ where: { userId: session.user.id, key: { in: mediaKeys } } }) !== mediaKeys.length) return { error: "One of these images is unavailable. Upload it again before saving." };
    const result = await db.$transaction(async (tx) => {
      const existing = id ? await tx.founderJournalEntry.findFirst({
        where: { id, authorId: session.user.id }, include: { startup: { select: { slug: true } } },
      }) : null;
      if (id && !existing) return { error: "Entry not found." };
      const entry = parsed.data;
      const startup = entry.startupId ? await tx.startup.findFirst({
        where: { id: entry.startupId, founderId: session.user.id },
        select: { id: true, slug: true, status: true },
      }) : null;
      if (entry.startupId && !startup) return { error: "Choose one of your own startups." };
      // Allow withdrawing a public entry even if its startup has been suspended.
      if (entry.visibility === "PUBLIC" && startup?.status !== "LIVE") return { error: "Public entries need a live startup. You can save this entry privately." };
      const data = {
        ...entry, startupId: startup?.id ?? null,
        body: rich ? journalPlainText(rich) : entry.body,
        contentJson: rich ?? Prisma.DbNull,
        mediaKeys,
        milestone: entry.milestone || null,
        milestoneDone: Boolean(entry.milestone && entry.milestoneDone),
        publishedAt: entry.visibility === "PUBLIC" ? existing?.publishedAt ?? new Date() : null,
      };
      if (existing) {
        const changed = await tx.founderJournalEntry.updateMany({ where: { id: existing.id, authorId: session.user.id }, data });
        if (changed.count !== 1) return { error: "Entry not found." };
      } else {
        await tx.founderJournalEntry.create({ data: { ...data, authorId: session.user.id } });
      }
      return { success: true, slugs: [existing?.startup?.slug, startup?.slug] };
    });
    if (result.error) return { error: result.error };
    invalidate(result.slugs ?? []);
    return { success: true };
  } catch {
    // Journal text may be sensitive: never put input or query payloads in logs.
    return { error: "Your entry could not be saved. Your text is still here; please try again." };
  }
}

export async function deleteFounderEntry(id: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || !session.user.emailVerified || session.user.banned) return { error: "Sign in to delete an entry." };
  if (typeof id !== "string" || !id || id.length > 100) return { error: "Entry not found." };
  try {
    const existing = await db.founderJournalEntry.findFirst({
      where: { id, authorId: session.user.id }, select: { startup: { select: { slug: true } } },
    });
    if (!existing) return { error: "Entry not found." };
    const deleted = await db.founderJournalEntry.deleteMany({ where: { id, authorId: session.user.id } });
    if (deleted.count !== 1) return { error: "Entry not found." };
    invalidate([existing.startup?.slug]);
    return { success: true };
  } catch {
    return { error: "Your entry could not be deleted. Please try again." };
  }
}
