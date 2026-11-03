import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { seoMetadata } from "@/lib/seo";
import { wallStartupWhere, orderWallTiles } from "@/lib/startup-wall";
import PublicPageIntro from "@/components/layout/PublicPageIntro";
export const dynamic = "force-dynamic";
export const metadata = seoMetadata({ title: "Startup Wall — Anshkosh", description: "Discover startups through their logos and creative. Visit a startup profile to learn more.", path: "/startup-wall" });
export default async function StartupWallPage() {
  const now = new Date();
  const placements = process.env.DATABASE_URL ? await db.featuredStartup.findMany({
    where: { startup: wallStartupWhere, OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] },
    select: { sortOrder: true, featuredUntil: true, startup: {
      select: { id: true, name: true, slug: true, logoUrl: true, wallImageUrl: true },
    } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    take: 6,
  }) : [];
  const rows = placements.map(({ startup, sortOrder, featuredUntil }) => ({ ...startup, featuredEntry: { sortOrder, featuredUntil } }));
  const tiles = orderWallTiles(rows, now).filter(row => row.wallImageUrl || row.logoUrl);
  return <div>
    <PublicPageIntro compact title={<>Startup <span className="text-coral-500">Wall</span></>} description="A space for startup logos and creative. Click an image to meet the startup." />
    <section aria-label="Startup Wall" className="mx-auto max-w-7xl px-4 pb-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
        <span>Free during the pilot</span><Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-coral-700 underline">Add your startup to the Wall</Link>
      </div>
      {tiles.length ? <div className="grid auto-rows-[minmax(120px,auto)] grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((startup, index) => {
          const spotlight = index === 0 && startup.featuredEntry?.featuredUntil && startup.featuredEntry.featuredUntil > now;
          return <Link key={startup.id} href={`/startups/${startup.slug}`} aria-label={`Visit ${startup.name}`} className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-white p-3 transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600 ${spotlight ? "col-span-2 row-span-2" : ""}`}>
            <Image src={startup.wallImageUrl || startup.logoUrl!} alt={`${startup.name} ${startup.wallImageUrl ? "creative" : "logo"}`} width={640} height={640} sizes={spotlight ? "(max-width: 640px) 90vw, 40vw" : "(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"} className="h-full w-full object-contain" />
          </Link>;
        })}
      </div> : <p className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">The Wall is ready for its first approved startups.</p>}
    </section>
  </div>;
}
