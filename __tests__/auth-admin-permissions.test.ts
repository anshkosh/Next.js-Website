// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { memoryAdapter } from "better-auth/adapters/memory";
import { accountAdminOptions, accountRoles } from "@/lib/auth-roles";

const data: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
const origin = "https://permissions.example.test";
const instance = betterAuth({
  baseURL: origin, secret: "isolated-permissions-test-secret-not-production",
  database: memoryAdapter(data), emailAndPassword: { enabled: true },
  plugins: [admin(accountAdminOptions)], rateLimit: { enabled: false }, logger: { disabled: true },
  advanced: { disableOriginCheck: false, disableCSRFCheck: false },
});
const cookies: Record<string, string> = {};
let targetId: string;

beforeAll(async () => {
  for (const role of ["admin", "reviewer", "user", "target"]) {
    const response = await instance.handler(new Request(`${origin}/api/auth/sign-up/email`, {
      method: "POST", headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ name: role, email: `${role}@example.test`, password: "isolated-fixture-password-only" }),
    }));
    expect(response.status).toBe(200);
    cookies[role] = response.headers.getSetCookie().map(cookie => cookie.split(";")[0]).join("; ");
    const user = data.user.find(user => user.email === `${role}@example.test`)!;
    user.role = role === "target" ? "user" : role;
    if (role === "target") targetId = String(user.id);
  }
}, 30000);

function request(role: string, path: string, body?: object) {
  return instance.handler(new Request(`${origin}/api/auth${path}`, {
    method: body ? "POST" : "GET", headers: { origin, cookie: cookies[role] ?? "", "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
}

describe("real account-management endpoints with production role configuration", () => {
  it.each([["admin", 200], ["reviewer", 403], ["user", 403], ["anonymous", 401]])(
    "%s gets %s from list-users, not an authorize() exception", async (role, status) => {
      expect((await request(String(role), "/admin/list-users")).status).toBe(status);
    },
  );
  it.each([["admin", 200], ["reviewer", 403], ["user", 403]])("%s has the intended session-listing permission", async (role, status) => {
    expect((await request(String(role), "/admin/list-user-sessions", { userId: targetId })).status).toBe(status);
  });
  it("allows an admin role change and blocks reviewer/user escalation", async () => {
    for (const role of ["reviewer", "user"]) {
      expect((await request(role, "/admin/set-role", { userId: targetId, role: "admin" })).status).toBe(403);
      expect(data.user.find(user => user.id === targetId)?.role).toBe("user");
    }
    expect((await request("admin", "/admin/set-role", { userId: targetId, role: "reviewer" })).status).toBe(200);
    expect(data.user.find(user => user.id === targetId)?.role).toBe("reviewer");
  });
  it("retains reviewer content permissions but not settings/account administration", () => {
    expect(accountRoles.reviewer.authorize({ startup: ["moderate"] }).success).toBe(true);
    expect(accountRoles.reviewer.authorize({ settings: ["update"] }).success).toBe(false);
    expect(accountRoles.reviewer.authorize({ user: ["set-role"] }).success).toBe(false);
  });
});
