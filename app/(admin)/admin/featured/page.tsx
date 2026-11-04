import { adminWallStartupWhere, wallStartupWhere } from "@/lib/startup-wall";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FeaturedManager from "./FeaturedManager";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    redirect("/login");
  }

  const now = new Date();
  const featuredEntries = await db.featuredStartup.findMany({
    where: { OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }] },
    include: {
      startup: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          wallImageUrl: true,
          wallOptIn: true,
          wallAdminPlacement: true,
          tagline: true,
        },
      },
    },
    // Temporary entries are placed first; all other entries retain their manual order.
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const liveStartups = await db.startup.findMany({
    where: wallStartupWhere,
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      createdAt: true,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
  const publicCandidates = session.user.role === "admin" ? await db.startup.findMany({
    where: adminWallStartupWhere,
    select: { id: true, name: true },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  }) : [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 font-heading">
          Manage Startup Wall
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage placements for live startups. Admin placements use the published profile logo. Founders can withdraw either kind of placement.
        </p>
      </div>

      <FeaturedManager
        featuredList={featuredEntries}
        availableStartups={[...liveStartups, ...publicCandidates.map(startup => ({ ...startup, adminPlacement: true }))]}
        latestLiveStartup={liveStartups[0] ?? null}
      />
    </div>
  );
}
