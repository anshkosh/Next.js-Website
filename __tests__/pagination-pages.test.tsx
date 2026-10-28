// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";
const mock = vi.hoisted(() => ({ featured: vi.fn(), startups: vi.fn(), count: vi.fn(), categories: vi.fn(), program: vi.fn(), requests: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (callback: (tx: object) => unknown) => callback({ $queryRaw: async () => [] }), featuredStartup: { findMany: mock.featured }, startup: { findMany: mock.startups, count: mock.count, findFirst: async () => ({ id: "startup", name: "Startup", slug: "startup", status: "LIVE" }) }, category: { findMany: mock.categories }, betaTesterProgram: { findUnique: mock.program }, betaTesterRequest: { count: mock.requests } } }));
vi.mock("@/lib/public-signals", () => ({ publicSignals: async (tx: { $queryRaw: () => Promise<unknown> }) => tx.$queryRaw() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => ({ user: { id: "owner", role: "admin", emailVerified: true } }) } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/components/landing/FeaturedStartups", () => ({ default: () => null }));
vi.mock("@/components/startup/StartupCard", () => ({ default: () => null }));
vi.mock("@/app/actions/admin.actions", () => ({ suspendStartup: vi.fn(), unsuspendStartup: vi.fn() }));
vi.mock("@/components/dashboard/BetaTesterManager", () => ({ default: () => null }));
import DiscoverPage from "@/app/(public)/discover/page";
import AdminStartupsPage from "@/app/(admin)/admin/startups/page";
import BetaTestersPage from "@/app/(founder)/startup/[id]/beta-testers/page";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "test-only"); mock.startups.mockResolvedValue([]); mock.featured.mockResolvedValue([]); mock.count.mockResolvedValue(0); mock.categories.mockResolvedValue([]); mock.program.mockResolvedValue(null); });
afterEach(() => vi.unstubAllEnvs());
it.each(["abc", "0", "-1", "10001", "9007199254740993"])("never sends malformed page %s to Prisma", async page => {
  await DiscoverPage({ searchParams: Promise.resolve({ page }) });
  expect(mock.startups.mock.calls[0][0]).toMatchObject({ skip: 0, take: 24 });
  await AdminStartupsPage({ searchParams: Promise.resolve({ page }) });
  expect(mock.startups.mock.calls[1][0]).toMatchObject({ skip: 0, take: 20 });
});
it("fills Discover rows and paginates every matching startup exactly once", async () => {
  const rows = Array.from({ length: 49 }, (_, index) => ({
    id: `startup-${index}`, slug: `startup-${index}`, name: `Startup ${index}`,
    tagline: "Test startup", logoUrl: null, metadata: null,
    upvoteCount: 0, downvoteCount: 0, updateCount: 0,
    category: { name: "Technology", iconName: null },
  }));
  mock.startups.mockImplementation(async ({ skip, take }) => rows.slice(skip, skip + take));
  mock.count.mockResolvedValue(rows.length);
  const seen: string[] = [];

  for (const page of [1, 2, 3]) {
    const tree = await DiscoverPage({ searchParams: Promise.resolve({
      page: String(page), q: "startup", category: "technology",
    }) });
    const content = tree.props.children.find((child: ReactElement<{ "aria-labelledby"?: string }> | false) => child && child.props["aria-labelledby"] === "discover-grid-title");
    const cards: ReactElement<{ startup: { id: string } }>[] = content.props.children[1].props.children;
    const ids = cards.map(card => card.props.startup.id);
    expect(ids).toHaveLength(page < 3 ? 24 : 1);
    if (page < 3) {
      expect(ids.length % 2).toBe(0);
      expect(ids.length % 3).toBe(0);
      expect(ids[20]).toBe(rows[(page - 1) * 24 + 20].id);
    }
    seen.push(...ids);
    expect(mock.startups.mock.lastCall?.[0]).toMatchObject({
      skip: (page - 1) * 24, take: 24,
      where: { status: "LIVE", founder: { founderMode: true }, category: { slug: "technology" } },
    });
    const pagination = renderToStaticMarkup(content.props.children[2]);
    expect(pagination).toContain(`Page ${page} of 3`);
    expect(pagination).toContain(page < 3 ? ">Next<" : ">Previous<");
    expect(pagination).toContain("q=startup");
    expect(pagination).toContain("category=technology");
    if (page === 3) expect(pagination).not.toContain(">Next<");
  }
  expect(seen).toEqual(rows.map(row => row.id));
});
it("bounds beta request reads, counts the full backlog and hides pending email at the page boundary", async () => {
  mock.program.mockResolvedValue({ id: "program", enabled: true, description: "Test", reward: null, requests: [
    { id: "pending", name: "Tester", email: "hidden@example.test", message: null, status: "PENDING", createdAt: new Date() },
    { id: "approved", name: "Tester", email: "visible@example.test", message: null, status: "APPROVED", createdAt: new Date() },
  ] });
  mock.requests.mockResolvedValueOnce(45).mockResolvedValueOnce(23);
  const tree = await BetaTestersPage({ params: Promise.resolve({ id: "startup" }), searchParams: Promise.resolve({ page: "2" }) });
  const query = mock.program.mock.calls[0][0].select.requests;
  expect(query.skip).toBe(20); expect(query.take).toBe(20); expect(query.where.OR).toHaveLength(2);
  const manager = tree.props.children[0];
  expect(manager.props.pendingTotal).toBe(23);
  expect(manager.props.requests[0].email).toBeNull(); expect(manager.props.requests[1].email).toBe("visible@example.test");
});

it("sorts Discover by the chosen option and keeps featured startups out of the unfiltered grid", async () => {
  mock.featured.mockResolvedValue([{ startupId: "featured-one" }]);
  await DiscoverPage({ searchParams: Promise.resolve({ sort: "newest" }) });
  expect(mock.startups.mock.calls[0][0]).toMatchObject({ orderBy: [{ createdAt: "desc" }], where: { id: { notIn: ["featured-one"] } } });
  await DiscoverPage({ searchParams: Promise.resolve({ q: "startup", sort: "unknown" }) });
  expect(mock.startups.mock.calls[1][0].orderBy).toEqual([{ signalCount: "desc" }, { createdAt: "desc" }]);
  expect(mock.startups.mock.calls[1][0].where.id).toBeUndefined();
});
