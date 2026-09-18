import { db } from "@/lib/db";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://anshkosh.com";

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
    { 
      url: `${BASE_URL}/`, 
      lastModified: new Date(), 
      changeFrequency: "daily", 
      priority: 1 
    },
    { url: `${BASE_URL}/discover`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${BASE_URL}/faq`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/trust-safety`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly" as const, priority: 0.5 },
    ...startups.map(s => ({
      url: `${BASE_URL}/startups/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.map(c => ({
      url: `${BASE_URL}/category/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    { 
      url: `${BASE_URL}/categories`, 
      changeFrequency: "monthly" as const, 
      priority: 0.5 
    },
    { url: `${BASE_URL}/journal`, changeFrequency: "daily" as const, priority: 0.8 },
    ...journalPosts.map(p => ({
      url: `${BASE_URL}/journal/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
