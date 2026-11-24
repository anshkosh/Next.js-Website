import Link from "next/link";
import { db } from "@/lib/db";
import { publicStartupWhere } from "@/lib/startup-visibility";

const PROFILE_LIMIT = 3;
const profileLinkSelect = { slug: true, name: true, tagline: true } as const;
const articleLinkSelect = { slug: true, title: true } as const;
const newestFirst = [{ createdAt: "desc" }, { slug: "asc" }] as const;
const articleOrder = [{ publishedAt: "desc" }, { slug: "asc" }] as const;

async function relatedArticle(startupSlug: string, categorySlug: string, city?: string) {
  const citySlug = city?.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const startupStory = await db.journalPost.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [{ slug: startupSlug }, { slug: { startsWith: `${startupSlug}-` } }, { tags: { has: startupSlug } }],
    },
    select: articleLinkSelect,
    orderBy: [...articleOrder],
  });

  return startupStory ?? db.journalPost.findFirst({
    where: {
      status: "PUBLISHED",
      OR: [
        { category: { slug: categorySlug } },
        { tags: { has: categorySlug } },
        ...(citySlug ? [{ slug: { startsWith: `${citySlug}-startup-ecosystem-` } }] : []),
      ],
    },
    select: articleLinkSelect,
    orderBy: [...articleOrder],
  });
}

function ProfileLinks({ profiles }: { profiles: { slug: string; name: string; tagline: string }[] }) {
  return (
    <ul className="divide-y divide-gray-100">
      {profiles.map(({ slug, name, tagline }) => (
        <li key={slug} className="py-3">
          <Link href={`/startups/${slug}`} className="font-semibold text-coral-600 underline hover:text-coral-700">
            {name}
          </Link>
          {tagline && <p className="mt-1 text-sm text-gray-600">{tagline}</p>}
        </li>
      ))}
    </ul>
  );
}

export default async function RelatedStartupLinks({
  startupId,
  startupSlug,
  categoryId,
  categorySlug,
  city,
}: {
  startupId: string;
  startupSlug: string;
  categoryId: string;
  categorySlug: string;
  city?: string;
}) {
  const [related, article] = await Promise.all([
    db.startup.findMany({
      where: { ...publicStartupWhere, categoryId, id: { not: startupId } },
      select: profileLinkSelect,
      orderBy: [...newestFirst],
      take: PROFILE_LIMIT,
    }),
    relatedArticle(startupSlug, categorySlug, city),
  ]);

  const more = related.length < PROFILE_LIMIT
    ? await db.startup.findMany({
        where: { ...publicStartupWhere, categoryId: { not: categoryId } },
        select: profileLinkSelect,
        orderBy: [...newestFirst],
        take: PROFILE_LIMIT - related.length,
      })
    : [];

  return (
    <section aria-labelledby="keep-exploring" className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 id="keep-exploring" className="mb-4 font-heading text-2xl font-bold text-gray-900">Keep exploring</h2>
      {related.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">Related startups</h3>
          <ProfileLinks profiles={related} />
        </div>
      )}
      {more.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">More startups to discover</h3>
          <ProfileLinks profiles={more} />
        </div>
      )}
      {article && (
        <div className="mb-4">
          <h3 className="mb-2 font-semibold text-gray-900">From the Anshkosh Journal</h3>
          <Link href={`/journal/${article.slug}`} className="text-coral-600 underline hover:text-coral-700">{article.title}</Link>
        </div>
      )}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/discover" className="text-sm font-semibold text-coral-600 underline hover:text-coral-700">Browse all startups</Link>
        <Link href="/journal" className="text-sm font-semibold text-coral-600 underline hover:text-coral-700">Browse the Journal</Link>
      </div>
    </section>
  );
}
