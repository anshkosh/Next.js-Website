// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ groups: vi.fn(), rows: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: mock.transaction } }));
import { getLeaderboard, leaderboardPageNumber } from "../lib/leaderboard";

const row = (id: string, votes: number, upvotes: { id: string }[] = []) => ({
  id, slug: id, name: id, tagline: "Test fixture", logoUrl: null,
  category: { name: "Technology" }, upvoteCount: Math.max(votes, 0), downvoteCount: Math.max(-votes, 0), signalCount: votes, downvotes: [], updateCount: 0, upvotes,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/fixture");
  mock.transaction.mockImplementation(async callback => callback({ startup: { groupBy: mock.groups, findMany: mock.rows } }));
});
afterEach(() => vi.unstubAllEnvs());

it("does not query a missing database or fabricate startup rankings", async () => {
  vi.stubEnv("DATABASE_URL", "");
  expect(await getLeaderboard()).toEqual({ entries: [], totalCount: 0, page: 1, totalPages: 1 });
  expect(mock.transaction).not.toHaveBeenCalled();
});

it("uses global shared ranks for tied votes, including ties across page boundaries", async () => {
  mock.groups.mockResolvedValue([
    { signalCount: 100, _count: { _all: 1 } },
    { signalCount: 84, _count: { _all: 2 } },
    { signalCount: 32, _count: { _all: 18 } },
    { signalCount: 0, _count: { _all: 2 } },
  ]);
  mock.rows.mockResolvedValue([row("last-tied-entry", 32), row("no-votes-a", 0), row("no-votes-b", 0)]);
  const result = await getLeaderboard(2);
  expect(result.entries.map(entry => entry.rank)).toEqual([4, 22, 22]);
  expect(result).toMatchObject({ totalCount: 23, totalPages: 2, page: 2 });
  expect(mock.groups).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "LIVE" } }));
  expect(mock.rows).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "LIVE" }, skip: 20, take: 20, orderBy: [{ signalCount: "desc" }, { name: "asc" }, { id: "asc" }] }));
  expect(mock.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
});

it("limits vote lookup to the current visitor and omits private vote records from results", async () => {
  mock.groups.mockResolvedValue([{ signalCount: 8, _count: { _all: 1 } }]);
  mock.rows.mockResolvedValue([row("public-startup", 8, [{ id: "vote-record" }])]);
  const result = await getLeaderboard(1, "visitor-cookie");
  expect(result.entries[0]).toMatchObject({ rank: 1, hasUpvoted: true });
  expect(result.entries[0]).not.toHaveProperty("upvotes");
  expect(result.entries[0]).not.toHaveProperty("downvotes");
  expect(mock.rows.mock.calls[0][0].select.downvotes).toEqual({ where: { cookieId: "visitor-cookie" }, select: { id: true } });
  expect(mock.rows.mock.calls[0][0].select.upvotes).toEqual({ where: { cookieId: "visitor-cookie" }, select: { id: true } });
});

it("clamps pages beyond the last page and handles an empty directory", async () => {
  mock.groups.mockResolvedValue([{ signalCount: 1, _count: { _all: 1 } }]);
  mock.rows.mockResolvedValue([row("only-startup", 1)]);
  expect((await getLeaderboard(Number.MAX_SAFE_INTEGER)).page).toBe(1);
  expect(mock.rows.mock.calls[0][0].skip).toBe(0);
  mock.groups.mockResolvedValue([]);
  mock.rows.mockClear();
  expect((await getLeaderboard()).entries).toEqual([]);
  expect(mock.rows).not.toHaveBeenCalled();
});

it.each([undefined, [], "0", "-1", "1.5", "2abc", "1e9", "9007199254740992"])("normalizes an invalid page %j", value => {
  expect(leaderboardPageNumber(value)).toBe(1);
});
it("accepts a valid page number", () => expect(leaderboardPageNumber("2")).toBe(2));

it("ranks negative net scores below zero while sharing tied ranks", async () => {
  mock.groups.mockResolvedValue([{ signalCount: 0, _count: { _all: 1 } }, { signalCount: -2, _count: { _all: 2 } }]);
  mock.rows.mockResolvedValue([row("zero", 0), row("negative-a", -2), row("negative-b", -2)]);
  const result = await getLeaderboard();
  expect(result.entries.map(entry => [entry.signalCount, entry.rank])).toEqual([[0, 1], [-2, 2], [-2, 2]]);
});
