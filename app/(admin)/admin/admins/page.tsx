import { db } from "@/lib/db";
import AdminManager from "./AdminManager";
import { requireStaffPage } from "@/lib/staff-session";

export default async function AdminUsersPage() {
  const session = await requireStaffPage({ adminOnly: true });

  const admins = await db.user.findMany({
    where: {
      role: {
        in: ["admin", "reviewer"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold font-heading">Admin Users</h1>
      </div>

      <AdminManager admins={admins} currentUserId={session.user.id} />
    </div>
  );
}
