import { Prisma } from "@prisma/client";

export type SignalActivity = {
  founderDays: number;
  backers: number;
  discussions: number;
};

// Lifetime participation, not an investment or verified-traction score.
export function activitySignals(activity: SignalActivity) {
  const count = (value: number, cap: number) => Math.min(cap, Math.max(0, Math.floor(value)));
  return 2 * count(activity.founderDays, 10)
    + 2 * count(activity.backers, 20)
    + 3 * count(activity.discussions, 10);
}

export type SignalSnapshot = SignalActivity & {
  id: string;
  name: string;
  upvoteCount: number;
  downvoteCount: number;
  updateCount: number;
  featured: boolean;
};

// Only aggregate counts leave PostgreSQL: commenter/founder email addresses
// never enter the public projection. Count persisted records, not stale counters.
export function signalSnapshotQuery(now = new Date()) {
  return Prisma.sql`
    SELECT s.id, s.name,
      (SELECT COUNT(*)::int FROM "Upvote" v WHERE v."startupId" = s.id) AS "upvoteCount",
      (SELECT COUNT(*)::int FROM "Downvote" v WHERE v."startupId" = s.id) AS "downvoteCount",
      (SELECT COUNT(*)::int FROM "StartupUpdate" u WHERE u."startupId" = s.id AND u.status = 'APPROVED') AS "updateCount",
      EXISTS (
        SELECT 1 FROM "FeaturedStartup" f WHERE f."startupId" = s.id
          AND (f."featuredUntil" IS NULL OR f."featuredUntil" > ${now})
      ) AS featured,
      (SELECT COUNT(DISTINCT activity.day)::int FROM (
        SELECT u."createdAt"::date AS day FROM "StartupUpdate" u
          WHERE u."startupId" = s.id AND u.status = 'APPROVED' AND NULLIF(BTRIM(u.body), '') IS NOT NULL
            AND u."createdAt" <= (${now}::timestamptz AT TIME ZONE 'UTC')
        UNION
        SELECT j."publishedAt"::date AS day FROM "FounderJournalEntry" j
          WHERE j."startupId" = s.id AND j."authorId" = s."founderId"
            AND j.visibility = 'PUBLIC' AND j."approvedAt" IS NOT NULL
            AND NULLIF(BTRIM(j.body), '') IS NOT NULL
            AND j."publishedAt" <= (${now}::timestamptz AT TIME ZONE 'UTC')
      ) activity) AS "founderDays",
      COALESCE(comments.backers, 0)::int AS backers,
      COALESCE(comments.discussions, 0)::int AS discussions
    FROM "Startup" s JOIN "User" founder ON founder.id = s."founderId"
    LEFT JOIN LATERAL (
      SELECT COUNT(DISTINCT participant.key) AS backers,
        COUNT(DISTINCT participant.key) FILTER (
          WHERE NULLIF(BTRIM(c.reply), '') IS NOT NULL AND c."repliedAt" <= (${now}::timestamptz AT TIME ZONE 'UTC')
        ) AS discussions
      FROM "Comment" c
      CROSS JOIN LATERAL (SELECT CASE
        WHEN NULLIF(BTRIM(c."authorEmail"), '') IS NOT NULL THEN 'email:' || LOWER(BTRIM(c."authorEmail"))
        WHEN NULLIF(BTRIM(c."authorName"), '') IS NOT NULL
          AND LOWER(BTRIM(c."authorName")) <> LOWER(BTRIM(founder.name))
          THEN 'legacy-name:' || LOWER(BTRIM(c."authorName"))
        END AS key) participant
      WHERE c."startupId" = s.id AND c.status = 'APPROVED'
        AND c."createdAt" <= (${now}::timestamptz AT TIME ZONE 'UTC') AND NULLIF(BTRIM(c.body), '') IS NOT NULL
        AND LOWER(BTRIM(c."authorEmail")) <> LOWER(BTRIM(founder.email))
    ) comments ON true
    WHERE s.status = 'LIVE' AND founder."founderMode" = true
  `;
}

export function rankSignals(rows: SignalSnapshot[]) {
  const ranked = rows.map(row => ({
    id: row.id, name: row.name, featured: row.featured,
    upvoteCount: row.upvoteCount, downvoteCount: row.downvoteCount, updateCount: row.updateCount,
    founderDays: row.founderDays, backers: row.backers, discussions: row.discussions,
    signalCount: row.upvoteCount - row.downvoteCount,
    activitySignals: activitySignals(row),
    leaderboardScore: row.upvoteCount - row.downvoteCount + activitySignals(row),
    rank: 0,
  })).sort((a, b) => b.leaderboardScore - a.leaderboardScore
    || a.name.localeCompare(b.name, "en") || a.id.localeCompare(b.id, "en"));
  for (let i = 0; i < ranked.length; i++) {
    ranked[i].rank = i > 0 && ranked[i].leaderboardScore === ranked[i - 1].leaderboardScore
      ? ranked[i - 1].rank : i === 0 ? 1 : ranked[i - 1].rank + 1;
  }
  return ranked;
}
