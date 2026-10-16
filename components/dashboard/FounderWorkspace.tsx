import Link from "next/link";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import { FOUNDER_TOOLS } from "@/lib/founder-toolkit";

const featured = ["validation", "mvp", "runway", "pitch"];

export default function FounderWorkspace() {
  return <section aria-label="Your founder workspace" className="mb-12 grid gap-6 lg:grid-cols-[1fr_2fr]">
    <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
      <BookOpen aria-hidden="true" className="mb-5 h-7 w-7 text-coral-600" />
      <h2 className="font-heading text-2xl font-bold text-gray-900">Founder Journal</h2>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">A place for the thinking behind your startup. Capture ideas, reflect on your week, and track milestones.</p>
      <p className="my-5 flex items-start gap-2 text-xs leading-relaxed text-slate-600"><LockKeyhole aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />Start private. Choose which entries to share on your startup page.</p>
      <Link href="/dashboard/journal" className="mt-auto inline-flex min-h-11 items-center gap-2 font-semibold text-coral-700 hover:underline">Open your journal <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-bold text-gray-900">Free founder tools</h2>
        <Link href="/launch-support#tools-heading" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-coral-700 hover:underline">Explore all 9 tools <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {FOUNDER_TOOLS.filter(tool => featured.includes(tool.id)).map(tool => <Link key={tool.id} href={`/launch-support/${tool.id}`} className="rounded-xl border border-gray-200 p-4 transition-colors hover:border-coral-400 hover:bg-coral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600">
          <h3 className="text-sm font-semibold text-gray-900">{tool.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">{tool.description}</p>
        </Link>)}
      </div>
    </div>
  </section>;
}
