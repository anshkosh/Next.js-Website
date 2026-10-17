import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { founderEntrySchema, journalPage } from "@/lib/founder-journal";
import FounderJournalReview from "@/components/admin/FounderJournalReview";

export default async function FounderReviewPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user.emailVerified || session.user.banned || !["admin", "reviewer"].includes(session.user.role ?? "")) redirect("/admin/dashboard");
  const page = journalPage((await searchParams).page);
  const rows = await db.founderJournalRevision.findMany({ where: { status: { in: ["PENDING_REVIEW", "SCHEDULED"] }, entry: { visibility: "PUBLIC" } }, include: { entry: { select: { approvedAt: true, authorId: true, startup: { select: { name: true } } } } }, orderBy: { updatedAt: "asc" }, skip: (page - 1) * 50, take: 51 });
  return <div className="max-w-4xl space-y-6"><h1 className="font-heading text-2xl font-bold">Founder Journal review</h1><p className="text-sm leading-relaxed text-gray-600">Review public submissions and scheduled replacements. Private entries are not included. Requested times use IST. Approval after a requested time has passed returns the entry to its founder with a note.</p>
    {!rows.length && <p className="rounded-xl border bg-white p-6 text-sm text-gray-600">No entries awaiting review or publication.</p>}
    {rows.slice(0, 50).map(row => {
      const parsed = founderEntrySchema.safeParse(row.data); if (!parsed.success) return null;
      return <FounderJournalReview key={`${row.id}-${row.version}-${row.status}`} id={row.id} version={row.version} data={parsed.data} status={row.status} scheduledAt={row.scheduledAt?.toISOString() ?? null} notes={row.reviewerNotes} startup={row.entry.startup?.name ?? "Startup"} hasLiveVersion={Boolean(row.entry.approvedAt)} />;
    })}
    <nav aria-label="Review pages" className="flex gap-4 text-sm font-semibold text-coral-700">{page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}{rows.length > 50 && <Link href={`?page=${page + 1}`}>Next →</Link>}</nav>
  </div>;
}
