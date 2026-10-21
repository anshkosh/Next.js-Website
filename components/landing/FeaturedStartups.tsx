import { publicStartupWhere } from "@/lib/startup-visibility";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import FeaturedStartupsCarousel from "@/components/landing/FeaturedStartupsCarousel";
import { db } from "@/lib/db";
import { publicStartupCard, publicStartupCardSelect } from "@/lib/public-startup-card";
import { withActivitySignals } from "@/lib/leaderboard";

export default async function FeaturedStartups({ cookieId }: { cookieId?: string } = {}) {
  if (!process.env.DATABASE_URL) return null;

  const visitorCookieId = cookieId ?? (await cookies()).get("anshkosh_vid")?.value;
  const now = new Date();
  const rows = await db.featuredStartup.findMany({
    where: {
      startup: publicStartupWhere,
      OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }],
    },
    orderBy: { sortOrder: "asc" },
    select: { startup: { select: publicStartupCardSelect(visitorCookieId) } },
  });
  const startups = await withActivitySignals(rows.map(({ startup }) => publicStartupCard(startup)));

  if (startups.length === 0) return null;

  return (
    <section aria-labelledby="discover-featured-title" className="border-b border-gray-100 bg-white py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-coral-600">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Selected for Discover</span>
            </div>
            <h2 id="discover-featured-title" className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Featured startups.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600">
              A closer look at the teams building across India.
            </p>
          </div>
          <Link href="/leaderboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-coral-600 transition-colors hover:text-coral-700">
            View rankings <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <FeaturedStartupsCarousel startups={startups} />
      </div>
    </section>
  );
}
