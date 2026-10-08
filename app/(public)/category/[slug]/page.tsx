import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import StartupCard from "@/components/startup/StartupCard";
import { cookies } from "next/headers";
import Link from "next/link";
import CategoryIcon from "@/components/category/CategoryIcon";
import { seoMetadata } from "@/lib/seo";
import ErrorState, { recoveryLinkClass, secondaryRecoveryLinkClass } from "@/components/site/ErrorState";

// Visitor-specific cookies must be read at request time, including for new slugs.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  if (!process.env.DATABASE_URL) notFound();
  const { slug } = await props.params;
  const category = await db.category.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!category) notFound();
  return seoMetadata({
    title: `${category.name} Startups — Anshkosh`,
    description: category.description || `Explore ${category.name} startups on Anshkosh.`,
    path: `/category/${slug}`,
  });
}

export async function generateStaticParams() {
  if (!process.env.DATABASE_URL) return [];
  const categories = await db.category.findMany({ select: { slug: true } });
  return categories.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  if (!process.env.DATABASE_URL) notFound();
  const cookieStore = await cookies();
  const cookieId = cookieStore.get("anshkosh_vid")?.value;

  const category = await db.category.findUnique({
    where: { slug: params.slug },
  });

  if (!category) notFound();

  const startups = await db.startup.findMany({
    where: {
      categoryId: category.id,
      status: "LIVE",
    },
    include: {
      category: true,
      upvotes: cookieId ? { where: { cookieId } } : false,
    },
    orderBy: [
      { upvoteCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  const formattedStartups = startups.map((startup) => ({
    ...startup,
    hasUpvoted: startup.upvotes ? startup.upvotes.length > 0 : false,
  }));

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm mb-8 text-center">
        <div className="mb-4 flex justify-center text-coral-500"><CategoryIcon name={category.iconName} className="h-12 w-12" aria-hidden="true" /></div>
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">{category.description}</p>
        )}
        <p className="text-sm font-medium text-coral-500 bg-coral-50 inline-block px-3 py-1 rounded-full">
          {startups.length} {startups.length === 1 ? 'Startup' : 'Startups'}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {formattedStartups.length > 0 ? (
          formattedStartups.map((startup) => (
            <StartupCard key={startup.id} startup={startup} />
          ))
        ) : (
          <div className="rounded-xl border border-gray-100 bg-white">
            <ErrorState
              compact
              headingLevel={2}
              status="No startups found"
              title="Kosh is first on the scene."
              message={`There aren’t any public startups in ${category.name} yet. Explore other categories, or put yours on the map.`}
              foxComment="First one here. I’m claiming the window seat."
            >
              <Link href="/discover" className={recoveryLinkClass}>Explore startups</Link>
              <Link href="/startup/new" className={secondaryRecoveryLinkClass}>List your startup</Link>
            </ErrorState>
          </div>
        )}
      </div>
    </div>
  );
}
