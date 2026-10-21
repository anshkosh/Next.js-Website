import { publicStartupWhere } from "@/lib/startup-visibility";
import { startupSearchWhere } from "@/lib/startup-search";
import { publicStartupCard, publicStartupCardSelect } from "@/lib/public-startup-card";
import { withActivitySignals } from "@/lib/leaderboard";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import StartupCard from "@/components/startup/StartupCard";
import SearchBar from "@/components/search/SearchBar";
import { cookies } from "next/headers";
import Link from "next/link";
import { seoMetadata } from "@/lib/seo";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";
import FeaturedStartups from "@/components/landing/FeaturedStartups";
import { pageNumber, pageHref, searchText } from "@/lib/pagination";

export const dynamic = "force-dynamic";

const SORTS = [
  { value: "votes", label: "Most votes", orderBy: [{ signalCount: "desc" }, { createdAt: "desc" }] },
  { value: "newest", label: "Newest", orderBy: [{ createdAt: "desc" }] },
  { value: "updated", label: "Recently updated", orderBy: [{ updatedAt: "desc" }] },
] as const satisfies { value: string; label: string; orderBy: Prisma.StartupOrderByWithRelationInput[] }[];

export const metadata = seoMetadata({
  title: "Discover Startups — Anshkosh",
  description: "Browse and discover Indian startups on Anshkosh. Search by category, explore evidence, and follow founder progress.",
  path: "/discover",
});

