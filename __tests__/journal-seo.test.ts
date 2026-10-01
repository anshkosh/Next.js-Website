import { afterEach, expect, it, vi } from "vitest";
import { absoluteUrl, DEFAULT_SOCIAL_IMAGE } from "../lib/seo";

const { findPost } = vi.hoisted(() => ({ findPost: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { journalPost: { findFirst: findPost } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND_404"); } }));

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

it("does not query an unconfigured database and returns not-found metadata", async () => {
  vi.stubEnv("DATABASE_URL", "");
  const { generateMetadata } = await import("../app/(public)/journal/[slug]/page");
  await expect(generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NOT_FOUND_404");
  expect(findPost).not.toHaveBeenCalled();
});

it("treats absent/unpublished posts as not found", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  findPost.mockResolvedValue(null);
  const { generateMetadata } = await import("../app/(public)/journal/[slug]/page");
  await expect(generateMetadata({ params: Promise.resolve({ slug: "missing" }) })).rejects.toThrow("NOT_FOUND_404");
  expect(findPost).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "missing", status: "PUBLISHED" } }));
});

it("uses a valid fallback image and migrates legacy first-party canonicals", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  findPost.mockResolvedValue({
    slug: "founder-story", title: "Founder story", metaTitle: null,
    metaDescription: null, excerpt: "Lessons from a founder", metaKeywords: [],
    coverImageUrl: null, canonicalUrl: "https://anshkosh.com/journal/founder-story",
    publishedAt: new Date("2026-09-01"), updatedAt: new Date("2026-10-01"), authorName: "Anshkosh",
  });
  const { generateMetadata } = await import("../app/(public)/journal/[slug]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "founder-story" }) });
  expect(metadata.alternates?.canonical).toBe("https://www.anshkosh.com/journal/founder-story");
  expect(metadata.openGraph).toMatchObject({
    type: "article", images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE) }],
    modifiedTime: "2026-10-01T00:00:00.000Z",
  });
});
