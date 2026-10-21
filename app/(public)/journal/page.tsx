import { db } from "@/lib/db";
import { seoMetadata } from "@/lib/seo";
import Link from "next/link";
import Image from "next/image";
import JournalCard from "@/components/landing/JournalCard";
import { BookOpen } from "lucide-react";
import { calculateReadingTime } from "@/lib/journal-reading-time.mjs";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

const PER_PAGE = 12;
export const dynamic = "force-dynamic";

export const metadata = seoMetadata({
  title: "Journal | Anshkosh — Startup Insights & Founder Stories",
  description: "Explore articles, founder stories, industry trends, and startup insights from the Anshkosh team.",
  path: "/journal",
});

export default async function JournalPage(props: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const categorySlug = searchParams.category ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const skip = (page - 1) * PER_PAGE;

  if (!process.env.DATABASE_URL) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <section className="page-intro-spacing bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <div className="inline-flex items-center gap-2 bg-coral-50 text-coral-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4"><BookOpen size={15} /> Anshkosh Journal</div>
            <h1 className="page-title mb-4">Stories, insights & ideas</h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">The Journal is being prepared for the pilot. Check back soon for founder stories and startup insights.</p>
          </div>
        </section>
        <div className="container mx-auto px-4 max-w-3xl py-12 text-center"><Link href="/contact" className="text-coral-600 font-semibold hover:text-coral-700">Suggest a story or topic →</Link></div>
      </div>
    );
  }

  const categoryFilter = categorySlug
    ? { category: { slug: categorySlug } }
    : {};

  const [posts, totalCount, categories, featuredPost] = await Promise.all([
    db.journalPost.findMany({
      where: { status: "PUBLISHED", ...categoryFilter },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      skip,
      take: PER_PAGE,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImageUrl: true,
        authorName: true,
        contentHtml: true,
        isFeatured: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        category: { select: { name: true, slug: true } },
      },
    }),
    db.journalPost.count({ where: { status: "PUBLISHED", ...categoryFilter } }),
    db.journalCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true } }),
    // Featured post for hero (only on first page, no category filter)
    !categorySlug && page === 1
      ? db.journalPost.findFirst({
          where: { status: "PUBLISHED", isFeatured: true },
          orderBy: { publishedAt: "desc" },
          select: {
            slug: true, title: true, excerpt: true, coverImageUrl: true,
            authorName: true, contentHtml: true, publishedAt: true,
            updatedAt: true,
            category: { select: { name: true, slug: true } },
          },
        })
      : Promise.resolve(null),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);

  const buildPageUrl = (p: number) => {
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/journal${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <section className="page-intro-spacing bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 bg-coral-50 text-coral-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            <BookOpen size={15} /> Anshkosh Journal
          </div>
          <h1 className="page-title mb-4">
            Stories, insights & ideas
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Founder stories, industry trends, and practical startup insights from the Anshkosh team.
          </p>
        </div>
      </section>

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <section className="bg-white border-b border-gray-100 sticky top-16 z-30">
          <div className="container mx-auto px-4 max-w-6xl">
            <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
              <Link
                href="/journal"
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !categorySlug
                    ? "bg-coral-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                All
              </Link>
              {categories.map(cat => (
                <Link
                  key={cat.slug}
                  href={`/journal?category=${cat.slug}`}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categorySlug === cat.slug
                      ? "bg-coral-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 max-w-6xl py-12">
        {/* Featured post hero — only on first unfiltered page */}
        {featuredPost && (
          <div className="mb-12">
            <Link
              href={`/journal/${featuredPost.slug}`}
              className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative aspect-video md:aspect-auto md:min-h-[320px] bg-gradient-to-br from-coral-50 to-orange-100">
                  {featuredPost.coverImageUrl ? (
                    <Image
                      src={featuredPost.coverImageUrl}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-(--duration-slow)"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen size={64} className="text-coral-200" />
                    </div>
                  )}
                </div>
                <div className="p-8 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-coral-600 text-white text-xs font-bold px-3 py-1 rounded-full">✦ Featured</span>
                    {featuredPost.category && (
                      <span className="text-sm text-gray-500">{featuredPost.category.name}</span>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 leading-snug group-hover:text-coral-600 transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="text-gray-500 leading-relaxed line-clamp-3">{featuredPost.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-600">{featuredPost.authorName}</span>
                    {featuredPost.publishedAt && (
                      <span>{featuredPost.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                    )}
                    <span>{calculateReadingTime(featuredPost.contentHtml)}m read</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Post Grid */}
        {posts.length === 0 ? (
          <ErrorState
            compact
            headingLevel={2}
            status="No journal stories found"
            title="A little quiet between chapters."
            message={categorySlug
              ? "No stories in this category yet. Browse the rest of the Journal, or suggest a story you’d love to read."
              : page > 1
                ? "There are no stories on this page. Head back to the first page for another chapter."
                : "Our next chapter is still being written. Check back for founder stories, or send us an idea."}
            foxComment="I’d write something, but the keyboard isn’t paw-friendly."
          >
            {(categorySlug || page > 1) && <Link href="/journal" className={recoveryLinkClass}>{categorySlug ? "Browse all stories" : "Back to first page"}</Link>}
            <Link href="/contact" className={categorySlug || page > 1 ? secondaryRecoveryLinkClass : recoveryLinkClass}>Suggest a story</Link>
          </ErrorState>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <JournalCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors">
                ← Previous
              </Link>
            )}
            {Array.from({ length: totalPages }).map((_, i) => (
              <Link
                key={i}
                href={buildPageUrl(i + 1)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === i + 1
                    ? "bg-coral-600 text-white"
                    : "border border-gray-200 text-gray-700 hover:bg-white"
                }`}
              >
                {i + 1}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-white transition-colors">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
