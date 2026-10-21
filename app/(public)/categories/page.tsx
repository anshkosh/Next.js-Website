import { publicStartupWhere } from "@/lib/startup-visibility";
import { db } from "@/lib/db";
import CategoryCard from "@/components/category/CategoryCard";
import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

// Counts must reflect founder visibility changes on the next public request.
export const dynamic = "force-dynamic";

export const metadata = seoMetadata({
  title: "Startup Categories — Anshkosh",
  description: "Explore Indian startups by industry on Anshkosh. Discover founder progress, startup evidence, and opportunities to participate in public validation.",
  path: "/categories",
});

export default async function CategoriesPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <div className="page-intro-spacing container mx-auto px-4 max-w-3xl text-center">
        <h1 className="page-title mb-4">Browse by <span className="text-coral-500">Category</span></h1>
        <p className="text-xl text-gray-600 mb-8">Explore Indian startups by industry as the Anshkosh pilot grows. We’re preparing the first category listings alongside our public startup profiles.</p>
        <p className="text-gray-600 mb-8">Visit <Link href="/discover" className="text-coral-600 underline">startup discovery</Link> or learn <Link href="/faq" className="text-coral-600 underline">how founders can participate</Link>.</p>
        <Link href="/startup/new" className="inline-flex min-h-12 items-center rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white hover:bg-coral-700">List your startup</Link>
      </div>
    );
  }
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { startups: { where: publicStartupWhere } },
      },
    },
  });

  return (
    <div className="page-intro-spacing container mx-auto px-4 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="page-title mb-4">
          Browse by <span className="text-coral-500">Category</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Explore startups across different industries and sectors.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={{ name: category.name, slug: category.slug, iconName: category.iconName, _count: category._count }} />
        ))}
      </div>
    </div>
  );
}
