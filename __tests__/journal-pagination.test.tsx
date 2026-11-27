// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { absoluteUrl } from "@/lib/seo";
import { journalListHref, journalListParams } from "@/lib/journal-pagination";

const mock = vi.hoisted(() => ({
  posts: vi.fn(),
  count: vi.fn(),
  categories: vi.fn(),
  featured: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    journalPost: { findMany: mock.posts, count: mock.count, findFirst: mock.featured },
    journalCategory: { findMany: mock.categories },
  },
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/components/landing/JournalCard", () => ({ default: ({ post }: { post: { slug: string } }) => <div>{post.slug}</div> }));

import JournalPage, { generateMetadata } from "@/app/(public)/journal/page";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("DATABASE_URL", "test-only");
  mock.posts.mockResolvedValue([]);
  mock.count.mockResolvedValue(25);
  mock.categories.mockResolvedValue([{ name: "Design", slug: "design" }]);
  mock.featured.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

it("uses self-canonical pagination and keeps the selected category", async () => {
  const searchParams = Promise.resolve({ category: "design", page: "2", utm_source: "newsletter" });
  const metadata = await generateMetadata({ searchParams });
  expect(metadata.alternates?.canonical).toBe(absoluteUrl("/journal?category=design&page=2"));
  expect(metadata.openGraph?.url).toBe(absoluteUrl("/journal?category=design&page=2"));

  const page = await JournalPage({ searchParams });
  expect(mock.posts).toHaveBeenCalledWith(expect.objectContaining({
    where: { status: "PUBLISHED", category: { slug: "design" } }, skip: 12, take: 12,
  }));
  const html = renderToStaticMarkup(page);
  expect(html).toContain('href="/journal?category=design"');
  expect(html).toContain('href="/journal?category=design&amp;page=3"');
  expect(html).not.toContain("utm_source");
});

it("normalizes the root and filtered first page without a page parameter", async () => {
  expect(journalListHref(journalListParams({ page: "1", utm_campaign: "test" }))).toBe("/journal");
  expect(journalListHref(journalListParams({ category: "design", page: "1" }))).toBe("/journal?category=design");
  const metadata = await generateMetadata({ searchParams: Promise.resolve({ page: "2" }) });
  expect(metadata.alternates?.canonical).toBe(absoluteUrl("/journal?page=2"));
  const categoryMetadata = await generateMetadata({ searchParams: Promise.resolve({ category: "design", page: "1" }) });
  expect(categoryMetadata.alternates?.canonical).toBe(absoluteUrl("/journal?category=design"));
});

it.each(["abc", "0", "-1", "01", "10001", "9007199254740993"])("defaults malformed or overflowing page %s safely", value => {
  expect(journalListParams({ category: "design", page: value })).toEqual({ categorySlug: "design", page: 1 });
  expect(journalListHref(journalListParams({ category: "design", page: value }))).toBe("/journal?category=design");
});

it("drops repeated filters and safely URL-encodes a singleton category", async () => {
  expect(journalListParams({ category: ["Design", "News"], page: ["2", "3"] })).toEqual({ categorySlug: "", page: 1 });
  expect(journalListHref(journalListParams({ category: "Design & News", page: "2" }))).toBe("/journal?category=Design+%26+News&page=2");

  const searchParams = Promise.resolve({ category: ["design", "news"], page: "9007199254740993" });
  const metadata = await generateMetadata({ searchParams });
  expect(metadata.alternates?.canonical).toBe(absoluteUrl("/journal"));
  await JournalPage({ searchParams });
  expect(mock.posts).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PUBLISHED" }, skip: 0, take: 12 }));
});
