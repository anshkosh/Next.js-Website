import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { hasStaffAccess, staffAccessRedirect, staffAccessState, type StaffRole } from "./staff-access";

export type AuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;
export type StaffSession = AuthSession & { user: AuthSession["user"] & { role: StaffRole } };

export async function getCurrentSession(): Promise<AuthSession | null> {
  return auth.api.getSession({ headers: await headers() });
}

/**
 * Session for staff server actions: verified, not banned, staff role (or admin
 * when adminOnly), and 2FA-verified where 2FA is required. Otherwise null.
 */
export async function getStaffSession(options: { adminOnly?: boolean } = {}): Promise<StaffSession | null> {
  const session = await getCurrentSession();
  return session && hasStaffAccess(session, options) ? (session as StaffSession) : null;
}

/**
 * Page guard for /admin. Sends unenrolled admins to enrollment and staff whose
 * session skipped the second factor to re-authentication. With adminOnly, a
 * reviewer who is otherwise fine is sent to `fallback`.
 */
export async function requireStaffPage(options: { adminOnly?: boolean; fallback?: string } = {}): Promise<StaffSession> {
  const session = await getCurrentSession();
  const state = staffAccessState(session);
  if (state !== "ok") redirect(staffAccessRedirect(state));
  if (options.adminOnly && session!.user.role !== "admin") redirect(options.fallback ?? "/admin/dashboard");
  return session as StaffSession;
}
