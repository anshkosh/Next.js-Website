import { afterEach, expect, it, vi } from "vitest";

const { findCategory, findCategories, findStartups, findJournalPosts, findFounderEntries } = vi.hoisted(() => ({
  findCategory: vi.fn(),
  findCategories: vi.fn(),
  findStartups: vi.fn(),
  findJournalPosts: vi.fn(),
  findFounderEntries: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    category: { findUnique: findCategory, findMany: findCategories },
    startup: { findMany: findStartups },
    journalPost: { findMany: findJournalPosts },
    founderJournalEntry: { findMany: findFounderEntries },
  },
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND_404"); } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it("marks an empty category noindex while allowing links to be followed", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  findCategory.mockResolvedValue({ name: "FoodTech", description: null, startups: [] });

  const { generateMetadata } = await import("../app/(public)/category/[slug]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "foodtech" }) });

  expect(findCategory).toHaveBeenCalledWith(expect.objectContaining({
    where: { slug: "foodtech" },
    select: expect.objectContaining({
      startups: expect.objectContaining({
        where: { status: "LIVE", founder: { founderMode: true } },
      }),
    }),
  }));
  expect(metadata.robots).toEqual({ index: false, follow: true });
});

it("keeps a category indexable when it has a public startup", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  findCategory.mockResolvedValue({ name: "FoodTech", description: null, startups: [{ id: "public-startup" }] });

  const { generateMetadata } = await import("../app/(public)/category/[slug]/page");
  const metadata = await generateMetadata({ params: Promise.resolve({ slug: "foodtech" }) });

  expect(metadata.robots).toBeUndefined();
});

it("queries the sitemap only for categories containing public startups", async () => {
  vi.stubEnv("DATABASE_URL", "postgresql://test.example/db");
  findCategories.mockImplementation(async (query: { where?: { startups?: { some?: unknown } } }) => {
    const publicCategory = { slug: "foodtech", updatedAt: new Date("2026-10-01T00:00:00Z") };
    return query.where?.startups?.some
      ? [publicCategory]
      : [publicCategory, { slug: "empty-category", updatedAt: publicCategory.updatedAt }];
  });
  findStartups.mockResolvedValue([]);
  findJournalPosts.mockResolvedValue([]);
  findFounderEntries.mockResolvedValue([]);

  const { default: sitemap } = await import("../app/sitemap");
  const entries = await sitemap();

  expect(findCategories).toHaveBeenCalledWith({
    where: { startups: { some: { status: "LIVE", founder: { founderMode: true } } } },
    select: { slug: true, updatedAt: true },
  });
  expect(entries.some(entry => entry.url === "https://www.anshkosh.com/category/foodtech")).toBe(true);
  expect(entries.some(entry => entry.url === "https://www.anshkosh.com/category/empty-category")).toBe(false);
});
