import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolveSiteUrl, absoluteUrl, DEFAULT_SOCIAL_IMAGE, seoMetadata, organizationSchema, websiteSchema } from "../lib/seo";

const queries = vi.hoisted(() => ({
  startup: vi.fn(), category: vi.fn(), journalPost: vi.fn(), redirect: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ db: {
  startup: { findMany: queries.startup },
  category: { findMany: queries.category },
  journalPost: { findMany: queries.journalPost },
  slugRedirect: { findUnique: queries.redirect },
} }));

beforeEach(() => vi.stubEnv("DATABASE_URL", ""));
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe("canonical URL policy", () => {
  it("normalizes both production domains to HTTPS www, even with legacy configuration", () => {
    expect(resolveSiteUrl()).toBe("https://www.anshkosh.com");
    expect(resolveSiteUrl("http://anshkosh.com/")).toBe("https://www.anshkosh.com");
    expect(resolveSiteUrl("https://www.anshkosh.com/")).toBe("https://www.anshkosh.com");
    expect(resolveSiteUrl("http://localhost:3011/")).toBe("http://localhost:3011");
    expect(absoluteUrl("https://anshkosh.com/journal/test")).toBe("https://www.anshkosh.com/journal/test");
    expect(absoluteUrl("https://publisher.example/story")).toBe("https://publisher.example/story");
  });

  it("includes a real social image in each public page's metadata", () => {
    const metadata = seoMetadata({ title: "FAQ — Anshkosh", description: "Answers", path: "/faq" });
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/faq"));
    expect(metadata.openGraph).toMatchObject({
      url: absoluteUrl("/faq"), images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE) }],
    });
    expect(metadata.twitter).toMatchObject({ images: [absoluteUrl(DEFAULT_SOCIAL_IMAGE)] });
    expect(existsSync(`public${DEFAULT_SOCIAL_IMAGE}`)).toBe(true);
  });

  it("aligns schema, robots, sitemap and llms URLs", async () => {
    const { default: sitemap } = await import("../app/sitemap");
    const { default: robots } = await import("../app/robots");
    const entries = await sitemap();
    expect(entries).toHaveLength(9);
    expect(entries.every(entry => entry.url.startsWith("https://www.anshkosh.com/"))).toBe(true);
    expect(robots().sitemap).toBe(absoluteUrl("/sitemap.xml"));
    expect(organizationSchema.url).toBe("https://www.anshkosh.com");
    expect(websiteSchema.url).toBe(organizationSchema.url);
    expect(readFileSync("public/llms.txt", "utf8")).not.toContain("https://anshkosh.com/");
    expect(queries.startup).not.toHaveBeenCalled();
  });

  it("includes only published/live detail content and accurate modification dates", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
    const updatedAt = new Date("2026-10-01T00:00:00Z");
    queries.startup.mockResolvedValue([{ slug: "live-startup", updatedAt }]);
    queries.category.mockResolvedValue([{ slug: "technology", updatedAt }]);
    queries.journalPost.mockResolvedValue([{ slug: "published-story", updatedAt }]);
    const { default: sitemap } = await import("../app/sitemap");
    const entries = await sitemap();
    expect(entries).toHaveLength(12);
    expect(queries.startup).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "LIVE" } }));
    expect(queries.journalPost).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED" } }));
    expect(entries.find(entry => entry.url.endsWith("/journal/published-story"))?.lastModified).toEqual(updatedAt);
  });
});
