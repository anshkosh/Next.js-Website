import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FeaturedStartups from "../components/landing/FeaturedStartups";
import LandingFounderStory from "../components/landing/LandingFounderStory";

const queries = vi.hoisted(() => ({ featured: vi.fn(), founder: vi.fn(), categories: vi.fn(), cookies: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  featuredStartup: { findMany: queries.featured },
  startup: { findFirst: queries.founder },
  category: { findMany: queries.categories },
} }));
vi.mock("next/headers", () => ({ cookies: queries.cookies }));
vi.mock("@/components/startup/StartupCard", () => ({ default: ({ startup }: { startup: { slug: string; name: string } }) => <a href={`/startups/${startup.slug}`}>{startup.name}</a> }));

beforeEach(() => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  queries.cookies.mockResolvedValue({ get: () => ({ value: "visitor" }) });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("homepage public content", () => {
  it("limits featured listings to public startups and preserves the visitor's upvote lookup", async () => {
    queries.featured.mockResolvedValue([{ id: "featured", startup: { name: "Public startup", slug: "public-startup", upvotes: [] } }]);
    const html = renderToStaticMarkup(await FeaturedStartups());
    expect(queries.featured).toHaveBeenCalledWith(expect.objectContaining({
      where: { startup: { status: "LIVE" } },
      include: { startup: { include: { category: true, upvotes: { where: { cookieId: "visitor" } } } } },
    }));
    expect(html).toContain('href="/startups/public-startup"');
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

  it("uses only public profile fields for the founder excerpt and escapes user-authored statements", async () => {
    queries.founder.mockResolvedValue({ name: "A real startup", slug: "real-startup", founderName: "A founder", problemStatement: "<script>test</script>" });
    const html = renderToStaticMarkup(await LandingFounderStory());
    expect(queries.founder).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: "LIVE", problemStatement: { not: null } },
      select: { name: true, slug: true, founderName: true, problemStatement: true },
    }));
    expect(html).toContain("&lt;script&gt;test&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain('href="/startups/real-startup"');
  });

  it("does not fabricate a founder story when no public excerpt is available", async () => {
    queries.founder.mockResolvedValue(null);
    const html = renderToStaticMarkup(await LandingFounderStory());
    expect(html).not.toContain("From a founder’s profile");
    expect(html).toContain('href="/startup/new"');
  });
});
