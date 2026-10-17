import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { publicFounderEntries } from "@/lib/founder-journal-queries";
import JournalRichContent from "@/components/journal/JournalRichContent";
import { founderEntryPath } from "@/lib/founder-journal-seo";

export default function FounderJournalSection({ entries, slug, page }: {
  entries: Awaited<ReturnType<typeof publicFounderEntries>>; slug: string; page: number;
}) {
  return <section aria-labelledby="founder-journal-heading" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
    <div className="mb-6 flex items-center gap-3">
      <BookOpen aria-hidden="true" className="h-6 w-6 shrink-0 text-coral-600" />
      <div><h2 id="founder-journal-heading" className="font-heading text-2xl font-bold text-gray-900">Founder Journal</h2><p className="mt-1 text-sm text-gray-600">Reflections and milestones the founder has chosen to share.</p></div>
    </div>
    {entries.length === 0 ? <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-600">No public journal entries here yet.</p> : <div className="space-y-5">
      {entries.slice(0, 10).map(entry => <article key={entry.id} className="min-w-0 rounded-xl border border-gray-200 p-5">
        {entry.publishedAt && <time className="text-xs text-gray-500" dateTime={entry.publishedAt.toISOString()}>{entry.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}</time>}
        <h3 className="mt-2 break-words text-lg font-bold text-gray-900"><Link href={founderEntryPath(entry)} className="hover:text-coral-700 hover:underline">{entry.title}</Link></h3>
        <div className="mt-3"><JournalRichContent content={entry.contentJson} fallback={entry.body} /></div>
        {entry.milestone && <p className="mt-4 break-words rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{entry.milestoneDone ? "✓ Milestone complete" : "○ Milestone in progress"}: {entry.milestone}</p>}
        <Link href={founderEntryPath(entry)} className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 hover:underline">Read and share entry →</Link>
      </article>)}
    </div>}
    {(page > 1 || entries.length > 10) && <nav aria-label="Public journal pages" className="mt-6 flex flex-wrap gap-5 text-sm font-semibold text-coral-700">
      {page > 1 && <Link className="inline-flex min-h-11 items-center" href={`/startups/${slug}?journalPage=${page - 1}#section-founder-journal`}>← Newer entries</Link>}
      {entries.length > 10 && <Link className="inline-flex min-h-11 items-center" href={`/startups/${slug}?journalPage=${page + 1}#section-founder-journal`}>Older entries →</Link>}
    </nav>}
  </section>;
}
