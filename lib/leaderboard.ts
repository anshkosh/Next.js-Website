import { db } from "@/lib/db";
import { cache } from "react";
import { publicStartupWhere } from "@/lib/startup-visibility";
import { activitySignals, rankSignals, type SignalActivity } from "@/lib/startup-signals";
import { publicSignals } from "@/lib/public-signals";

export const LEADERBOARD_PAGE_SIZE = 20;

export type LeaderboardEntry = SignalActivity & {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  category: { name: string };
  upvoteCount: number;
  downvoteCount: number;
  signalCount: number;
  activitySignals: number;
  leaderboardScore: number;
  updateCount: number;
  rank: number;
  hasUpvoted: boolean;
  hasDownvoted: boolean;
};

export function leaderboardPageNumber(value?: string | string[]) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : 1;
}

export async function getLeaderboard(requestedPage = 1, cookieId?: string, featuredOnly = false, pageSize = LEADERBOARD_PAGE_SIZE) {
  if (!process.env.DATABASE_URL) {
    return { entries: [] as LeaderboardEntry[], totalCount: 0, page: 1, totalPages: 1 };
  }

  // Aggregate only counts/IDs globally; load profile fields for the current page.
  // RepeatableRead keeps activity, ranks, and visitor votes in one snapshot.
  return db.$transaction(async (tx) => {
    const ranked = rankSignals(await publicSignals(tx));
    const eligible = featuredOnly ? ranked.filter(row => row.featured) : ranked;
    const totalCount = eligible.length;
    const limit = Number.isSafeInteger(pageSize) && pageSize > 0 ? Math.min(pageSize, LEADERBOARD_PAGE_SIZE) : LEADERBOARD_PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;
    if (!totalCount) return { entries: [] as LeaderboardEntry[], totalCount, page, totalPages };
    const selected = featuredOnly ? eligible.slice(0, 6)
      : eligible.slice((page - 1) * limit, page * limit);

    const startups = await tx.startup.findMany({
      where: { ...publicStartupWhere, id: { in: selected.map(row => row.id) } },
      select: {
        id: true, slug: true, name: true, tagline: true, logoUrl: true,
        upvoteCount: true, downvoteCount: true, signalCount: true, updateCount: true,
        category: { select: { name: true } },
        upvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
        downvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
      },
    });
    const byId = new Map(startups.map(startup => [startup.id, startup]));
    const entries: LeaderboardEntry[] = selected.map(({ featured: _featured, ...signals }) => {
      void _featured;
      const { upvotes, downvotes, slug, tagline, logoUrl, category } = byId.get(signals.id)!;
      return { slug, tagline, logoUrl, category, ...signals,
        hasUpvoted: Boolean(upvotes?.length), hasDownvoted: Boolean(downvotes?.length) };
    });
    return { entries, totalCount, page, totalPages };
  }, { isolationLevel: "RepeatableRead" });
}

// Discover's grid and featured carousel share one request-scoped read. Only
// aggregate public fields enter the shared cache; visitor votes are read above.
const activitySnapshot = cache(() => db.$transaction(
  tx => publicSignals(tx), { isolationLevel: "RepeatableRead" },
));

// Activity points for cards and profiles, so every surface shows the same signal
// total as the leaderboard. Startups outside the ranking get no entry.
export async function getActivitySignals(ids: string[]) {
  const wanted = new Set(ids);
  if (!process.env.DATABASE_URL || wanted.size === 0) return new Map<string, number>();
  const rows = await activitySnapshot();
  return new Map(rows.filter(row => wanted.has(row.id)).map(row => [row.id, activitySignals(row)]));
}

export async function withActivitySignals<T extends { id: string }>(startups: T[]) {
  const signals = await getActivitySignals(startups.map(startup => startup.id));
  return startups.map(startup => ({ ...startup, activitySignals: signals.get(startup.id) }));
}
