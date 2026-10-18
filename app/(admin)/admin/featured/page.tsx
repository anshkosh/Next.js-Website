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
          tagline: true,
        },
      },
    },
    // Temporary entries are placed first; all other entries retain their manual order.
    orderBy: { sortOrder: "asc" },
  });

  const liveStartups = await db.startup.findMany({
    where: { status: "LIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 font-heading">
          Manage Featured Startups
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Add up to 6 live startups to spotlight in the Featured Startups section on Discover.
        </p>
      </div>

      <FeaturedManager
        featuredList={featuredEntries}
        availableStartups={liveStartups}
        latestLiveStartup={liveStartups[0] ?? null}
      />
    </div>
  );
}
