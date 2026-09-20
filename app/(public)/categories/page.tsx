import { db } from "@/lib/db";
import CategoryCard from "@/components/category/CategoryCard";
import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const revalidate = 21600; // 6 hours

export const metadata = seoMetadata({
  title: "Startup Categories — Anshkosh",
  description: "Browse Indian startups by category on Anshkosh.",
  path: "/categories",
});

export default async function CategoriesPage() {
  if (!process.env.DATABASE_URL) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 font-heading">Browse by <span className="text-coral-500">Category</span></h1>
        <p className="text-xl text-gray-600 mb-8">Category pages will appear as the pilot directory is seeded.</p>
        <Link href="/register" className="inline-flex rounded-lg bg-coral-500 px-5 py-3 font-semibold text-white hover:bg-coral-600">Register as a founder</Link>
      </div>
    );
  }
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { startups: { where: { status: "LIVE" } } },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4 font-heading">
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
