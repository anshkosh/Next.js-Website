import { afterEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ db: { featuredStartup: { findMany: query } } }));
import WallPage from "@/app/(public)/startup-wall/page";
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("loads only active eligible placements and links each complete image to its startup profile", async () => {
  vi.stubEnv("DATABASE_URL", "test-only");
  query.mockResolvedValue([
    { sortOrder: 0, featuredUntil: null, startup: { id: "one", name: "One", slug: "one", logoUrl: "/logo.svg", wallImageUrl: "" } },
    { sortOrder: 1, featuredUntil: new Date(Date.now() + 86400000), startup: { id: "two", name: "Two", slug: "two", logoUrl: "/logo.svg", wallImageUrl: "/api/uploads/serve/gallery/test.webp" } },
  ]);
  const html = renderToStaticMarkup(await WallPage());
  expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
    startup: expect.objectContaining({ status: "LIVE", wallOptIn: true, founder: { founderMode: true } }),
    OR: [{ featuredUntil: null }, { featuredUntil: { gt: expect.any(Date) } }],
  }) }));
  expect(html.indexOf('href="/startups/two"')).toBeLessThan(html.indexOf('href="/startups/one"'));
  expect(html).toContain('alt="Two creative"'); expect(html).toContain('alt="One logo"');
  expect(html).toContain("object-contain"); expect(html).toContain("col-span-2 row-span-2");
  expect(html).not.toContain("Placeholder"); expect(html).not.toContain("Upvote");
});
it("shows an honest empty state without dummy tiles when no placements exist", async () => {
  vi.stubEnv("DATABASE_URL", "");
  const html = renderToStaticMarkup(await WallPage());
  expect(query).not.toHaveBeenCalled(); expect(html).toContain("first approved startups");
  expect(html).not.toContain('href="/startups/');
});
