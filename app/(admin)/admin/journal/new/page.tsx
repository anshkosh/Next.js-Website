import { db } from "@/lib/db";
import JournalForm from "@/components/admin/JournalForm";
import { requireStaffPage } from "@/lib/staff-session";

export const metadata = { title: "New Post — Journal Admin" };

export default async function NewJournalPostPage() {
  await requireStaffPage({ adminOnly: true });

  const categories = await db.journalCategory.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <JournalForm categories={categories} />
    </div>
  );
}
