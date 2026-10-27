import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import LeaderboardList from "@/components/startup/LeaderboardList";
import { getLeaderboard } from "@/lib/leaderboard";

const HOMEPAGE_STARTUP_COUNT = 5;

export default async function TopRankedStartups() {
  const cookieId = process.env.DATABASE_URL
    ? (await cookies()).get("anshkosh_vid")?.value
    : undefined;
  const { entries } = await getLeaderboard(1, cookieId, false, HOMEPAGE_STARTUP_COUNT);
  const topStartups = entries.slice(0, HOMEPAGE_STARTUP_COUNT);

  if (topStartups.length === 0) return null;

  return (
    <section aria-labelledby="home-startups-title" className="overflow-hidden border-b border-gray-100 bg-white pt-8 pb-16 md:pt-10 md:pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-coral-600">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Explore the builders</span>
            </div>
            <h2 id="home-startups-title" className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Top startups, ranked.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
              The five highest-ranked published startups, based on net votes and capped points for founder progress, approved community participants, and participants with founder replies.
            </p>
          </div>
          <Link href="/leaderboard" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-coral-600 transition-colors hover:text-coral-700">
            <span>View full leaderboard</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <LeaderboardList entries={topStartups} title="Top five by signals" />
      </div>
    </section>
  );
}
