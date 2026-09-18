import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import StartupCard from "@/components/startup/StartupCard";
import { cookies } from "next/headers";

export const revalidate = 60;

export async function generateStaticParams() {
  const categories = await db.category.findMany({ select: { slug: true } });
  return categories.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
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
        <div className="text-5xl mb-4">{category.iconName}</div>
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
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-500">No startups found in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
