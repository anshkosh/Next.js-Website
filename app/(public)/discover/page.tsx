import { startupSearchWhere } from "@/lib/startup-search";
import { publicStartupCard, publicStartupCardSelect } from "@/lib/public-startup-card";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import StartupCard from "@/components/startup/StartupCard";
import SearchBar from "@/components/search/SearchBar";
import { cookies } from "next/headers";
import Link from "next/link";
import { seoMetadata } from "@/lib/seo";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";
import FeaturedStartups from "@/components/landing/FeaturedStartups";

export const dynamic = "force-dynamic";

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
  }>;
}) {
  const searchParams = await props.searchParams;
  const categorySlug = searchParams?.category;
  const query = searchParams?.q;
  const page = parseInt(searchParams?.page || "1", 10);
  const pageSize = 20;

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
    status: "LIVE",
  };

  if (categorySlug && categorySlug !== "all") {
    where.category = { slug: categorySlug };
  }

  if (query && query.trim() !== "") {
    where.AND = startupSearchWhere(query);
  }

  const [startups, totalCount, categories] = await Promise.all([
    db.startup.findMany({
      where,
      select: publicStartupCardSelect(cookieId),
      orderBy: [{ signalCount: "desc" }, { createdAt: "desc" }],
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

  const formattedStartups = startups.map(publicStartupCard);

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

      {!categorySlug && !query && page === 1 && <FeaturedStartups cookieId={cookieId} />}

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
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
                href={`/discover?page=${page - 1}${query ? `&q=${query}` : ""}${categorySlug ? `&category=${categorySlug}` : ""}`}
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
                href={`/discover?page=${page + 1}${query ? `&q=${query}` : ""}${categorySlug ? `&category=${categorySlug}` : ""}`}
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
