import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default function FounderWorkspace({ showJournal = true }: { showJournal?: boolean }) {
  return <div aria-label="Founder resources" className="flex flex-wrap gap-2">
    <Link href="/launch-support#tools-heading" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-coral-200 bg-coral-50 px-4 py-2.5 text-sm font-semibold text-coral-700 hover:bg-coral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
      Tools to build and launch <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
    </Link>
    {showJournal && <Link href="/dashboard/journal" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
      <BookOpen aria-hidden="true" className="h-4 w-4 shrink-0" />Journal
    </Link>}
  </div>;
}
