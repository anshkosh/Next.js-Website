// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  blocksTwoFactorDisable, effectiveRole, hasStaffAccess, isBuiltInAdminEndpoint, sessionTwoFactorVerified,
  staffAccessRedirect, staffAccessState, staffViewer,
} from "../lib/staff-access";

const mock = vi.hoisted(() => ({ session: vi.fn(), revision: vi.fn(), user: vi.fn(), tx: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: { $transaction: (fn: (tx: unknown) => unknown) => mock.tx(fn) } }));
import { reviewRevision } from "../app/actions/revision.actions";
import { resetStaffTwoFactor } from "../app/actions/user.actions";

type Over = { role?: string; twoFactorEnabled?: boolean; twoFactorVerified?: boolean; emailVerified?: boolean; banned?: boolean };
const session = ({ role = "admin", twoFactorEnabled = false, twoFactorVerified = false, emailVerified = true, banned = false }: Over = {}) => ({
  user: { id: "me", name: "Me", email: "me@example.test", role, emailVerified, banned, twoFactorEnabled },
  session: { twoFactorVerified },
});

describe("staffAccessState", () => {
  it("forces an admin without two-factor to enroll", () => {
    expect(staffAccessState(session({ role: "admin" }))).toBe("enroll");
    expect(hasStaffAccess(session({ role: "admin" }))).toBe(false);
    expect(staffAccessRedirect("enroll")).toBe("/admin/setup-2fa");
  });
  it("lets a reviewer without two-factor in, as before", () => {
    expect(staffAccessState(session({ role: "reviewer" }))).toBe("ok");
  });
  it.each(["admin", "reviewer"])("asks a %s with two-factor on to re-authenticate when the session skipped the code", role => {
    expect(staffAccessState(session({ role, twoFactorEnabled: true }))).toBe("reauth");
    expect(staffAccessRedirect("reauth")).toBe("/admin/login/verify?reason=reauth");
  });
  it.each(["admin", "reviewer"])("accepts a %s session created by a two-factor check", role => {
    expect(staffAccessState(session({ role, twoFactorEnabled: true, twoFactorVerified: true }))).toBe("ok");
  });
  it("still denies unverified, banned and non-staff accounts", () => {
    expect(staffAccessState(session({ twoFactorEnabled: true, twoFactorVerified: true, emailVerified: false }))).toBe("denied");
    expect(staffAccessState(session({ twoFactorEnabled: true, twoFactorVerified: true, banned: true }))).toBe("denied");
    expect(staffAccessState(session({ role: "user" }))).toBe("denied");
    expect(staffAccessState(null)).toBe("denied");
  });
  it("applies adminOnly", () => {
    expect(hasStaffAccess(session({ role: "reviewer" }), { adminOnly: true })).toBe(false);
    expect(hasStaffAccess(session({ twoFactorEnabled: true, twoFactorVerified: true }), { adminOnly: true })).toBe(true);
  });
});

describe("effective role for staff-elevated reads", () => {
  it("downgrades staff whose session fails the two-factor rules", () => {
    expect(effectiveRole(session({ role: "admin" }))).toBe("user");
    expect(staffViewer(session({ role: "reviewer", twoFactorEnabled: true }))?.role).toBe("user");
  });
  it("keeps the role when access is fine, and leaves ordinary users alone", () => {
    expect(effectiveRole(session({ twoFactorEnabled: true, twoFactorVerified: true }))).toBe("admin");
    expect(effectiveRole(session({ role: "user" }))).toBe("user");
    expect(staffViewer(null)).toBeUndefined();
  });
});

describe("session flag", () => {
  it("marks only sessions created by the verify endpoints", () => {
    expect(sessionTwoFactorVerified("/two-factor/verify-totp", {})).toBe(true);
    expect(sessionTwoFactorVerified("/two-factor/verify-backup-code", {})).toBe(true);
    expect(sessionTwoFactorVerified("/sign-in/email", {})).toBe(false);
    expect(sessionTwoFactorVerified("/callback/google", {})).toBe(false);
    expect(sessionTwoFactorVerified(undefined, {})).toBe(false);
  });
  it("carries the flag over when Better Auth rotates an existing session", () => {
    expect(sessionTwoFactorVerified("/change-password", { twoFactorVerified: true })).toBe(true);
    expect(sessionTwoFactorVerified("/change-password", { twoFactorVerified: false })).toBe(false);
  });
});

it("blocks admins, not reviewers, from switching two-factor off", () => {
  expect(blocksTwoFactorDisable("/two-factor/disable", "admin")).toBe(true);
  expect(blocksTwoFactorDisable("/two-factor/disable", "reviewer")).toBe(false);
  expect(blocksTwoFactorDisable("/two-factor/enable", "admin")).toBe(false);
});

it("recognises Better Auth's built-in admin endpoints", () => {
  for (const path of ["/admin/set-role", "/admin/impersonate-user", "/admin/set-user-password", "/admin"]) {
    expect(isBuiltInAdminEndpoint(path)).toBe(true);
  }
  for (const path of ["/two-factor/verify-totp", "/sign-in/email", "/administrator", undefined]) {
    expect(isBuiltInAdminEndpoint(path)).toBe(false);
  }
});

describe("staff actions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("rejects a staff action from a session that skipped the second factor", async () => {
    mock.session.mockResolvedValue(session({ role: "reviewer", twoFactorEnabled: true }));
    expect(await reviewRevision("revision", "2026-10-02T01:00:00.000Z", "approve")).toEqual({ error: "Unauthorized" });
    expect(mock.tx).not.toHaveBeenCalled();
  });

  it("rejects a staff action from an admin who has not enrolled", async () => {
    mock.session.mockResolvedValue(session({ role: "admin" }));
    expect(await reviewRevision("revision", "2026-10-02T01:00:00.000Z", "approve")).toEqual({ error: "Unauthorized" });
  });

  it("lets an admin reset another staff member's two-factor with an audit record", async () => {
    mock.session.mockResolvedValue(session({ twoFactorEnabled: true, twoFactorVerified: true }));
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: "target", email: "t@example.test", role: "reviewer" }), update: vi.fn() },
      twoFactor: { deleteMany: vi.fn() },
      session: { deleteMany: vi.fn() },
      adminTwoFactorResetAudit: { create: vi.fn().mockResolvedValue({ id: "audit", createdAt: new Date() }) },
    };
    mock.tx.mockImplementation(fn => fn(tx));
    expect(await resetStaffTwoFactor("target", "Lost phone, confirmed by call")).toEqual({ success: true });
    expect(tx.twoFactor.deleteMany).toHaveBeenCalledWith({ where: { userId: "target" } });
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: "target" }, data: { twoFactorEnabled: false } });
    expect(tx.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "target" } });
    expect(tx.adminTwoFactorResetAudit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ operatorId: "me", targetUserId: "target", reason: "Lost phone, confirmed by call" }),
    }));
  });

  it("refuses self-resets, short reasons and reviewers", async () => {
    mock.session.mockResolvedValue(session({ twoFactorEnabled: true, twoFactorVerified: true }));
    expect((await resetStaffTwoFactor("me", "Lost my phone")).error).toMatch(/own/);
    expect((await resetStaffTwoFactor("target", "x")).error).toMatch(/reason/);
    mock.session.mockResolvedValue(session({ role: "reviewer" }));
    expect((await resetStaffTwoFactor("target", "Lost my phone")).error).toMatch(/Admin role required/);
    expect(mock.tx).not.toHaveBeenCalled();
  });
});
