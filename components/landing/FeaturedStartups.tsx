import { db } from "@/lib/db";
import StartupCard from "@/components/startup/StartupCard";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default async function FeaturedStartups() {
  // Keep the public landing page usable in a fresh local checkout before
  // PostgreSQL has been configured. The section will appear automatically
  // once DATABASE_URL is provided and featured startups are seeded.
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("anshkosh_vid")?.value;

  const featured = await db.featuredStartup.findMany({
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
  });

  if (!featured || featured.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-16 md:py-24 border-b border-gray-100 overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 border border-coral-200 text-coral-600 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-coral-500" />
              <span>Curated Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight font-heading">
              Featured <span className="text-coral-500">Startups</span>
            </h2>
          </div>

          <Link
            href="/discover"
            className="text-sm font-semibold text-coral-500 hover:text-coral-600 inline-flex items-center gap-1.5 transition-colors group"
          >
            <span>View all</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Horizontal Scrollable Row */}
        <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-coral-500 scrollbar-track-gray-100 -mx-4 px-4 sm:mx-0 sm:px-0">
          {featured.map((item) => {
            const startup = item.startup;
            const hasUpvoted = startup.upvotes ? startup.upvotes.length > 0 : false;
            return (
              <div
                key={item.id}
                className="min-w-[320px] max-w-[380px] snap-start flex-shrink-0 flex flex-col"
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
        </div>
      </div>
    </section>
  );
}
