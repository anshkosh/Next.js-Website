"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/logger";
import { calculateReadingTime } from "@/lib/journal-reading-time.mjs";
import { parseJournalSchedule } from "@/lib/journal-scheduling";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateExcerpt(html: string, maxLength = 160): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.substring(0, maxLength).trimEnd() + "…" : text;
}

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Journal Post Actions
// ---------------------------------------------------------------------------

export async function createJournalPost(formData: FormData) {
  try {
    await requireAdmin();

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: "Title is required" };

    const rawSlug = (formData.get("slug") as string)?.trim();
    const slug = rawSlug ? generateSlug(rawSlug) : generateSlug(title);

    const contentHtml = (formData.get("contentHtml") as string) || "";
    const contentJsonRaw = formData.get("contentJson") as string;
    const contentJson = contentJsonRaw ? JSON.parse(contentJsonRaw) : null;

    const excerpt = (formData.get("excerpt") as string)?.trim() || null;
    const authorName = (formData.get("authorName") as string)?.trim() || "Anshkosh Team";
    const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
    const categoryId = (formData.get("categoryId") as string) || null;
    const isFeatured = formData.get("isFeatured") === "true";
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const metaKeywordsRaw = formData.get("metaKeywords") as string;
    const metaKeywords = metaKeywordsRaw ? JSON.parse(metaKeywordsRaw) : [];

    const readingTimeMinutes = contentHtml ? calculateReadingTime(contentHtml) : 1;
    const autoExcerpt = contentHtml ? generateExcerpt(contentHtml) : null;

    // Check slug uniqueness
    const existing = await db.journalPost.findUnique({ where: { slug } });
    if (existing) {
      return { error: "A post with this slug already exists. Please use a different slug." };
    }

    const post = await db.journalPost.create({
      data: {
        title,
        slug,
        excerpt: excerpt || autoExcerpt,
        authorName,
        coverImageUrl,
        contentJson,
        contentHtml,
        isFeatured,
        tags,
        readingTimeMinutes,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDescription: (formData.get("metaDescription") as string) || null,
        metaKeywords,
        canonicalUrl: (formData.get("canonicalUrl") as string) || null,
        categoryId,
        status: "DRAFT",
      },
    });

    revalidatePath("/admin/journal");
    revalidatePath("/journal");

    return { success: true, id: post.id, slug: post.slug };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Create journal post error:", error);
    return { error: "Failed to create post" };
  }
}

export async function updateJournalPost(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const title = (formData.get("title") as string)?.trim();
    if (!title) return { error: "Title is required" };

    const rawSlug = (formData.get("slug") as string)?.trim();
    const slug = rawSlug ? generateSlug(rawSlug) : generateSlug(title);

    const contentHtml = (formData.get("contentHtml") as string) || "";
    const contentJsonRaw = formData.get("contentJson") as string;
    const contentJson = contentJsonRaw ? JSON.parse(contentJsonRaw) : null;

    const excerpt = (formData.get("excerpt") as string)?.trim() || null;
    const authorName = (formData.get("authorName") as string)?.trim() || "Anshkosh Team";
    const coverImageUrl = (formData.get("coverImageUrl") as string) || null;
    const categoryId = (formData.get("categoryId") as string) || null;
    const isFeatured = formData.get("isFeatured") === "true";
    const tagsRaw = formData.get("tags") as string;
    const tags = tagsRaw ? JSON.parse(tagsRaw) : [];
    const metaKeywordsRaw = formData.get("metaKeywords") as string;
    const metaKeywords = metaKeywordsRaw ? JSON.parse(metaKeywordsRaw) : [];

    const readingTimeMinutes = contentHtml ? calculateReadingTime(contentHtml) : 1;
    const autoExcerpt = contentHtml ? generateExcerpt(contentHtml) : null;

    // Check slug uniqueness (excluding current post)
    const existing = await db.journalPost.findFirst({
      where: { slug, NOT: { id } },
    });
    if (existing) {
      return { error: "A post with this slug already exists. Please use a different slug." };
    }

    const post = await db.journalPost.update({
      where: { id },
      data: {
        title,
        slug,
        excerpt: excerpt || autoExcerpt,
        authorName,
        coverImageUrl,
        contentJson,
        contentHtml,
        isFeatured,
        tags,
        readingTimeMinutes,
        metaTitle: (formData.get("metaTitle") as string) || null,
        metaDescription: (formData.get("metaDescription") as string) || null,
        metaKeywords,
        canonicalUrl: (formData.get("canonicalUrl") as string) || null,
        categoryId,
      },
    });

    revalidatePath("/admin/journal");
    revalidatePath(`/admin/journal/${id}/edit`);
    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);

    return { success: true, slug: post.slug };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Update journal post error:", error);
    return { error: "Failed to update post" };
  }
}

