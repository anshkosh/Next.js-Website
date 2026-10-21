// @vitest-environment node
import { expect, it } from "vitest";
import { activitySignals, rankSignals, signalSnapshotQuery } from "../lib/startup-signals";
it("scores all components independently with lifetime caps", () => {
  expect(activitySignals({ founderDays: 1, backers: 1, discussions: 1 })).toBe(7);
  expect(activitySignals({ founderDays: 999, backers: 999, discussions: 999 })).toBe(90);
  expect(activitySignals({ founderDays: -1, backers: 0, discussions: 0 })).toBe(0);
});
it("keeps net votes distinct from the combined score", () => {
  const [entry] = rankSignals([{ id: "fixture", name: "Fixture", featured: false, updateCount: 9, founderDays: 2, backers: 1, discussions: 1, upvoteCount: 1, downvoteCount: 6 }]);
  expect(entry).toMatchObject({ signalCount: -5, activitySignals: 9, leaderboardScore: 4, rank: 1 });
});
it("parameterizes the clock and restricts eligibility at the database boundary", () => {
  const now = new Date("2026-10-18T00:00:00Z");
  const query = signalSnapshotQuery(now);
  expect(query.values).toEqual([now, now, now, now, now]);
  for (const condition of ["s.status = 'LIVE'", 'founder."founderMode" = true', "c.status = 'APPROVED'", "j.visibility = 'PUBLIC'", 'j."approvedAt" IS NOT NULL', 'j."authorId" = s."founderId"', 'LOWER(BTRIM(c."authorEmail")) <> LOWER(BTRIM(founder.email))', 'COUNT(DISTINCT participant.key)', "AT TIME ZONE 'UTC'", 'u."createdAt"::date', 'j."publishedAt"::date', 'f."featuredUntil" IS NULL OR f."featuredUntil" >']) expect(query.text).toContain(condition);
});
