import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import StartupCard from "@/components/startup/StartupCard";
import SearchBar from "@/components/search/SearchBar";
import { cookies } from "next/headers";
import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

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
        <section className="bg-white py-16 md:py-24 border-b border-gray-100">
          <div className="container mx-auto px-4 text-center max-w-5xl">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 font-heading">Discover <span className="text-coral-500">Startups</span></h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Discover Indian startups before launch, explore their evidence, and follow founder progress. We’re preparing the first public profiles for the Anshkosh pilot.</p>
          </div>
        </section>
        <section className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="rounded-2xl border border-coral-100 bg-coral-50 p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">The pilot directory is being prepared</h2>
            <p className="text-gray-600 mb-6">Founders can register now and share a startup when the pilot opens.</p>
            <p className="text-gray-600 mb-6">Learn <Link href="/faq" className="text-coral-600 underline">how public validation works</Link> and read our <Link href="/trust-safety" className="text-coral-600 underline">trust and safety standards</Link>.</p>
            <Link href="/register" className="inline-flex rounded-lg bg-coral-500 px-5 py-3 font-semibold text-white hover:bg-coral-600">Register as a founder</Link>
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
    const results = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Startup"
      WHERE status = 'LIVE'
      AND (
        name ILIKE ${"%" + query.trim() + "%"}
        OR tagline ILIKE ${"%" + query.trim() + "%"}
        OR description ILIKE ${"%" + query.trim() + "%"}
        OR (metadata->>'city') ILIKE ${"%" + query.trim() + "%"}
      )
    `;

    const startupIds = Array.isArray(results) ? results.map((r) => r.id) : [];

    if (startupIds.length === 0) {
      where.id = { in: ["no-match"] };
    } else {
      where.id = { in: startupIds };
    }
  }

  const [startups, totalCount, categories] = await Promise.all([
    db.startup.findMany({
      where,
      include: {
        category: true,
        upvotes: cookieId
          ? {
              where: { cookieId },
            }
          : false,
      },
      orderBy: [{ upvoteCount: "desc" }, { createdAt: "desc" }],
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

  const formattedStartups = startups.map((startup) => ({
    ...startup,
    hasUpvoted: startup.upvotes ? startup.upvotes.length > 0 : false,
  }));

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-white py-16 md:py-24 border-b border-gray-100">
        <div className="container mx-auto px-4 text-center max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 font-heading">
            Discover <span className="text-coral-500">Startups</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Explore the next generation of builders and innovators shaping the future of the Indian tech ecosystem.
          </p>
          <SearchBar categories={categories} />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formattedStartups.length > 0 ? (
            formattedStartups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))
          ) : (
            <div className="col-span-full text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No startups found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or category filters.
              </p>
              {(query || categorySlug) && (
                <Link
                  href="/discover"
                  className="mt-4 inline-block text-coral-500 hover:text-coral-600 font-medium"
                >
                  Clear all filters
                </Link>
              )}
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
