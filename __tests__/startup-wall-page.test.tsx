import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const { query, owned, session } = vi.hoisted(() => ({ query: vi.fn(), owned: vi.fn(), session: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/db", () => ({ db: { featuredStartup: { findMany: query }, startup: { findMany: owned } } }));
import WallPage from "@/app/(public)/startup-wall/page";
beforeEach(() => { session.mockResolvedValue(null); owned.mockResolvedValue([]); query.mockResolvedValue([]); });
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("renders 100 active eligible placements and links their images to the startup profiles", async () => {
  vi.stubEnv("DATABASE_URL", "test-only");
  query.mockResolvedValue([
    { sortOrder: 0, featuredUntil: null, startup: { id: "one", name: "One", slug: "one", logoUrl: "/logo.svg", wallOptIn: false, wallImageUrl: "/unused-creative.webp" } },
    { sortOrder: 1, featuredUntil: new Date(Date.now() + 86400000), startup: { id: "two", name: "Two", slug: "two", logoUrl: "/logo.svg", wallOptIn: true, wallImageUrl: "/api/uploads/serve/gallery/test.webp" } },
    ...Array.from({ length: 98 }, (_, index) => ({
      sortOrder: index + 2, featuredUntil: null,
      startup: { id: `extra-${index}`, name: `Extra ${index}`, slug: `extra-${index}`, logoUrl: "/logo.svg", wallImageUrl: "" },
    })),
  ]);
  const html = renderToStaticMarkup(await WallPage());
  expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
    startup: { OR: [
      expect.objectContaining({ status: "LIVE", wallOptIn: true, founder: { founderMode: true } }),
      expect.objectContaining({ status: "LIVE", wallAdminPlacement: true, founder: { founderMode: true } }),
    ] },
    OR: [{ featuredUntil: null }, { featuredUntil: { gt: expect.any(Date) } }],
  }) }));
  expect(html.indexOf('href="/startups/two"')).toBeLessThan(html.indexOf('href="/startups/one"'));
  expect(query.mock.calls[0][0]).not.toHaveProperty("take");
  expect(html.match(/href="\/startups\//g)).toHaveLength(100);
  expect(html.match(/class="[^"]*name/g)).not.toBeNull();
  expect(html).toContain('class="');
  expect(html).toContain('>One</span>');
  expect(html).toContain('>Two</span>');
  expect(html).toContain('alt="Two creative"'); expect(html).toContain('alt="One logo"');
  expect(html).not.toContain("unused-creative.webp");
  expect(html).toContain('data-count="many"');
  expect(html).not.toContain("Placeholder"); expect(html).not.toContain("Upvote");
});
it("shows an honest empty state without dummy tiles when no placements exist", async () => {
  vi.stubEnv("DATABASE_URL", "");
  const html = renderToStaticMarkup(await WallPage());
  expect(query).not.toHaveBeenCalled(); expect(html).toContain("first approved startups");
  expect(html).not.toContain('href="/startups/');
});

it("links a signed-in founder directly to their startup Wall controls", async () => {
  vi.stubEnv("DATABASE_URL", "test-only"); session.mockResolvedValue({ user: { id: "founder" } });
  owned.mockResolvedValue([{ id: "owned", status: "LIVE" }]);
  const html = renderToStaticMarkup(await WallPage());
  expect(html).toContain('href="/startup/owned/edit#startup-wall-settings"');
  expect(html).toContain("Anshkosh Startup "); expect(html).toContain('class="page-title"');
  expect(owned).toHaveBeenCalledWith(expect.objectContaining({ where: { founderId: "founder" } }));
});
it("hides promotion when the founder's startup is already displayed", async () => {
  vi.stubEnv("DATABASE_URL", "test-only"); session.mockResolvedValue({ user: { id: "founder" } });
  owned.mockResolvedValue([{ id: "owned", status: "LIVE" }]);
  query.mockResolvedValue([{ sortOrder: 0, featuredUntil: null, startup: { id: "owned", name: "Owned", slug: "owned", logoUrl: "/logo.svg", wallImageUrl: "" } }]);
  const html = renderToStaticMarkup(await WallPage());
  expect(html).not.toContain("Promote your startup"); expect(html).toContain('href="/startups/owned"');
});
it("targets another unfeatured startup when a founder manages more than one", async () => {
  vi.stubEnv("DATABASE_URL", "test-only"); session.mockResolvedValue({ user: { id: "founder" } });
  owned.mockResolvedValue([{ id: "featured", status: "LIVE" }, { id: "other", status: "LIVE" }]);
  query.mockResolvedValue([{ sortOrder: 0, featuredUntil: null, startup: { id: "featured", name: "Featured", slug: "featured", logoUrl: "/logo.svg", wallImageUrl: "" } }]);
  expect(renderToStaticMarkup(await WallPage())).toContain('href="/startup/other/edit#startup-wall-settings"');
});
it("lets a signed-in member create their first startup and asks guests to sign in", async () => {
  vi.stubEnv("DATABASE_URL", "test-only");
  expect(renderToStaticMarkup(await WallPage())).toContain('href="/login?next=%2Fstartup-wall"');
  session.mockResolvedValue({ user: { id: "founder" } });
  expect(renderToStaticMarkup(await WallPage())).toContain('href="/startup/new"');
});
