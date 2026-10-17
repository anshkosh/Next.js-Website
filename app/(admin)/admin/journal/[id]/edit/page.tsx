import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import JournalForm from "@/components/admin/JournalForm";

export const metadata = { title: "Edit Post — Journal Admin" };

export default async function EditJournalPostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/admin/dashboard");

  const [post, categories] = await Promise.all([
    db.journalPost.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        authorName: true,
        coverImageUrl: true,
        contentJson: true,
        contentHtml: true,
        status: true,
        scheduledAt: true,
        isFeatured: true,
        tags: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        canonicalUrl: true,
        categoryId: true,
      },
    }),
    db.journalCategory.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

  return (
    <div className="max-w-5xl mx-auto">
      <JournalForm
        categories={categories}
        post={{
          ...post,
          status: post.status,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
