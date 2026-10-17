import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FeaturedStartups from "../components/landing/FeaturedStartups";
import LandingFounderStory from "../components/landing/LandingFounderStory";

const queries = vi.hoisted(() => ({ featured: vi.fn(), categories: vi.fn(), cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  featuredStartup: { findMany: queries.featured },
  category: { findMany: queries.categories },
} }));
vi.mock("next/headers", () => ({ cookies: queries.cookies }));
vi.mock("@/app/actions/upvote.actions", () => ({ toggleVote: vi.fn() }));

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  queries.cookies.mockResolvedValue({ get: () => ({ value: "visitor" }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("homepage public content", () => {
  it("limits featured listings to public startups and preserves the visitor's upvote lookup", async () => {
    queries.featured.mockResolvedValue([{ id: "featured", startup: { id: "startup", name: "Public startup", slug: "public-startup", tagline: "Built for founders", category: { name: "SaaS" }, upvoteCount: 12, downvoteCount: 0, signalCount: 12, downvotes: [], upvotes: [{ id: "vote" }] } }]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(expect.objectContaining({
      where: { startup: { status: "LIVE" } },
      include: { startup: { include: { category: true, upvotes: { where: { cookieId: "visitor" } }, downvotes: { where: { cookieId: "visitor" } } } } },
      orderBy: [{ startup: { signalCount: "desc" } }, { sortOrder: "asc" }, { id: "asc" }],
      take: 6,
    }));
    expect(html).toContain('href="/startups/public-startup"');
    expect(html).toContain('aria-label="Featured startups ranked by signals"');
    expect(html).toContain("Top featured");
    expect(html).toContain('aria-label="Remove upvote for Public startup, 12 upvotes"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("SaaS");
    expect(html).not.toContain("Featured by Anshkosh. Ranked by the community.");
  });

  it("shows real zero-vote profiles without claiming a community leader", async () => {
    queries.cookies.mockResolvedValue({ get: () => undefined });
    queries.featured.mockResolvedValue([{ id: "featured", startup: { id: "new-startup", name: "New builder", slug: "new-builder", tagline: "<script>test</script>", logoUrl: null, category: { name: "Education" }, upvoteCount: 0, downvoteCount: 0, signalCount: 0 } }]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(expect.objectContaining({
      include: { startup: { include: { category: true, upvotes: false, downvotes: false } } },
    }));
    expect(html).toContain('href="/startups/new-builder"');
    expect(html).toContain("&lt;script&gt;test&lt;/script&gt;");
    expect(html).not.toContain("Top featured");
    expect(html).toContain('aria-label="Upvote for New builder, 0 upvotes"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("renders no placeholder card when there are no featured startups", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).not.toHaveBeenCalled();
    expect(queries.cookies).not.toHaveBeenCalled();
    expect(html).not.toContain("Make room");
    expect(html).not.toContain('href="/startup/new"');
    expect(html).not.toContain('href="/startups/');
  });

  it("keeps the founder section focused on the founder steps without a profile excerpt", async () => {
    const html = renderToStaticMarkup(await LandingFounderStory());
    expect(html).not.toContain("From a founder’s profile");
    expect(html).not.toContain("A public profile excerpt");
    expect(html).toContain('href="/startup/new"');
  });
});
