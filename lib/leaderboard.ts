import { db } from "@/lib/db";

export const LEADERBOARD_PAGE_SIZE = 20;

export type LeaderboardEntry = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  category: { name: string };
  upvoteCount: number;
  downvoteCount: number;
  signalCount: number;
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

export async function getLeaderboard(requestedPage = 1, cookieId?: string) {
  if (!process.env.DATABASE_URL) {
    return { entries: [] as LeaderboardEntry[], totalCount: 0, page: 1, totalPages: 1 };
  }

  // Keep the global ranks and paginated rows in the same voting snapshot.
  return db.$transaction(async (tx) => {
    const groups = await tx.startup.groupBy({
      by: ["signalCount"],
      where: { status: "LIVE" },
      _count: { _all: true },
      orderBy: { signalCount: "desc" },
    });
    const rankByVotes = new Map<number, number>();
    let totalCount = 0;
    for (const group of groups) {
      rankByVotes.set(group.signalCount, totalCount + 1);
      totalCount += group._count._all;
    }
    const totalPages = Math.max(1, Math.ceil(totalCount / LEADERBOARD_PAGE_SIZE));
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1;
    if (!totalCount) return { entries: [] as LeaderboardEntry[], totalCount, page, totalPages };

    const startups = await tx.startup.findMany({
      where: { status: "LIVE" },
      select: {
        id: true, slug: true, name: true, tagline: true, logoUrl: true,
        upvoteCount: true, downvoteCount: true, signalCount: true, updateCount: true,
        category: { select: { name: true } },
        upvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
        downvotes: cookieId ? { where: { cookieId }, select: { id: true } } : false,
      },
      orderBy: [{ signalCount: "desc" }, { name: "asc" }, { id: "asc" }],
      skip: (page - 1) * LEADERBOARD_PAGE_SIZE,
      take: LEADERBOARD_PAGE_SIZE,
    });
    const entries: LeaderboardEntry[] = startups.map(({ upvotes, downvotes, ...startup }) => ({
      ...startup,
      rank: rankByVotes.get(startup.signalCount)!,
      hasUpvoted: Boolean(upvotes?.length),
      hasDownvoted: Boolean(downvotes?.length),
    }));
    return { entries, totalCount, page, totalPages };
  }, { isolationLevel: "RepeatableRead" });
}
