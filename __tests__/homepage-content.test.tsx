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
vi.mock("@/lib/leaderboard", () => ({ getLeaderboard: queries.featured }));
vi.mock("@/app/actions/upvote.actions", () => ({ toggleVote: vi.fn() }));

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  queries.cookies.mockResolvedValue({ get: () => ({ value: "visitor" }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("homepage public content", () => {
  it("limits featured listings to public startups and preserves the visitor's upvote lookup", async () => {
    queries.featured.mockResolvedValue({ entries: [{ id: "startup", name: "Public startup", slug: "public-startup", tagline: "Built for founders", category: { name: "SaaS" }, upvoteCount: 12, downvoteCount: 0, signalCount: 12, hasDownvoted: false, hasUpvoted: true, rank: 2, leaderboardScore: 19, activitySignals: 7, founderDays: 1, backers: 1, discussions: 1 }] });
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(1, "visitor", true);
    expect(html).toContain('href="/startups/public-startup"');
    expect(html).toContain('aria-label="Featured startups ranked by signals"');
    expect(html).toContain("Top featured");
    expect(html).toContain('aria-label="Remove upvote for Public startup, 12 upvotes"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("SaaS");
    expect(html).toContain("19<span");
    expect(html).toContain("global ranks");
    expect(html).not.toContain("Featured by Anshkosh. Ranked by the community.");
  });

  it("shows real zero-vote profiles without claiming a community leader", async () => {
    queries.cookies.mockResolvedValue({ get: () => undefined });
    queries.featured.mockResolvedValue({ entries: [{ id: "new-startup", name: "New builder", slug: "new-builder", tagline: "<script>test</script>", logoUrl: null, category: { name: "Education" }, upvoteCount: 0, downvoteCount: 0, signalCount: 0, rank: 1, leaderboardScore: 0, activitySignals: 0, founderDays: 0, backers: 0, discussions: 0 }] });
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(1, undefined, true);
    expect(html).toContain('href="/startups/new-builder"');
    expect(html).toContain("&lt;script&gt;test&lt;/script&gt;");
    expect(html).not.toContain("Top featured");
    expect(html).toContain('aria-label="Upvote for New builder, 0 upvotes"');
    expect(html).toContain('aria-pressed="false"');
  });

  it("renders no placeholder card when there are no featured startups", async () => {
    vi.stubEnv("DATABASE_URL", "");
    queries.featured.mockResolvedValue({ entries: [] });
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(1, undefined, true);
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