export default async function DiscoverPage(props: {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    page?: string;
    sort?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const categorySlug = searchText(searchParams?.category, 100);
  const query = searchText(searchParams?.q);
  const page = pageNumber(searchParams?.page);
  const sort = SORTS.find(option => option.value === searchParams?.sort) ?? SORTS[0];
  // Links keep the default sort out of the URL.
  const sortParam = sort === SORTS[0] ? undefined : sort.value;
  // Fill complete rows in both the two- and three-column layouts.
  const pageSize = 24;

  if (!process.env.DATABASE_URL) {
    return (
      <div className="w-full">
        <section className="page-intro-spacing bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 text-center max-w-5xl">
            <h1 className="page-title mb-4">Discover <span className="text-coral-500">Startups</span></h1>
            <p className="text-lg leading-relaxed text-gray-600 max-w-2xl mx-auto">Discover Indian startups before launch, explore their evidence, and follow founder progress. We’re preparing the first public profiles for the Anshkosh pilot.</p>
            <Link href="/categories" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-coral-500 hover:text-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
              Browse categories
            </Link>
            <Link href="/leaderboard" className="ml-3 mt-6 inline-flex min-h-11 items-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-coral-500 hover:text-coral-600">View leaderboard</Link>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="rounded-2xl border border-coral-100 bg-coral-50 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">The pilot directory is being prepared</h2>
            <p className="text-gray-600 mb-6">Founders can register now and share a startup when the pilot opens.</p>
            <p className="text-gray-600 mb-6">Learn <Link href="/faq" className="text-coral-600 underline">how public validation works</Link> and read our <Link href="/trust-safety" className="text-coral-600 underline">trust and safety standards</Link>.</p>
            <Link href="/startup/new" className="inline-flex min-h-12 items-center rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white hover:bg-coral-700">List your startup</Link>
          </div>
        </section>
      </div>
    );
  }

  const cookieStore = await cookies();
  const cookieId = cookieStore.get("anshkosh_vid")?.value;

  const where: Prisma.StartupWhereInput = {
    ...publicStartupWhere,
  };

  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug };
  }

  if (query && query.trim() !== "") {
    where.AND = startupSearchWhere(query);
  }

  // Unfiltered browsing shows featured startups in their own carousel, so keep
  // them out of the grid on every page instead of showing them twice.
  const showFeatured = !categorySlug && !query;
  const now = new Date();
  const featuredIds = showFeatured
    ? (await db.featuredStartup.findMany({
        where: { startup: publicStartupWhere, OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] },
        select: { startupId: true },
      })).map(row => row.startupId)
    : [];
  if (featuredIds.length > 0) where.id = { notIn: featuredIds };

  const [startups, totalCount, categories] = await Promise.all([
    db.startup.findMany({
      where,
      select: publicStartupCardSelect(cookieId),
      orderBy: sort.orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.startup.count({ where }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, iconName: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const formattedStartups = await withActivitySignals(startups.map(publicStartupCard));

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="page-intro-spacing bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <h1 className="page-title mb-4">
            Discover <span className="text-coral-500">Startups</span>
          </h1>
          <p className="text-lg leading-relaxed text-gray-600 mb-8 max-w-2xl mx-auto">
            Explore what Indian founders are building, across industries and stages.
          </p>
          <SearchBar categories={categories} />
          <Link href="/categories" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-coral-500 hover:text-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
            Browse categories
          </Link>
          <Link href="/leaderboard" className="ml-3 mt-6 inline-flex min-h-11 items-center rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-coral-500 hover:text-coral-600">View leaderboard</Link>
        </div>
      </section>

      {showFeatured && page === 1 && <FeaturedStartups cookieId={cookieId} />}

      {/* Main Content */}
      <section aria-labelledby={formattedStartups.length > 0 ? "discover-grid-title" : undefined} className="container mx-auto px-4 py-12 max-w-7xl">
        {formattedStartups.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="discover-grid-title" className="font-heading text-2xl font-bold text-gray-900">
                {query || (categorySlug && categorySlug !== "all") ? "Matching startups" : featuredIds.length > 0 ? "More startups" : "All startups"}
              </h2>
              <p className="mt-1 text-sm text-gray-600 tabular-nums">
                {totalCount.toLocaleString("en-IN")} {totalCount === 1 ? "startup" : "startups"}
              </p>
            </div>
            <nav aria-label="Sort startups" className="flex flex-wrap items-center gap-1 text-sm">
              <span className="mr-1 text-gray-600">Sort:</span>
              {SORTS.map(option => (
                <Link
                  key={option.value}
                  href={pageHref("/discover", 1, { q: query, category: categorySlug, sort: option === SORTS[0] ? undefined : option.value })}
                  aria-current={option === sort ? "true" : undefined}
                  className={`inline-flex min-h-10 items-center rounded-full px-3 font-medium transition-colors duration-(--duration-quick) ${option === sort ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {option.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedStartups.length > 0 ? (
            formattedStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))
          ) : (
            <div className="col-span-full rounded-2xl border border-gray-100 bg-white">
              <ErrorState
                compact
                headingLevel={2}
                status="No startups found"
                title="Kosh came back empty-pawed."
                message={query || (categorySlug && categorySlug !== "all")
                  ? "No startups matched these filters. Try a broader search or explore another category."
                  : page > 1
                    ? "There are no startup profiles on this page. Head back to the first page to keep exploring."
                    : "There aren’t any public startup profiles here yet. Building something? Yours could be first."}
                foxComment="I found a squirrel. It declined to pitch."
              >
                {query || (categorySlug && categorySlug !== "all") || page > 1 ? (
                  <Link href="/discover" className={recoveryLinkClass}>{query || (categorySlug && categorySlug !== "all") ? "Clear all filters" : "Back to first page"}</Link>
                ) : (
                  <Link href="/startup/new" className={recoveryLinkClass}>List your startup</Link>
                )}
                <Link href="/categories" className={secondaryRecoveryLinkClass}>Browse categories</Link>
              </ErrorState>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={pageHref("/discover", page - 1, { q: query, category: categorySlug, sort: sortParam })}
                className="px-4 py-2 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 font-medium"
              >
                Previous
              </Link>
            )}
            <span className="px-4 py-2 text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={pageHref("/discover", page + 1, { q: query, category: categorySlug, sort: sortParam })}
                className="px-4 py-2 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 font-medium"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
