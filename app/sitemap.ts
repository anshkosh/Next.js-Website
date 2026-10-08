import { db } from "@/lib/db";
import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { FOUNDER_TOOLS } from "@/lib/founder-toolkit";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/discover`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/trust-safety`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/launch-support`, changeFrequency: "monthly", priority: 0.5 },
    ...FOUNDER_TOOLS.map(tool => ({ url: `${SITE_URL}/launch-support/${tool.id}`, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: `${SITE_URL}/categories`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/journal`, changeFrequency: "daily", priority: 0.8 },
  ];

  if (!process.env.DATABASE_URL) return staticRoutes;

  const startups = await db.startup.findMany({
    where: { status: "LIVE" },
    select: { slug: true, updatedAt: true },
  });

  const categories = await db.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  const journalPosts = await db.journalPost.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  return [
    ...staticRoutes,
    ...startups.map(s => ({
      url: `${SITE_URL}/startups/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map(c => ({
      url: `${SITE_URL}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...journalPosts.map(p => ({
      url: `${SITE_URL}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
