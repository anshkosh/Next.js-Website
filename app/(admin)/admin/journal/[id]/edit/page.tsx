import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import JournalForm from "@/components/admin/JournalForm";
import { requireStaffPage } from "@/lib/staff-session";

export const metadata = { title: "Edit Post — Journal Admin" };

export default async function EditJournalPostPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  await requireStaffPage({ adminOnly: true });

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
          status: post.status === "DRAFT" && post.scheduledAt ? "SCHEDULED" : post.status,
          scheduledAt: post.scheduledAt?.toISOString() ?? null,
        }}
      />
    </div>
  );
}
