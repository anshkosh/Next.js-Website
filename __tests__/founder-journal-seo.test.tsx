// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const m = vi.hoisted(() => ({ entry: vi.fn(), entries: vi.fn(), startups: vi.fn(), categories: vi.fn(), articles: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { founderJournalEntry: { findFirst: m.entry, findMany: m.entries }, startup: { findMany: m.startups }, category: { findMany: m.categories }, journalPost: { findMany: m.articles } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); }, permanentRedirect: (url: string) => { throw new Error(`REDIRECT:${url}`); } }));
import { publicFounderEntry } from "../lib/founder-journal-queries";
import { founderEntryDescription, founderEntryPath, founderEntrySlug } from "../lib/founder-journal-seo";
import Page, { generateMetadata, dynamic } from "../app/(public)/founder-journal/[id]/[slug]/page";
import sitemap, { dynamic as sitemapDynamic } from "../app/sitemap";
function fixture() {
  return { id: "entry-one", title: "What our first 5 customers taught us", body: "A useful lesson from real customer interviews.", contentJson: null, milestone: "Interview five customers", milestoneDone: true,
    authorId: "founder", publishedAt: new Date("2026-10-16"), updatedAt: new Date("2026-10-17"),
    startup: { founderId: "founder", name: "Useful Startup", slug: "useful-startup", founderName: "Public Founder", websiteUrl: "https://example.com" } };
}
const params = () => Promise.resolve({ id: "entry-one", slug: founderEntrySlug(fixture().title) });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "postgresql://test.example/db"); m.entry.mockResolvedValue(fixture()); m.entries.mockResolvedValue([]); m.startups.mockResolvedValue([]); m.categories.mockResolvedValue([]); m.articles.mockResolvedValue([]); });
afterEach(() => vi.unstubAllEnvs());
describe("public founder entry pages", () => {
  it("gives entries stable IDs and readable canonical slugs", () => {
    expect(founderEntryPath(fixture())).toBe("/founder-journal/entry-one/what-our-first-5-customers-taught-us");
    expect(founderEntrySlug("中文")).toBe("founder-story");
    expect(founderEntrySlug("  Lessons & Decisions! ")).toBe("lessons-decisions");
    expect(founderEntryDescription("[Image]\n", "Useful Startup")).toContain("Useful Startup");
    expect(founderEntryDescription("A ".repeat(200), "Startup").length).toBeLessThanOrEqual(160);
  });
  it("filters publication and live status in the query and strips ownership identifiers from its result", async () => {
    const entry = await publicFounderEntry("entry-one");
    expect(m.entry).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "entry-one", visibility: "PUBLIC", publishedAt: { not: null }, startup: { status: "LIVE" } } }));
    expect(entry).not.toHaveProperty("authorId"); expect(entry?.startup).not.toHaveProperty("founderId");
    expect(dynamic).toBe("force-dynamic");
  });
  it("rejects an entry after its startup ownership changes or its startup disappears", async () => {
    m.entry.mockResolvedValueOnce({ ...fixture(), startup: { ...fixture().startup, founderId: "different-owner" } });
    expect(await publicFounderEntry("entry-one")).toBeNull();
    m.entry.mockResolvedValueOnce({ ...fixture(), startup: null });
    expect(await publicFounderEntry("entry-one")).toBeNull();
  });
  it("returns 404 for private, deleted or non-live entries without returning their metadata", async () => {
    m.entry.mockResolvedValue(null);
    await expect(Page({ params: params() })).rejects.toThrow("NOT_FOUND");
    await expect(generateMetadata({ params: params() })).rejects.toThrow("NOT_FOUND");
  });
  it("does not query malformed IDs or unconfigured databases", async () => {
    expect(await publicFounderEntry("../private")).toBeNull(); expect(m.entry).not.toHaveBeenCalled();
    vi.stubEnv("DATABASE_URL", ""); expect(await publicFounderEntry("entry-one")).toBeNull(); expect(m.entry).not.toHaveBeenCalled();
  });
  it("redirects outdated title slugs only after checking public access", async () => {
    await expect(Page({ params: Promise.resolve({ id: "entry-one", slug: "old-title" }) })).rejects.toThrow(`REDIRECT:${founderEntryPath(fixture())}`);
    m.entry.mockResolvedValue(null);
    await expect(Page({ params: Promise.resolve({ id: "entry-one", slug: "old-title" }) })).rejects.toThrow("NOT_FOUND");
  });
  it("provides article and sharing metadata with the entry's title, description, author and canonical", async () => {
    const metadata = await generateMetadata({ params: params() });
    const url = `https://www.anshkosh.com${founderEntryPath(fixture())}`;
    expect(metadata.alternates?.canonical).toBe(url);
    expect(metadata.description).toBe(fixture().body);
    expect(metadata.openGraph).toMatchObject({ type: "article", title: fixture().title, url, authors: ["Public Founder"], publishedTime: "2026-10-16T00:00:00.000Z" });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: fixture().title });
  });
  it("renders article schema, startup navigation and properly attributed website links", async () => {
    const html = renderToStaticMarkup(await Page({ params: params() }));
    expect(html).toContain('"@type":"BlogPosting"'); expect(html).toContain('rel="ugc noopener noreferrer"');
    expect(html).toContain('href="https://example.com/"'); expect(html).toContain('/startups/useful-startup');
    expect(html).not.toContain('"authorId"'); expect(html).not.toContain('"founderId"');
  });
  it("escapes malicious article titles in structured data and rejects unsafe website protocols", async () => {
    const row = { ...fixture(), title: '</script><img src=x onerror="bad()">', startup: { ...fixture().startup, websiteUrl: "javascript:bad()" } };
    m.entry.mockResolvedValue(row);
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ id: row.id, slug: founderEntrySlug(row.title) }) }));
    expect(html).not.toContain("</script><img"); expect(html).toContain("\\u003c/script>"); expect(html).not.toContain('href="javascript:');
  });
  it("includes only public matching-owner entries in a fresh sitemap and removes withdrawn entries", async () => {
    const row = fixture();
    m.entries.mockResolvedValueOnce([row, { ...row, id: "old-owner-entry", startup: { founderId: "different" } }, { ...row, id: "detached", startup: null }]);
    let urls = (await sitemap()).map(entry => entry.url);
    expect(urls).toContain(`https://www.anshkosh.com${founderEntryPath(row)}`);
    expect(urls.some(url => /old-owner-entry|detached/.test(url))).toBe(false);
    expect(m.entries).toHaveBeenCalledWith(expect.objectContaining({ where: { visibility: "PUBLIC", publishedAt: { not: null }, startup: { status: "LIVE" } } }));
    urls = (await sitemap()).map(entry => entry.url);
    expect(urls.some(url => url.includes('/founder-journal/'))).toBe(false); expect(sitemapDynamic).toBe("force-dynamic");
  });
});
