// Pure staff-access rules (no Better Auth or Next imports, so they are unit-testable).
//
// Two-factor rules for /admin:
// - admins must have 2FA enabled (enrollment is forced before any admin work);
// - reviewers may opt in;
// - once an account has 2FA enabled, only a session created by a TOTP or
//   backup-code check counts. Google OAuth and pre-2FA sessions do not.

export const TWO_FACTOR_ISSUER = "Anshkosh";

export const STAFF_ROLES = ["admin", "reviewer"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** Better Auth endpoints that create a session only after a second factor was checked. */
export const TWO_FACTOR_VERIFY_PATHS = ["/two-factor/verify-totp", "/two-factor/verify-backup-code"] as const;

export type StaffSessionLike = {
  user: {
    role?: string | null;
    emailVerified?: boolean | null;
    banned?: boolean | null;
    twoFactorEnabled?: boolean | null;
  };
  session: { twoFactorVerified?: boolean | null };
} | null | undefined;

export type StaffAccessState = "ok" | "enroll" | "reauth" | "denied";

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "reviewer";
}

/**
 * Value for Session.twoFactorVerified when Better Auth creates a session.
 * A verify endpoint sets it; any other path keeps the value carried over from a
 * rotated session of the same user (Better Auth copies the old row when it
 * re-issues a session), and a brand-new session starts unverified.
 */
export function sessionTwoFactorVerified(path: string | undefined, session: object): boolean {
  if (path && (TWO_FACTOR_VERIFY_PATHS as readonly string[]).includes(path)) return true;
  return (session as { twoFactorVerified?: unknown }).twoFactorVerified === true;
}

/** Admins may not switch 2FA off themselves; another admin (or the CLI) resets it. */
export function blocksTwoFactorDisable(path: string | undefined, role: string | null | undefined): boolean {
  return path === "/two-factor/disable" && role === "admin";
}

export function staffAccessState(session: StaffSessionLike, options: { adminOnly?: boolean } = {}): StaffAccessState {
  const user = session?.user;
  if (!user?.emailVerified || user.banned) return "denied";
  if (options.adminOnly ? user.role !== "admin" : !isStaffRole(user.role)) return "denied";
  const enabled = user.twoFactorEnabled === true;
  if (user.role === "admin" && !enabled) return "enroll";
  if (enabled && session?.session.twoFactorVerified !== true) return "reauth";
  return "ok";
}

export function hasStaffAccess(session: StaffSessionLike, options: { adminOnly?: boolean } = {}): boolean {
  return staffAccessState(session, options) === "ok";
}

/**
 * The role this session may act with. A staff account whose session fails the
 * 2FA rules is treated as an ordinary user, so staff-only reads fall back to
 * public/owner access instead of erroring.
 */
export function effectiveRole(session: StaffSessionLike): string | null | undefined {
  const role = session?.user.role;
  if (!isStaffRole(role)) return role;
  return hasStaffAccess(session) ? role : "user";
}

/** session.user with its role replaced by effectiveRole(), for role-based read helpers. */
export function staffViewer<S extends NonNullable<StaffSessionLike>>(session: S | null | undefined): (S["user"] & { role: string | null | undefined }) | undefined {
  return session ? { ...session.user, role: effectiveRole(session) } : undefined;
}

export function staffAccessRedirect(state: Exclude<StaffAccessState, "ok">): string {
  if (state === "enroll") return "/admin/setup-2fa";
  if (state === "reauth") return "/admin/login/verify?reason=reauth";
  return "/admin/login";
}
