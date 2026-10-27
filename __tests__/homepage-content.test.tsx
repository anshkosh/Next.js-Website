import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FeaturedStartups from "../components/landing/FeaturedStartups";
import TopRankedStartups from "../components/landing/TopRankedStartups";
import LandingFounderStory from "../components/landing/LandingFounderStory";

const queries = vi.hoisted(() => ({ featured: vi.fn(), leaderboard: vi.fn(), cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  featuredStartup: { findMany: queries.featured },
} }));
vi.mock("next/headers", () => ({ cookies: queries.cookies }));
vi.mock("@/lib/leaderboard", () => ({ getLeaderboard: queries.leaderboard, withActivitySignals: async <T,>(startups: T[]) => startups }));
vi.mock("@/app/actions/upvote.actions", () => ({ toggleVote: vi.fn() }));

const featuredRow = (overrides: Record<string, unknown> = {}) => ({ startup: {
  id: "startup", slug: "public-startup", name: "Public startup", tagline: "Built for founders",
  logoUrl: null, upvoteCount: 12, downvoteCount: 0, updateCount: 2,
  category: { name: "SaaS", iconName: null }, metadata: null,
  upvotes: [{ id: "visitor-vote" }], downvotes: [], ...overrides,
} });

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  queries.cookies.mockResolvedValue({ get: () => ({ value: "visitor" }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("homepage public content", () => {
  it("shows one admin-selected featured startup at a time on Discover and preserves visitor vote state", async () => {
    queries.featured.mockResolvedValue([featuredRow(), featuredRow({ id: "next-startup", slug: "next-startup", name: "Next startup" })]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        startup: { status: "LIVE", founder: { founderMode: true } },
        OR: [{ featuredUntil: null }, { featuredUntil: { gt: expect.any(Date) } }],
      }),
      orderBy: { sortOrder: "asc" },
    }));
    expect(html).toContain('href="/startups/public-startup"');
    expect(html).toContain('aria-labelledby="discover-featured-title"');
    expect(html).toContain("Selected for Discover");
    expect(html).toContain('aria-label="Remove upvote for Public startup, 12 upvotes"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("SaaS");
    expect(html).not.toContain('href="/startups/next-startup"');
    expect(html).toContain('aria-label="Show next featured startup"');
    expect(html).toContain("Changes every 30 seconds");
  });

  it("shows live featured profiles with zero votes without inventing activity", async () => {
    queries.cookies.mockResolvedValue({ get: () => undefined });
    queries.featured.mockResolvedValue([featuredRow({ id: "new-startup", name: "New builder", slug: "new-builder", tagline: "<script>test</script>", upvoteCount: 0, downvoteCount: 0, upvotes: [], downvotes: [] })]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalled();
    expect(html).toContain('href="/startups/new-builder"');
    expect(html).toContain("&lt;script&gt;test&lt;/script&gt;");
    expect(html).toContain('aria-label="Upvote for New builder, 0 upvotes"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("renders no placeholder card when there are no featured startups", async () => {
    vi.stubEnv("DATABASE_URL", "");
    queries.featured.mockResolvedValue([]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).not.toHaveBeenCalled();
    expect(queries.cookies).not.toHaveBeenCalled();
    expect(html).not.toContain("Make room");
    expect(html).not.toContain('href="/startup/new"');
    expect(html).not.toContain('href="/startups/');
  });

  it("shows exactly the first five global leaderboard entries on the homepage", async () => {
    const entries = Array.from({ length: 6 }, (_, index) => ({
      id: `startup-${index + 1}`, slug: `startup-${index + 1}`, name: `Startup ${index + 1}`,
      tagline: "A real startup", logoUrl: null, category: { name: "SaaS" },
      upvoteCount: 6 - index, downvoteCount: 0, signalCount: 6 - index,
      updateCount: 0, founderDays: 0, backers: 0, discussions: 0,
      activitySignals: 0, leaderboardScore: 6 - index, rank: index + 1,
      hasUpvoted: false, hasDownvoted: false,
    }));
    queries.leaderboard.mockResolvedValue({ entries, totalCount: 6, page: 1, totalPages: 1 });

    const html = renderToStaticMarkup(await TopRankedStartups());

    expect(queries.leaderboard).toHaveBeenCalledWith(1, "visitor", false, 5);
    expect(html).toContain("Top-ranked profiles by participation");
    expect(html).toContain('href="/startups/startup-5"');
    expect(html).not.toContain('href="/startups/startup-6"');
  });

  it("keeps the founder section focused on the founder steps without a profile excerpt", async () => {
    const html = renderToStaticMarkup(await LandingFounderStory());
    expect(html).not.toContain("From a founder’s profile");
    expect(html).not.toContain("A public profile excerpt");
    expect(html).toContain('href="/startup/new"');
  });
});
