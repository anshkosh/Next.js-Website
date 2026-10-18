import Link from "next/link";
import { Search, Rocket, BookOpen, Layers3 } from "lucide-react";
import { startupSearchWhere } from "@/lib/startup-search";
import { db } from "@/lib/db";
import { seoMetadata } from "@/lib/seo";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

export const metadata = {
  ...seoMetadata({ title: "Search | Anshkosh", description: "Search Anshkosh startups, public founder names, stories, and categories.", path: "/search" }),
  robots: { index: false, follow: true },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

function resultText(value: string | null | undefined, limit = 150) {
  if (!value) return "";
  return value.length > limit ? `${value.slice(0, limit).trim()}…` : value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (await searchParams).q?.trim() ?? "";

  if (!query || !process.env.DATABASE_URL) {
    return <SearchShell query={query} startupResults={[]} journalResults={[]} categoryResults={[]} />;
  }

  const [startupResults, journalResults, categoryResults] = await Promise.all([
    db.startup.findMany({
      where: startupSearchWhere(query),
      take: 12,
      orderBy: { signalCount: "desc" },
      select: { id: true, slug: true, name: true, tagline: true, logoUrl: true, upvoteCount: true, downvoteCount: true, signalCount: true, founders: { select: { name: true }, orderBy: { sortOrder: "asc" } }, category: { select: { name: true } } },
    }),
    db.journalPost.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { contentHtml: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 12,
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, excerpt: true, authorName: true, updatedAt: true },
    }),
    db.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 8,
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, name: true, description: true },
    }),
  ]);

  return <SearchShell query={query} startupResults={startupResults} journalResults={journalResults} categoryResults={categoryResults} />;
}

function SearchShell({ query, startupResults, journalResults, categoryResults }: {
  query: string;
  startupResults: Array<{ id: string; slug: string; name: string; tagline: string; logoUrl: string | null; upvoteCount: number; downvoteCount: number; signalCount: number; founders: { name: string }[]; category: { name: string } }>;
  journalResults: Array<{ id: string; slug: string; title: string; excerpt: string | null; authorName: string; updatedAt: Date }>;
  categoryResults: Array<{ id: string; slug: string; name: string; description: string | null }>;
}) {
  const total = startupResults.length + journalResults.length + categoryResults.length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <section className="page-intro-spacing border-b border-gray-200 bg-white">
        <div className="container mx-auto max-w-4xl px-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-coral-600">Anshkosh search</p>
          <h1 className="page-title">Find a startup, founder, or story</h1>
          <form action="/search" className="mt-8 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="search-page-query" className="sr-only">Search Anshkosh</label>
            <div className="relative flex-1">
              <Search size={19} className="pointer-events-none absolute left-4 top-3.5 text-gray-400" aria-hidden="true" />
              <input id="search-page-query" name="q" defaultValue={query} placeholder="Search startups, founders, stories, or categories" className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-gray-900 outline-none transition-colors focus:border-coral-500" />
            </div>
            <button type="submit" className="min-h-12 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-coral-700 sm:shrink-0">Search</button>
          </form>
        </div>
      </section>

      <div className="container mx-auto max-w-4xl px-4 py-12">
        {!query ? <p className="text-gray-500">Try a founder, category, or topic.</p> : total === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white">
            <ErrorState
              compact
              headingLevel={2}
              status="No results found"
              title="This scent went cold."
              message={`We couldn’t find any startups, stories, or categories for “${query}”. Try a shorter phrase, or browse something new.`}
              foxComment="I found a crumb. I assume that’s not what you meant."
            >
              <Link href="/discover" className={recoveryLinkClass}>Explore startups</Link>
              <Link href="/journal" className={secondaryRecoveryLinkClass}>Browse the Journal</Link>
            </ErrorState>
          </div>
        ) : <div className="space-y-10">
          <p className="text-sm text-gray-500">{total} result{total === 1 ? "" : "s"} for <span className="font-semibold text-gray-700">“{query}”</span></p>

          {startupResults.length > 0 && <ResultGroup icon={<Rocket size={19} />} title="Startups"><div className="grid gap-3 sm:grid-cols-2">{startupResults.map((startup) => <Link key={startup.id} href={`/startups/${startup.slug}`} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-coral-300 hover:shadow-md"><div className="flex items-start justify-between gap-4"><div><h3 className="font-heading text-xl font-bold text-gray-900">{startup.name}</h3><p className="mt-1 text-sm text-gray-500">{startup.tagline}</p></div><span className="text-xs font-medium text-coral-600">{startup.category.name}</span></div>{startup.founders.length > 0 && <p className="mt-3 text-xs text-gray-600">Founders: {startup.founders.map(founder => founder.name).join(", ")}</p>}<p className="mt-4 text-xs text-gray-500">{startup.signalCount} net vote{Math.abs(startup.signalCount) === 1 ? "" : "s"} · {startup.upvoteCount} upvotes − {startup.downvoteCount} downvotes</p></Link>)}</div></ResultGroup>}

          {journalResults.length > 0 && <ResultGroup icon={<BookOpen size={19} />} title="Journal"><div className="space-y-3">{journalResults.map((post) => <Link key={post.id} href={`/journal/${post.slug}`} className="block rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-coral-300 hover:shadow-md"><h3 className="font-heading text-xl font-bold text-gray-900">{post.title}</h3><p className="mt-1 text-sm text-gray-500">{resultText(post.excerpt) || `By ${post.authorName}`}</p><p className="mt-3 text-xs text-gray-400">Updated {post.updatedAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p></Link>)}</div></ResultGroup>}

          {categoryResults.length > 0 && <ResultGroup icon={<Layers3 size={19} />} title="Categories"><div className="grid gap-3 sm:grid-cols-2">{categoryResults.map((category) => <Link key={category.id} href={`/category/${category.slug}`} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-coral-300 hover:shadow-md"><h3 className="font-heading text-xl font-bold text-gray-900">{category.name}</h3><p className="mt-1 text-sm text-gray-500">{resultText(category.description, 110) || "Explore startups in this category."}</p></Link>)}</div></ResultGroup>}
        </div>}
      </div>
    </div>
  );
}

function ResultGroup({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section><div className="mb-4 flex items-center gap-2 text-coral-600"><span className="rounded-lg bg-coral-50 p-2">{icon}</span><h2 className="font-heading text-2xl font-bold text-gray-900">{title}</h2></div>{children}</section>;
}