export async function publishJournalPost(id: string) {
  try {
    await requireAdmin();

    const post = await db.journalPost.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        scheduledAt: null,
      },
    });

    revalidatePath("/admin/journal");
    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Publish journal post error:", error);
    return { error: "Failed to publish post" };
  }
}

export async function unpublishJournalPost(id: string) {
  try {
    await requireAdmin();

    const post = await db.journalPost.update({
      where: { id },
      data: {
        status: "DRAFT",
        publishedAt: null,
        scheduledAt: null,
      },
    });

    revalidatePath("/admin/journal");
    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Unpublish journal post error:", error);
    return { error: "Failed to unpublish post" };
  }
}

export async function scheduleJournalPost(id: string, when: string) {
  try {
    await requireAdmin();
    const scheduledAt = parseJournalSchedule(when);
    const post = await db.journalPost.findUnique({ where: { id }, select: { slug: true, status: true } });
    if (!post || post.status === "PUBLISHED") return { error: "Only drafts or scheduled posts can be scheduled. Unpublish a live post first." };
    const result = await db.journalPost.updateMany({ where: { id, status: { in: ["DRAFT", "SCHEDULED"] } }, data: { status: "SCHEDULED", scheduledAt, publishedAt: null } });
    if (result.count !== 1) return { error: "Post changed. Refresh before scheduling." };
    revalidatePath("/admin/journal"); revalidatePath(`/admin/journal/${id}/edit`); revalidatePath("/journal"); revalidatePath("/sitemap.xml");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error && (error.message === "Unauthorized" || error.message.startsWith("Choose a")) ? error.message : "The post could not be scheduled. Please try again." };
  }
}

export async function deleteJournalPost(id: string) {
  try {
    await requireAdmin();

    const post = await db.journalPost.findUnique({ where: { id }, select: { slug: true } });
    if (!post) return { error: "Post not found" };

    await db.journalPost.delete({ where: { id } });

    revalidatePath("/admin/journal");
    revalidatePath("/journal");
    revalidatePath(`/journal/${post.slug}`);

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Delete journal post error:", error);
    return { error: "Failed to delete post" };
  }
}

// ---------------------------------------------------------------------------
// Journal Category Actions
// ---------------------------------------------------------------------------

export async function createJournalCategory(data: {
  name: string;
  description?: string;
  sortOrder?: number;
}) {
  try {
    await requireAdmin();

    const { name, description, sortOrder = 0 } = data;
    if (!name?.trim()) return { error: "Category name is required" };

    const slug = generateSlug(name);

    const existing = await db.journalCategory.findUnique({ where: { slug } });
    if (existing) return { error: "A category with this name already exists" };

    const category = await db.journalCategory.create({
      data: { name: name.trim(), slug, description: description?.trim() || null, sortOrder },
    });

    revalidatePath("/admin/journal/categories");
    revalidatePath("/journal");

    return { success: true, id: category.id };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Create journal category error:", error);
    return { error: "Failed to create category" };
  }
}

export async function updateJournalCategory(
  id: string,
  data: { name: string; description?: string; sortOrder?: number }
) {
  try {
    await requireAdmin();

    const { name, description, sortOrder } = data;
    if (!name?.trim()) return { error: "Category name is required" };

    await db.journalCategory.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    revalidatePath("/admin/journal/categories");
    revalidatePath("/journal");

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Update journal category error:", error);
    return { error: "Failed to update category" };
  }
}

export async function deleteJournalCategory(id: string) {
  try {
    await requireAdmin();

    // Check for linked posts
    const postCount = await db.journalPost.count({ where: { categoryId: id } });
    if (postCount > 0) {
      return {
        error: `Cannot delete category — ${postCount} post${postCount > 1 ? "s are" : " is"} using it. Reassign posts first.`,
      };
    }

    await db.journalCategory.delete({ where: { id } });

    revalidatePath("/admin/journal/categories");

    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return { error: "Unauthorized" };
    }
    logger.error("Delete journal category error:", error);
    return { error: "Failed to delete category" };
  }
}
