import Image from "next/image";
import Link from "next/link";
import UpvoteButton from "@/components/upvote/UpvoteButton";
import type { LeaderboardEntry } from "@/lib/leaderboard";
import SignalBreakdown from "@/components/startup/SignalBreakdown";

export default function LeaderboardList({ entries, title = "All-time rankings" }: { entries: LeaderboardEntry[]; title?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-4 sm:px-6">
        <h2 className="font-heading text-xl font-semibold text-gray-900">{title}</h2>
        <span className="w-32 shrink-0 text-center text-sm font-medium text-gray-600">Signals</span>
      </div>
      <ol aria-label="Startups ranked by all-time signals" className="divide-y divide-gray-100">
        {entries.map(startup => (
          <li key={startup.id} className="flex items-center gap-3 px-4 py-5 sm:gap-5 sm:px-6">
            <Link href={`/startups/${startup.slug}`} className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg sm:gap-5">
              <span className={`w-6 shrink-0 text-center font-heading text-xl font-semibold tabular-nums sm:w-8 sm:text-2xl ${startup.rank <= 3 && startup.leaderboardScore > 0 ? "text-coral-700" : "text-gray-500"}`}>
                <span className="sr-only">Rank </span>{startup.rank}
              </span>
              <div className="relative hidden h-14 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:flex">
                {startup.logoUrl
                  ? <Image src={startup.logoUrl} alt="" fill sizes="56px" className="object-contain p-1" />
                  : <span aria-hidden="true" className="font-heading text-2xl font-semibold text-coral-700">{startup.name.charAt(0)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="break-words font-heading text-xl font-semibold text-gray-900 transition-colors group-hover:text-coral-700">{startup.name}</h3>
                <p className="mt-1 break-words text-xs text-coral-700">{startup.category.name}</p>
                <p className="mt-1 line-clamp-2 break-words text-sm leading-relaxed text-gray-600">{startup.tagline}</p>
                {startup.updateCount > 0 && <p className="mt-2 text-xs text-gray-500">{startup.updateCount.toLocaleString("en-IN")} founder {startup.updateCount === 1 ? "update" : "updates"}</p>}
              </div>
            </Link>
            <div className="shrink-0">
              <UpvoteButton startupId={startup.id} startupName={startup.name} initialCount={startup.upvoteCount} initialUpvoted={startup.hasUpvoted} initialDownvoted={startup.hasDownvoted} initialDownvotes={startup.downvoteCount} activitySignals={startup.activitySignals} />
              <div className="w-32"><SignalBreakdown startup={startup} /></div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
