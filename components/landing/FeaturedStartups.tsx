import { db } from "@/lib/db";
import UpvoteButton from "@/components/upvote/UpvoteButton";
import { cookies } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, Trophy } from "lucide-react";

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
          downvotes: cookieId
            ? {
                where: { cookieId },
              }
            : false,
        },
      },
    },
    orderBy: [
      { startup: { signalCount: "desc" } },
      { sortOrder: "asc" },
      { id: "asc" },
    ],
    take: 6,
  }) : [];

  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="home-startups-title" className="bg-white py-16 md:py-20 border-b border-gray-100 overflow-hidden">
      <div className="mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 border border-coral-200 text-coral-600 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-coral-500" />
              <span>Explore the builders</span>
            </div>
            <h2 id="home-startups-title" className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight font-heading">
              Featured startups.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">Discover what founders are building. Upvote the startups you believe in.</p>
          </div>

          <Link
            href="/leaderboard"
            className="text-sm font-semibold text-coral-500 hover:text-coral-600 inline-flex items-center gap-1.5 transition-colors group"
          >
            <span>View full leaderboard</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Trophy aria-hidden="true" className="h-4 w-4 text-coral-600" />
              <span>Community favourites</span>
            </div>
            <span className="text-right text-xs text-gray-600">Ranked by net signals</span>
          </div>

              <div aria-hidden="true" className="hidden items-center gap-6 border-b border-gray-100 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 md:flex">
                <span className="w-8 shrink-0 text-center">Rank</span>
                <span className="flex-1">Startup</span>
                <span className="w-40 shrink-0">Category</span>
                <span className="w-32 shrink-0 text-center">Signals</span>
              </div>
              <ol aria-label="Featured startups ranked by signals" className="divide-y divide-gray-100">
                {featured.map(({ id, startup }, index) => {
                  const isLeader = index === 0 && startup.signalCount > 0;

                  return (
                    <li key={id} className={`flex items-center gap-3 px-4 py-5 sm:gap-6 sm:px-6 ${isLeader ? "bg-coral-50/60" : "bg-white"}`}>
                      <Link href={`/startups/${startup.slug}`} className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg sm:gap-6">
                        <span className={`hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold tabular-nums sm:flex ${isLeader ? "bg-coral-500 text-white" : "text-gray-500"}`}>
                          <span className="sr-only">Rank </span>{index + 1}
                        </span>
                        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                          <div className="relative shrink-0">
                            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white sm:h-14 sm:w-14">
                              {startup.logoUrl ? (
                                <Image src={startup.logoUrl} alt="" fill sizes="(min-width: 640px) 56px, 40px" className="object-contain p-1" />
                              ) : (
                                <span aria-hidden="true" className="font-heading text-2xl font-bold text-coral-600">{startup.name.charAt(0)}</span>
                              )}
                            </div>
                            <span className={`absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold tabular-nums sm:hidden ${isLeader ? "bg-coral-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                              <span className="sr-only">Rank </span>{index + 1}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="break-words text-base font-bold text-gray-900 transition-colors group-hover:text-coral-600 sm:text-lg">{startup.name}</h3>
                              {isLeader && <span className="inline-flex items-center gap-1 rounded-full border border-coral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-coral-700"><Trophy aria-hidden="true" className="h-3 w-3" />Top featured</span>}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-600 sm:text-sm">{startup.tagline}</p>
                            <p className="mt-2 text-[11px] font-medium text-coral-700 md:hidden">{startup.category.name}</p>
                          </div>
                        </div>
                        <span className="hidden w-40 shrink-0 text-sm text-gray-600 md:block">{startup.category.name}</span>
                      </Link>
                      <div className="shrink-0">
                        <UpvoteButton
                          startupId={startup.id}
                          startupName={startup.name}
                          initialCount={startup.upvoteCount}
                          initialUpvoted={Boolean(startup.upvotes?.length)}
                          initialDownvoted={Boolean(startup.downvotes?.length)}
                          initialDownvotes={startup.downvoteCount}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
        </div>
      </div>
    </section>
  );
}
