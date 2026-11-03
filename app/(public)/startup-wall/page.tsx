import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { loginHref } from "@/lib/login-return";
import { db } from "@/lib/db";
import { seoMetadata } from "@/lib/seo";
import { wallStartupWhere, orderWallTiles } from "@/lib/startup-wall";
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
  const session = process.env.DATABASE_URL ? await auth.api.getSession({ headers: await headers() }) : null;
  let promoteHref: string | null = loginHref("/startup-wall");
  if (session?.user.banned) promoteHref = null;
  else if (session?.user) {
    const owned = await db.startup.findMany({
      where: { founderId: session.user.id }, select: { id: true, status: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
    const visibleIds = new Set(tiles.map(startup => startup.id));
    const eligible = owned.filter(startup => !visibleIds.has(startup.id));
    const target = eligible.find(startup => startup.status === "LIVE") ?? eligible.find(startup => ["DRAFT", "REJECTED"].includes(startup.status));
    promoteHref = target ? `/startup/${target.id}/edit#startup-wall-settings` : owned.length === 0 ? "/startup/new" : null;
  }
  return <div>
    <section aria-label="Startup Wall" className="mx-auto max-w-7xl px-4 pb-12 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold text-gray-900 sm:text-4xl">Anshkosh Startup Wall</h1>
        {promoteHref && <Link href={promoteHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-coral-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600">Promote your startup</Link>}
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
