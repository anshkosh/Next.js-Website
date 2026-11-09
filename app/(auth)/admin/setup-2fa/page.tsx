import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/staff-session";
import { isStaffRole, staffAccessRedirect, staffAccessState } from "@/lib/staff-access";
import AdminAuthShell from "@/components/admin/AdminAuthShell";
import TwoFactorSettings from "@/components/admin/TwoFactorSettings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up two-factor authentication" };

// Lives outside the (admin) layout so an admin without 2FA can reach it.
export default async function AdminTwoFactorSetupPage() {
  const session = await getCurrentSession();
  const state = staffAccessState(session);
  if (state === "denied" || state === "reauth") redirect(staffAccessRedirect(state));
  if (session!.user.twoFactorEnabled || !isStaffRole(session!.user.role)) redirect("/admin/dashboard");

  const hasPassword = (await db.account.count({ where: { userId: session!.user.id, providerId: "credential" } })) > 0;
  const required = session!.user.role === "admin";

  return (
    <AdminAuthShell
      wide
      title="Set up two-factor"
      subtitle={required ? "Required for admin accounts before you can open the admin panel" : "Protect your reviewer account with Google Authenticator"}
    >
      <TwoFactorSettings role={session!.user.role!} enabled={false} hasPassword={hasPassword} tone="dark" doneHref="/admin/dashboard" />
    </AdminAuthShell>
  );
}
