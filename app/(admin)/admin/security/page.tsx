import { db } from "@/lib/db";
import { requireStaffPage } from "@/lib/staff-session";
import TwoFactorSettings from "@/components/admin/TwoFactorSettings";

export const metadata = { title: "Security — Admin" };

export default async function AdminSecurityPage() {
  const session = await requireStaffPage();
  const hasPassword = (await db.account.count({ where: { userId: session.user.id, providerId: "credential" } })) > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Two-factor authentication</h1>
        <p className="mt-1 text-sm text-gray-600">
          {session.user.role === "admin" ? "Required for admin accounts." : "Optional for reviewers. Once on, every admin sign-in needs a code."}
        </p>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <TwoFactorSettings role={session.user.role} enabled={session.user.twoFactorEnabled === true} hasPassword={hasPassword} />
      </div>
    </div>
  );
}
