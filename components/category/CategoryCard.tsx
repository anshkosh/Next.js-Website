import Link from "next/link";
import CategoryIcon from "./CategoryIcon";

type CategoryCardProps = {
  category: {
    name: string;
    slug: string;
    iconName?: string | null;
    _count: {
      startups: number;
    };
  };
};

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link href={`/category/${category.slug}`}>
      <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-2xl hover:border-coral-500 hover:shadow-md transition-all duration-200 group text-center h-full">
        <div className="p-3 bg-coral-50 text-coral-500 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-200">
          <CategoryIcon name={category.iconName} className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">{category.name}</h3>
        <p className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
          {category._count.startups} {category._count.startups === 1 ? 'startup' : 'startups'}
        </p>
      </div>
    </Link>
  );
}
