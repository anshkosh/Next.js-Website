import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { publicStartupWhere } from "@/lib/startup-visibility";
import { PUBLIC_UPDATES_PAGE_SIZE } from "@/lib/public-updates";

// Primitive arguments allow metadata and page rendering to share one read.
// React.cache is request-scoped; cookies and unpublished data are never shared.
export const publicStartup = cache(async (slug: string, updatesPage: number) => {
  const cookieId = (await cookies()).get("anshkosh_vid")?.value;
  return db.startup.findUnique({
    where: { slug, ...publicStartupWhere },
    include: {
      category: true,
      upvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
      downvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
      founders: { orderBy: { sortOrder: "asc" } },
      updates: {
        where: { status: "APPROVED" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (updatesPage - 1) * PUBLIC_UPDATES_PAGE_SIZE, take: PUBLIC_UPDATES_PAGE_SIZE,
        select: { id: true, title: true, body: true, imageUrl: true, createdAt: true },
      },
      _count: { select: { updates: { where: { status: "APPROVED" } } } },
      betaTesterProgram: { select: { id: true, enabled: true, description: true, reward: true } },
    },
  });
});
