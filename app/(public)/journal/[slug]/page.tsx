import { db } from "@/lib/db";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, ArrowLeft, Tag } from "lucide-react";
import JournalCard from "@/components/landing/JournalCard";
import CopyButton from "@/components/content/CopyButton";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://anshkosh.com";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  return db.journalPost.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: { select: { name: true, slug: true } } },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Post Not Found | Anshkosh" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || `Read "${post.title}" on the Anshkosh Journal.`;
  const ogImage = post.coverImageUrl || `${BASE_URL}/og-default.png`;
  const canonical = post.canonicalUrl || `${BASE_URL}/journal/${post.slug}`;

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
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
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
          readingTimeMinutes: true,
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
    image: post.coverImageUrl ? [post.coverImageUrl] : [],
    author: { "@type": "Person", name: post.authorName },
    publisher: {
      "@type": "Organization",
      name: "Anshkosh",
      url: BASE_URL,
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/journal/${post.slug}` },
    keywords: [...post.tags, ...post.metaKeywords].join(", "),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-h-screen bg-gray-50/30">
        {/* Cover Hero */}
        {post.coverImageUrl && (
          <div className="relative h-[420px] md:h-[520px] w-full bg-gray-900">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover opacity-70"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
          </div>
        )}

        {/* Article Container */}
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Article Header */}
          <div className={`${post.coverImageUrl ? "-mt-32 relative z-10" : "pt-12"} pb-8`}>
            <div className={`${post.coverImageUrl ? "text-white" : "text-gray-900"}`}>
              {/* Breadcrumb */}
              <Link
                href="/journal"
                className={`inline-flex items-center gap-1.5 text-sm mb-6 opacity-70 hover:opacity-100 transition-opacity ${post.coverImageUrl ? "text-white" : "text-gray-500"}`}
              >
                <ArrowLeft size={15} /> Journal
              </Link>

              {/* Category + Featured */}
              <div className="flex items-center gap-3 mb-4">
                {post.category && (
                  <Link
                    href={`/journal?category=${post.category.slug}`}
                    className="bg-coral-500 text-white text-xs font-bold px-3 py-1 rounded-full hover:bg-coral-600 transition-colors"
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
              <div className={`flex flex-wrap items-center gap-5 text-sm ${post.coverImageUrl ? "text-white/80" : "text-gray-500"}`}>
                <span className="font-semibold">{post.authorName}</span>
                {post.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {post.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {post.readingTimeMinutes} min read
                </span>
                {post.updatedAt && post.publishedAt && post.updatedAt.getTime() > post.publishedAt.getTime() && (
                  <span>Updated {post.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                )}
                <CopyButton value={`${BASE_URL}/journal/${post.slug}`} label="Copy article link" />
              </div>
            </div>
          </div>

          {/* Excerpt (if cover image present, show below header) */}
          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-coral-500 pl-5 mb-10 italic">
              {post.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="journal-content max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-12 pb-8 border-b border-gray-200">
              <Tag size={16} className="text-gray-400" />
              {post.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Author card */}
          <div className="bg-gray-50 rounded-xl p-6 mb-16 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-coral-500 flex items-center justify-center text-white font-bold text-xl font-heading">
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
