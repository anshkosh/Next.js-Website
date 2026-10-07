import { db } from "@/lib/db";
import StartupCard from "@/components/startup/StartupCard";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function FeaturedStartups() {
  const cookieId = process.env.DATABASE_URL ? (await cookies()).get("anshkosh_vid")?.value : undefined;
  const featured = process.env.DATABASE_URL ? await db.featuredStartup.findMany({
    where: { startup: { status: "LIVE" } },
    include: {
      startup: {
        include: {
          category: true,
          upvotes: cookieId
            ? {
                where: { cookieId },
              }
            : false,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: 6,
  }) : [];

  return (
    <section aria-labelledby="home-startups-title" className="bg-white py-16 md:py-20 border-b border-gray-100 overflow-hidden">
      <div className="mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 border border-coral-200 text-coral-600 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-coral-500" />
              <span>Explore the builders</span>
            </div>
            <h2 id="home-startups-title" className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight font-heading">
              Meet the startups<br className="sm:hidden" /> taking their next step.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">See the problem, meet the team, and explore what they’re building.</p>
          </div>

          <Link
            href="/discover"
            className="text-sm font-semibold text-coral-500 hover:text-coral-600 inline-flex items-center gap-1.5 transition-colors group"
          >
            <span>Discover all startups</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal Scrollable Row */}
        {featured.length > 0 ? <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-coral-500 scrollbar-track-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0">
          {featured.map((item) => {
            const startup = item.startup;
            const hasUpvoted = startup.upvotes ? startup.upvotes.length > 0 : false;
            return (
              <div
                key={item.id}
                className="w-[min(320px,calc(100vw-48px))] sm:w-[340px] snap-start flex-shrink-0 flex flex-col"
              >
                <StartupCard
                  startup={{
                    ...startup,
                    hasUpvoted,
                  }}
                />
              </div>
            );
          })}
        </div> : <div className="flex flex-col gap-5 rounded-xl border border-gray-200 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><h3 className="font-heading text-2xl font-semibold text-gray-900">Make room for what’s next.</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">New featured startup profiles will appear here as the pilot grows. Share what you’re building and submit your profile for review.</p></div><Link href="/startup/new" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:border-coral-500 hover:text-coral-700">List your startup <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>}
      </div>
    </section>
  );
}
