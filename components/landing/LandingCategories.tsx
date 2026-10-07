import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

// Match the directory's seed slugs when previewing without a database.
const startingCategories = [
  { name: "AI / ML", slug: "ai-ml" },
  { name: "SaaS / B2B", slug: "saas-b2b" },
  { name: "FoodTech", slug: "foodtech" },
  { name: "HealthTech", slug: "healthtech" },
  { name: "FinTech", slug: "fintech" },
  { name: "Developer tools", slug: "devtools" },
];

export default async function LandingCategories() {
  const categories = process.env.DATABASE_URL
    ? await db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { name: true, slug: true }, take: 8 })
    : startingCategories;
  return (
    <section aria-labelledby="home-categories-title" className="border-b border-gray-200 bg-gray-50 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><h2 id="home-categories-title" className="font-heading text-3xl font-bold tracking-tight text-gray-900">What are you curious about?</h2><p className="mt-2 text-sm leading-relaxed text-gray-600">Find startups working on the things that interest you.</p></div>
          <Link href="/categories" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-coral-700 hover:text-coral-900">Browse all categories <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        <ul className="flex flex-wrap gap-3">{categories.map(category => <li key={category.slug}><Link href={`/discover?category=${encodeURIComponent(category.slug)}`} className="inline-flex min-h-11 items-center gap-3 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-coral-500 hover:bg-coral-50 hover:text-coral-700">{category.name}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></li>)}</ul>
      </div>
    </section>
  );
}
