import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FounderJournal from "@/components/dashboard/FounderJournal";
import { journalPage } from "@/lib/founder-journal";

export const metadata = { title: "Founder Journal | Anshkosh", robots: { index: false, follow: false } };

export default async function JournalPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const page = journalPage((await searchParams).page);
  const [rows, startups] = await Promise.all([
    db.founderJournalEntry.findMany({
      where: { authorId: session.user.id },
      select: { id: true, title: true, body: true, prompt: true, visibility: true, startupId: true, milestone: true, milestoneDone: true, updatedAt: true, startup: { select: { name: true, slug: true, status: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 21,
    }),
    db.startup.findMany({ where: { founderId: session.user.id }, select: { id: true, name: true, status: true }, orderBy: { name: "asc" } }),
  ]);
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
    <Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 hover:underline">← Dashboard</Link>
    <h1 className="mt-4 font-heading text-3xl font-bold text-gray-900 sm:text-4xl">Founder Journal</h1>
    <p className="mb-8 mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">Keep a record of the journey. Write freely, use a prompt, or mark a milestone. Every entry starts private; you choose what to share on your startup page.</p>
    <FounderJournal entries={rows.slice(0, 20).map(row => ({ ...row, updatedAt: row.updatedAt.toISOString() }))} startups={startups} />
    {(page > 1 || rows.length > 20) && <nav aria-label="Journal pages" className="mt-8 flex flex-wrap items-center gap-5 text-sm font-semibold">
      {page > 1 && <Link href={`/dashboard/journal?page=${page - 1}`} className="inline-flex min-h-11 items-center text-coral-700">← Newer entries</Link>}
      <span>Page {page}</span>
      {rows.length > 20 && <Link href={`/dashboard/journal?page=${page + 1}`} className="inline-flex min-h-11 items-center text-coral-700">Older entries →</Link>}
    </nav>}
  </div>;
}
