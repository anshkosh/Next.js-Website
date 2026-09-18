import { db } from "@/lib/db";
import CategoryManager from "./CategoryManager";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      _count: {
        select: { startups: true }
      }
    },
    orderBy: {
      sortOrder: "asc"
    }
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading">Categories</h1>
      </div>

      <CategoryManager initialCategories={categories} />
    </div>
  );
}
