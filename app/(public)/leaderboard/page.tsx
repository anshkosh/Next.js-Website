import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight } from "lucide-react";
import LeaderboardList from "@/components/startup/LeaderboardList";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";
import { getLeaderboard, leaderboardPageNumber, LEADERBOARD_PAGE_SIZE } from "@/lib/leaderboard";
import { seoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = seoMetadata({
  title: "Startup Leaderboard — Anshkosh",
  description: "Explore published Indian startups ranked by net votes, founder progress, approved community participation, and founder replies. Rankings show activity, not verified demand.",
  path: "/leaderboard",
});

export default async function LeaderboardPage({ searchParams }: {
  searchParams?: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const cookieId = process.env.DATABASE_URL ? (await cookies()).get("anshkosh_vid")?.value : undefined;
  const { entries, totalCount, page, totalPages } = await getLeaderboard(leaderboardPageNumber(params?.page), cookieId);

  return (
    <div>
      <section className="page-intro-spacing border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
          <h1 className="page-title">Startup <span className="text-coral-500">leaderboard</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-gray-600">Rankings combine net votes with capped points for public founder progress, approved community participation, and founder replies. They show activity on Anshkosh, not verified demand or traction.</p>
          <Link href="/discover" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-coral-700 underline underline-offset-4">Browse all startups <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </section>
      <section aria-label="Startup rankings" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
        {entries.length ? (
          <>
            <p className="mb-4 text-sm text-gray-600">Showing {(page - 1) * LEADERBOARD_PAGE_SIZE + 1}–{Math.min(page * LEADERBOARD_PAGE_SIZE, totalCount)} of {totalCount.toLocaleString("en-IN")} published {totalCount === 1 ? "startup" : "startups"}</p>
            <LeaderboardList entries={entries} />
            <details className="mt-4 text-sm leading-relaxed text-gray-600">
              <summary className="cursor-pointer font-semibold underline underline-offset-4">How signals and ranks work</summary>
              <p className="mt-2">All-time signals = upvotes − downvotes + 2 points per founder publishing day (up to 10 days) + 2 per community participant (up to 20) + 3 per participant with a founder reply (up to 10). Equal scores share a global rank.</p>
              <p className="mt-2">Publishing days combine startup updates and approved, published public founder journal entries, counted once per UTC day. Only approved, non-empty comments count; participants are deduplicated by email per startup, excluding its owner’s email. Legacy imported comments without an email are grouped by commenter name, excluding the owner’s name. Repeat comments and reply edits do not earn extra points. Private, pending, rejected, and future journal entries do not count. Removing eligible activity removes its points.</p>
              <p className="mt-2">Email addresses are not shown. Comment emails are not verified identities, and votes are anonymous: these signals reflect participation, not unique verified backers, investment, or verified traction. Other directory vote controls show net votes separately.</p>
            </details>
            {totalPages > 1 && (
              <nav aria-label="Leaderboard pages" className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
                {page > 1 && <Link href={page === 2 ? "/leaderboard" : `/leaderboard?page=${page - 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-4 font-medium text-gray-700 transition-colors hover:bg-gray-100">Previous page</Link>}
                <span className="text-gray-600">Page {page} of {totalPages}</span>
                {page < totalPages && <Link href={`/leaderboard?page=${page + 1}`} className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-4 font-medium text-gray-700 transition-colors hover:bg-gray-100">Next page</Link>}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <ErrorState compact headingLevel={2} status="No ranked startups yet" title="The starting line is still open." message="Published startup profiles will appear here, ranked by their all-time signals. Building something? Submit your profile for review." foxComment="I polished the podium. Now we need the builders.">
              <Link href="/startup/new" className={recoveryLinkClass}>List your startup</Link>
              <Link href="/discover" className={secondaryRecoveryLinkClass}>Explore the directory</Link>
            </ErrorState>
          </div>
        )}
      </section>
    </div>
  );
}
