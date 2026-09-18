import { db } from "@/lib/db";
import CategoryCard from "@/components/category/CategoryCard";

export const revalidate = 21600; // 6 hours

export default async function CategoriesPage() {
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
          <CategoryCard key={category.id} category={category as any} />
        ))}
      </div>
    </div>
  );
}
