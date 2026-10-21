import { db } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import JournalCover from "@/components/journal/JournalCover";
import Link from "next/link";
import { Clock, Calendar, ArrowLeft, Tag } from "lucide-react";
import JournalCard from "@/components/landing/JournalCard";
import ArticleShare from "@/components/content/ArticleShare";
import { cache } from "react";
import { DEFAULT_SOCIAL_IMAGE, SITE_URL, absoluteUrl } from "@/lib/seo";
import { calculateReadingTime } from "@/lib/journal-reading-time.mjs";
import { publicJournalHtml, showJournalExcerpt, serializeJsonLd } from "@/lib/journal-html";

const BASE_URL = SITE_URL;
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

const getPost = cache(async (slug: string) => {
  if (!process.env.DATABASE_URL) return null;
  return db.journalPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: { select: { name: true, slug: true } } },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read "${post.title}" on the Anshkosh Journal.`;
  const ogImage = absoluteUrl(post.coverImageUrl || DEFAULT_SOCIAL_IMAGE);
  const canonical = absoluteUrl(post.canonicalUrl || `/journal/${post.slug}`);

  return {
    title: `${title} | Anshkosh Journal`,
    description,
    keywords: post.metaKeywords.length ? post.metaKeywords : undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.authorName],
      siteName: "Anshkosh",
      images: [{ url: ogImage, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function JournalArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  // Fetch related posts (same category, excluding this one, max 3)
  const relatedPosts = post.categoryId
    ? await db.journalPost.findMany({
        where: {
          status: "PUBLISHED",
          categoryId: post.categoryId,
          NOT: { id: post.id },
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
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
      })
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription || post.excerpt || "",
    image: [absoluteUrl(post.coverImageUrl || DEFAULT_SOCIAL_IMAGE)],
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: "Anshkosh",
      url: BASE_URL,
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.canonicalUrl || `/journal/${post.slug}`) },
    keywords: [...post.tags, ...post.metaKeywords].join(", "),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <article className="min-h-screen bg-gray-50/30">
        {/* Cover Hero */}
        {post.coverImageUrl && (
          <JournalCover key={post.coverImageUrl} src={post.coverImageUrl} title={post.title} />
        )}

        {/* Article Container */}
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Article Header */}
          <header className={`${post.coverImageUrl ? "-mt-32 relative z-10 rounded-xl bg-white px-6 pt-8 mb-8 shadow-sm md:px-8" : "pt-12"} pb-8`}>
            <div className="text-gray-900">
              {/* Breadcrumb */}
              <Link
                href="/journal"
                className="inline-flex items-center gap-1.5 text-sm mb-6 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={15} /> Journal
              </Link>

              {/* Category + Featured */}
              <div className="flex items-center gap-3 mb-4">
                {post.category && (
                  <Link
                    href={`/journal?category=${post.category.slug}`}
                    className="bg-coral-600 text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-coral-700 transition-colors"
                  >
                    {post.category.name}
                  </Link>
                )}
                {post.isFeatured && (
                  <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">✦ Featured</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading leading-tight mb-6">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-5 text-sm text-gray-600">
                <span className="font-semibold">{post.authorName}</span>
                {post.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {post.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {calculateReadingTime(post.contentHtml)} min read
                </span>
                {post.updatedAt && post.publishedAt && post.updatedAt.getTime() > post.publishedAt.getTime() && (
                  <span>Updated {post.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                )}
                <ArticleShare title={post.title} url={`${BASE_URL}/journal/${post.slug}`} />
              </div>
            </div>
          </header>

          {/* Excerpt (if cover image present, show below header) */}
          {showJournalExcerpt(post.excerpt, post.contentHtml) && (
            <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-coral-500 pl-5 mb-10 italic">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="journal-content max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: publicJournalHtml(post.contentHtml || "") }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-12 pb-8 border-b border-gray-200">
              <Tag size={16} className="text-gray-500" />
              {post.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author card */}
          <div className="bg-gray-50 rounded-xl p-6 mb-16 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-coral-600 flex items-center justify-center text-white font-bold text-xl font-heading">
              {post.authorName.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{post.authorName}</p>
              <p className="text-sm text-gray-500">Written for the Anshkosh Journal</p>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-gray-200 bg-white py-16">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-2xl font-bold font-heading text-gray-900 mb-8">More from {post.category?.name ?? "Journal"}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map(related => (
                  <JournalCard key={related.id} post={related} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </>
  );
}
