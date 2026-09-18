import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import JournalForm from "@/components/admin/JournalForm";

export const metadata = { title: "New Post — Journal Admin" };

export default async function NewJournalPostPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") redirect("/admin/dashboard");

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
