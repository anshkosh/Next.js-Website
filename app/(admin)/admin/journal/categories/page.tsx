import { db } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import JournalCategoryManager from "./JournalCategoryManager";
import { requireStaffPage } from "@/lib/staff-session";

export const metadata = { title: "Journal Categories — Admin" };

export default async function JournalCategoriesPage() {
  await requireStaffPage({ adminOnly: true });

  const categories = await db.journalCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/journal" className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold font-heading">Journal Categories</h1>
      </div>

      <JournalCategoryManager initialCategories={categories.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description ?? "",
        sortOrder: c.sortOrder,
        postCount: c._count.posts,
      }))} />
    </div>
  );
}
