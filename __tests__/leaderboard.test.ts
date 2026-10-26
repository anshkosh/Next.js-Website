// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ snapshot: vi.fn(), rows: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mock.transaction } }));
vi.mock("@/lib/public-signals", () => ({ publicSignals: async (tx: { $queryRaw: () => Promise<unknown> }) => tx.$queryRaw() }));
import { getLeaderboard, leaderboardPageNumber } from "../lib/leaderboard";
const row = (id: string, votes: number, featured = true) => ({
  id, slug: id, name: id, tagline: "Test fixture", logoUrl: null,
  category: { name: "Technology" }, upvoteCount: Math.max(votes, 0), downvoteCount: Math.max(-votes, 0),
  signalCount: votes, downvotes: [], updateCount: 0, upvotes: [],
  founderDays: 0, backers: 0, discussions: 0, featured,
});
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/fixture");
  mock.transaction.mockImplementation(async callback => callback({ $queryRaw: mock.snapshot, startup: { findMany: mock.rows } }));
  mock.rows.mockImplementation(async ({ where }) => where.id.in.map((id: string) => row(id, 999)));
});
afterEach(() => vi.unstubAllEnvs());
it("does not fabricate rankings when the database is missing", async () => {
  vi.stubEnv("DATABASE_URL", "");
  expect(await getLeaderboard()).toEqual({ entries: [], totalCount: 0, page: 1, totalPages: 1 });
  expect(mock.transaction).not.toHaveBeenCalled();
});
it("uses dense global ranks before pagination, sharing ties across page boundaries", async () => {
  mock.snapshot.mockResolvedValue([
    row("first", 100), row("second-a", 84), row("second-b", 84),
    ...Array.from({ length: 18 }, (_, i) => row(`tied-${String(i).padStart(2, "0")}`, 32)), row("zero-a", 0), row("zero-b", 0),
  ]);
  const result = await getLeaderboard(2);
  expect(result.entries.map(entry => entry.rank)).toEqual([3, 4, 4]);
  expect(result).toMatchObject({ totalCount: 23, totalPages: 2, page: 2 });
  expect(mock.rows.mock.calls[0][0].where).toEqual({ status: "LIVE", founder: { founderMode: true }, id: { in: ["tied-17", "zero-a", "zero-b"] } });
  expect(mock.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
});
it("continues with the next place after a tied rank", async () => {
  mock.snapshot.mockResolvedValue([row("first", 12), row("second-a", 10), row("second-b", 10), row("farmgate", 9), row("marginmitra", 8)]);
  expect((await getLeaderboard()).entries.map(entry => [entry.id, entry.rank])).toEqual([
    ["first", 1], ["second-a", 2], ["second-b", 2], ["farmgate", 3], ["marginmitra", 4],
  ]);
});
it("uses aggregate counts, not stale counters, and returns no private vote records", async () => {
  mock.snapshot.mockResolvedValue([{ ...row("active", 4), founderDays: 2, backers: 3, discussions: 1 }, row("passive", 10)]);
  mock.rows.mockResolvedValue([row("passive", 999), { ...row("active", 999), upvotes: [{ id: "private-vote" }] }]);
  const { entries } = await getLeaderboard(1, "visitor-cookie");
  expect(entries.map(entry => [entry.id, entry.leaderboardScore, entry.rank])).toEqual([["active", 17, 1], ["passive", 10, 2]]);
  expect(entries[0]).toMatchObject({ upvoteCount: 4, signalCount: 4, activitySignals: 13, hasUpvoted: true });
  for (const field of ["upvotes", "downvotes", "featured", "authorEmail"]) expect(entries[0]).not.toHaveProperty(field);
  expect(mock.rows.mock.calls[0][0].select.upvotes).toEqual({ where: { cookieId: "visitor-cookie" }, select: { id: true } });
  expect(mock.rows.mock.calls[0][0].select.downvotes).toEqual({ where: { cookieId: "visitor-cookie" }, select: { id: true } });
});
it("uses the same score and global rank for curated homepage entries", async () => {
  mock.snapshot.mockResolvedValue([row("not-featured", 20, false), row("featured", 8), row("tied-featured", 8)]);
  expect((await getLeaderboard(1, undefined, true)).entries.map(entry => [entry.id, entry.rank])).toEqual([["featured", 2], ["tied-featured", 2]]);
});
it("loads only the five profiles requested by the homepage without changing global ranks", async () => {
  mock.snapshot.mockResolvedValue(Array.from({ length: 25 }, (_, index) => row(`startup-${index}`, 25 - index)));
  const result = await getLeaderboard(1, undefined, false, 5);
  expect(result.entries.map(entry => entry.rank)).toEqual([1, 2, 3, 4, 5]);
  expect(mock.rows.mock.calls[0][0].where.id.in).toHaveLength(5);
  expect(result.totalCount).toBe(25);
});
it("clamps pages and handles an empty directory", async () => {
  mock.snapshot.mockResolvedValue([row("only", 1)]);
  expect((await getLeaderboard(Number.MAX_SAFE_INTEGER)).page).toBe(1);
  mock.snapshot.mockResolvedValue([]); mock.rows.mockClear();
  expect((await getLeaderboard()).entries).toEqual([]);
  expect(mock.rows).not.toHaveBeenCalled();
});
it.each([undefined, [], "0", "-1", "1.5", "2abc", "1e9", "9007199254740992"])("normalizes invalid page %j", value => expect(leaderboardPageNumber(value)).toBe(1));
it("accepts a valid page", () => expect(leaderboardPageNumber("2")).toBe(2));
it("retains negative scores and stable tied ranks", async () => {
  mock.snapshot.mockResolvedValue([row("zero", 0), row("negative-b", -2), row("negative-a", -2)]);
  expect((await getLeaderboard()).entries.map(entry => [entry.id, entry.leaderboardScore, entry.rank])).toEqual([["zero", 0, 1], ["negative-a", -2, 2], ["negative-b", -2, 2]]);
});
