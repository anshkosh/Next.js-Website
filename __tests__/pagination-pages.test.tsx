// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ startups: vi.fn(), count: vi.fn(), categories: vi.fn(), program: vi.fn(), requests: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { startup: { findMany: mock.startups, count: mock.count, findFirst: async () => ({ id: "startup", name: "Startup", slug: "startup", status: "LIVE" }) }, category: { findMany: mock.categories }, betaTesterProgram: { findUnique: mock.program }, betaTesterRequest: { count: mock.requests } } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => ({ user: { id: "owner", role: "admin", emailVerified: true } }) } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: async () => ({ get: () => undefined }) }));
vi.mock("@/components/landing/FeaturedStartups", () => ({ default: () => null }));
vi.mock("@/app/actions/admin.actions", () => ({ suspendStartup: vi.fn(), unsuspendStartup: vi.fn() }));
vi.mock("@/components/dashboard/BetaTesterManager", () => ({ default: () => null }));
import DiscoverPage from "@/app/(public)/discover/page";
import AdminStartupsPage from "@/app/(admin)/admin/startups/page";
import BetaTestersPage from "@/app/(founder)/startup/[id]/beta-testers/page";
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "test-only"); mock.startups.mockResolvedValue([]); mock.count.mockResolvedValue(0); mock.categories.mockResolvedValue([]); mock.program.mockResolvedValue(null); });
afterEach(() => vi.unstubAllEnvs());
it.each(["abc", "0", "-1", "10001", "9007199254740993"])("never sends malformed page %s to Prisma", async page => {
  await DiscoverPage({ searchParams: Promise.resolve({ page }) });
  await AdminStartupsPage({ searchParams: Promise.resolve({ page }) });
  for (const [query] of mock.startups.mock.calls) { expect(query.skip).toBe(0); expect(query.take).toBe(20); }
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
