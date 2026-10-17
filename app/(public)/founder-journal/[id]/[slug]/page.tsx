import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import JournalRichContent from "@/components/journal/JournalRichContent";
import { publicFounderEntry } from "@/lib/founder-journal-queries";
import { founderEntryPath, founderEntrySlug, founderEntryDescription } from "@/lib/founder-journal-seo";
import { absoluteUrl, DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string; slug: string }> };

async function publishedEntry(params: Props["params"]) {
  const { id, slug } = await params;
  const entry = await publicFounderEntry(id);
  if (!entry) notFound();
  if (slug !== founderEntrySlug(entry.title)) permanentRedirect(founderEntryPath(entry));
  return entry;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = await publishedEntry(params);
  const canonical = absoluteUrl(founderEntryPath(entry));
  const description = founderEntryDescription(entry.body, entry.startup.name);
  return {
    title: { absolute: `${entry.title} | ${entry.startup.name} | Anshkosh` }, description,
    alternates: { canonical }, robots: { index: true, follow: true },
    openGraph: {
      type: "article", title: entry.title, description, url: canonical, siteName: "Anshkosh",
      publishedTime: entry.publishedAt?.toISOString(), modifiedTime: entry.updatedAt.toISOString(),
      authors: [entry.startup.founderName], images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE), alt: "Anshkosh founder stories" }],
    },
    twitter: { card: "summary_large_image", title: entry.title, description, images: [absoluteUrl(DEFAULT_SOCIAL_IMAGE)] },
  };
}

export default async function FounderEntryPage({ params }: Props) {
  const entry = await publishedEntry(params);
  const canonical = absoluteUrl(founderEntryPath(entry));
  const startupPath = `/startups/${entry.startup.slug}`;
  let website: string | null = null;
  try { const url = new URL(entry.startup.websiteUrl); if (["http:", "https:"].includes(url.protocol)) website = url.href; } catch { /* No unsafe external link. */ }
  const article = {
    "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${canonical}#article`,
    headline: entry.title, description: founderEntryDescription(entry.body, entry.startup.name),
    mainEntityOfPage: canonical, url: canonical,
    datePublished: entry.publishedAt?.toISOString(), dateModified: entry.updatedAt.toISOString(),
    author: { "@type": "Person", name: entry.startup.founderName, url: absoluteUrl(startupPath) },
    publisher: { "@type": "Organization", name: "Anshkosh", url: absoluteUrl("/") },
    about: { "@type": "Organization", name: entry.startup.name, url: absoluteUrl(startupPath) },
    image: absoluteUrl(DEFAULT_SOCIAL_IMAGE),
  };
  return <div className="min-h-screen bg-gray-50 px-4 py-10 sm:py-16">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article).replace(/</g, "\\u003c") }} />
    <div className="mx-auto max-w-3xl">
      <Link href={`${startupPath}#section-founder-journal`} className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 hover:underline">← {entry.startup.name} · Founder Journal</Link>
      <article className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-coral-700">Founder Journal</p>
        <h1 className="mt-4 break-words font-heading text-3xl font-bold text-gray-900 sm:text-4xl">{entry.title}</h1>
        <p className="mb-8 mt-4 text-sm leading-relaxed text-gray-600">By {entry.startup.founderName} · <Link href={startupPath} className="text-coral-700 underline">{entry.startup.name}</Link>
          {entry.publishedAt && <> · <time dateTime={entry.publishedAt.toISOString()}>{entry.publishedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}</time></>}
        </p>
        <JournalRichContent content={entry.contentJson} fallback={entry.body} />
        {entry.milestone && <p className="mt-8 break-words rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{entry.milestoneDone ? "✓ Milestone complete" : "○ Milestone in progress"}: {entry.milestone}</p>}
        <footer className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-6 text-sm font-semibold">
          <Link href={startupPath} className="inline-flex min-h-11 items-center text-coral-700 hover:underline">Discover {entry.startup.name} →</Link>
          {website && <a href={website} target="_blank" rel="ugc noopener noreferrer" className="inline-flex min-h-11 items-center text-coral-700 hover:underline">Visit the startup website ↗</a>}
        </footer>
      </article>
    </div>
  </div>;
}
