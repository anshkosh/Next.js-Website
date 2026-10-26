import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import SearchPage from "../app/(public)/search/page";
import { startupSearchWhere } from "../lib/startup-search";
const queries = vi.hoisted(() => ({ startups: vi.fn(), articles: vi.fn(), categories: vi.fn(), signals: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (callback: (tx: object) => unknown) => callback({ $queryRaw: queries.signals }), startup: { findMany: queries.startups }, journalPost: { findMany: queries.articles }, category: { findMany: queries.categories } } }));
vi.mock("@/lib/public-signals", () => ({ publicSignals: async (tx: { $queryRaw: () => Promise<unknown> }) => tx.$queryRaw() }));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("matches published audience text as well as descriptions and cities", () => {
  const where = startupSearchWhere("  Kerala  ");
  expect(where.status).toBe("LIVE");
  expect(where.OR).toContainEqual({ targetAudience: { contains: "Kerala", mode: "insensitive" } });
  expect(where.OR).toContainEqual({ description: { contains: "Kerala", mode: "insensitive" } });
  expect(where.OR).toContainEqual({ metadata: { path: ["city"], string_contains: "Kerala", mode: "insensitive" } });
});
it("searches published founder names without querying private accounts or showing vote identifiers", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.invalid/fixture");
  queries.startups.mockResolvedValue([{ id: "test", slug: "test", name: "Test startup", tagline: "Fixture", logoUrl: null, category: { name: "Food" }, upvoteCount: 3, downvoteCount: 5, signalCount: -2, founders: [{ name: "Rinu <script>" }] }]);
  queries.signals.mockResolvedValue([{ id: "test", founderDays: 1, backers: 1, discussions: 0 }]);
  queries.articles.mockResolvedValue([]); queries.categories.mockResolvedValue([]);
  const html = renderToStaticMarkup(await SearchPage({ searchParams: Promise.resolve({ q: "  rinu  " }) }));
  const args = queries.startups.mock.calls[0][0];
  expect(args.where.status).toBe("LIVE");
  expect(args.where.OR).toContainEqual({ founders: { some: { name: { contains: "rinu", mode: "insensitive" } } } });
  expect(args.where.OR).not.toContainEqual(expect.objectContaining({ founder: expect.anything() }));
  expect(args.orderBy).toEqual({ signalCount: "desc" });
  expect(html).toContain("2 signals"); expect(html).toContain("-2 net votes"); expect(html).toContain("3 upvotes − 5 downvotes");
  expect(html).toContain("Rinu &lt;script&gt;"); expect(html).not.toContain("<script>");
});
