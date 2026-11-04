import StartupWallGallery from "@/components/startup/StartupWallGallery";
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
      select: { id: true, name: true, slug: true, tagline: true, logoUrl: true, wallImageUrl: true, wallOptIn: true, category: { select: { name: true } } },
    } },
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  }) : [];
  const rows = placements.map(({ startup, sortOrder, featuredUntil }) => ({
    ...startup,
    wallImageUrl: startup.wallOptIn ? startup.wallImageUrl : "",
    featuredEntry: { sortOrder, featuredUntil },
  }));
  const tiles = orderWallTiles(rows, now).filter(row => row.wallImageUrl || row.logoUrl);
  const wallItems = tiles.map(({ category, featuredEntry, ...startup }) => ({
    ...startup,
    category: category.name,
    spotlight: !!featuredEntry?.featuredUntil && featuredEntry.featuredUntil > now,
  }));
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
  return <StartupWallGallery items={wallItems} promoteHref={promoteHref} />;
}
