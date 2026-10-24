import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user.emailVerified || session.user.banned || (session.user.role !== "admin" && session.user.role !== "reviewer")) {
    redirect("/admin/login");
  }

  const role = session.user.role;

  const pendingReviewCount = await db.startup.count({
    where: { status: "PENDING_REVIEW" },
  });

  const pendingCommentCount = await db.comment.count({
    where: { status: "PENDING" },
  });
  const contentReviewCount = await db.contentModeration.count({
    where: { OR: [
      { kind: { not: "JOURNAL" }, status: { in: ["PENDING", "CHECKING", "FLAGGED", "UNAVAILABLE"] } },
      { kind: "JOURNAL", status: "SAFE", revision: { status: "PENDING_REVIEW", entry: { visibility: "PUBLIC" } } },
    ] },
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar role={role} pendingReviewCount={pendingReviewCount} pendingCommentCount={pendingCommentCount} contentReviewCount={contentReviewCount} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminTopbar user={{ name: session.user.name, role: session.user.role }} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
