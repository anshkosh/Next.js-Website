"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import CategoryIcon from "./CategoryIcon";

type Category = {
  id: string;
  name: string;
  slug: string;
  iconName?: string | null;
};

export default function CategoryPills({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  return (
    <div className="relative w-full overflow-hidden">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 px-1 snap-x scrollbar-hide">
        <Link 
          href="/discover"
          scroll={false}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors snap-start ${
            activeCategory === "all" 
              ? "bg-coral-600 text-white shadow-md" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/discover?category=${cat.slug}`}
            scroll={false}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors snap-start flex items-center gap-1.5 ${
              activeCategory === cat.slug 
                ? "bg-coral-600 text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <CategoryIcon name={cat.iconName} className="w-4 h-4" />
            {cat.name}
          </Link>
        ))}
      </div>
      <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
}
