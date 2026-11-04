import PublicPageIntro from "@/components/layout/PublicPageIntro";
import styles from "./page.module.css";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { loginHref } from "@/lib/login-return";
import { db } from "@/lib/db";
import { seoMetadata } from "@/lib/seo";
import { visibleWallStartupWhere, orderWallTiles } from "@/lib/startup-wall";
export const dynamic = "force-dynamic";
export const metadata = seoMetadata({ title: "Startup Wall — Anshkosh", description: "Discover startups through their logos and creative. Visit a startup profile to learn more.", path: "/startup-wall" });
export default async function StartupWallPage() {
  const now = new Date();
  const placements = process.env.DATABASE_URL ? await db.featuredStartup.findMany({
    where: { startup: visibleWallStartupWhere, OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] },
    select: { sortOrder: true, featuredUntil: true, startup: {
      select: { id: true, name: true, slug: true, logoUrl: true, wallImageUrl: true, wallOptIn: true },
    } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  }) : [];
  const rows = placements.map(({ startup, sortOrder, featuredUntil }) => ({
    ...startup,
    wallImageUrl: startup.wallOptIn ? startup.wallImageUrl : "",
    featuredEntry: { sortOrder, featuredUntil },
  }));
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
    <PublicPageIntro compact title={<>Anshkosh Startup <span className="text-coral-500">Wall</span></>} />
    <section aria-label="Startup Wall" className="mx-auto max-w-7xl px-4 pb-12 pt-2">
      <div className="mb-6 flex justify-end">
        {promoteHref && <Link href={promoteHref} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-coral-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600">Promote your startup</Link>}
      </div>
      {tiles.length ? <div className={styles.grid} data-count={tiles.length > 6 ? "many" : tiles.length}>
        {tiles.map((startup, index) => {
          return <Link key={startup.id} href={`/startups/${startup.slug}`} aria-label={`Visit ${startup.name}`} className={styles.tile}>
            <span className={styles.image}>
              <Image src={startup.wallImageUrl || startup.logoUrl!} alt={`${startup.name} ${startup.wallImageUrl ? "creative" : "logo"}`} fill sizes={index === 0 || tiles.length < 3 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"} className={startup.wallImageUrl ? styles.creative : styles.logo} />
            </span>
            <span className={styles.name}>{startup.name}</span>
          </Link>;
        })}
      </div> : <p className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">The Wall is ready for its first approved startups.</p>}
    </section>
  </div>;
}
