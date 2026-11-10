// @vitest-environment node
import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin, twoFactor } from "better-auth/plugins";
import { memoryAdapter } from "better-auth/adapters/memory";
import { accountAdminOptions } from "@/lib/auth-roles";
import { authIpAddressOptions, staffAuthHooks, staffDatabaseHooks, staffSessionOptions } from "@/lib/auth-staff-guard";

// Real Better Auth endpoints with the production staff two-factor options.
type Row = Record<string, unknown>;
const data: Record<string, Row[]> = { user: [], session: [], account: [], verification: [], twoFactor: [] };
const origin = "https://staff-guard.example.test";
const password = "isolated-fixture-password-only";
const instance = betterAuth({
  baseURL: origin, secret: "isolated-staff-guard-test-secret-not-production",
  database: memoryAdapter(data), emailAndPassword: { enabled: true },
  session: staffSessionOptions, databaseHooks: staffDatabaseHooks, hooks: staffAuthHooks,
  plugins: [admin(accountAdminOptions), twoFactor({ issuer: "Anshkosh" })],
  rateLimit: { enabled: false }, logger: { disabled: true },
});

const jars: Record<string, Map<string, string>> = {};
async function request(who: string, path: string, body?: object) {
  const jar = (jars[who] ??= new Map());
  const response = await instance.handler(new Request(`${origin}/api/auth${path}`, {
    method: body ? "POST" : "GET",
    headers: { origin, cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "), "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }));
  for (const cookie of response.headers.getSetCookie()) {
    const [pair, ...attributes] = cookie.split(";");
    const [name, ...value] = pair.split("=");
    if (attributes.some(attribute => /max-age=0/i.test(attribute)) || !value.join("=")) jar.delete(name); else jar.set(name, value.join("="));
  }
  return response;
}
const userRow = (who: string) => data.user.find(user => user.email === `${who}@example.test`)!;
const sessionRows = (who: string) => data.session.filter(session => session.userId === userRow(who).id);
function setVerified(who: string, value: boolean) { for (const session of sessionRows(who)) session.twoFactorVerified = value; }

// RFC 6238 code from an otpauth:// URI, as an authenticator app computes it.
function totp(uri: string) {
  const secret = new URL(uri).searchParams.get("secret")!;
  let bits = "";
  for (const char of secret) bits += "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".indexOf(char).toString(2).padStart(5, "0");
  const key = Buffer.from((bits.match(/.{8}/g) ?? []).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

beforeAll(async () => {
  for (const who of ["admin", "reviewer", "target"]) {
    const response = await request(who, "/sign-up/email", { name: who, email: `${who}@example.test`, password });
    expect(response.status).toBe(200);
    Object.assign(userRow(who), { role: who === "target" ? "user" : who, emailVerified: true });
  }
}, 30000);

describe("Better Auth admin API follows the staff two-factor rules", () => {
  it("refuses an admin who has not enrolled", async () => {
    expect((await request("admin", "/admin/list-users")).status).toBe(403);
    expect((await request("admin", "/admin/set-role", { userId: userRow("target").id, role: "admin" })).status).toBe(403);
    expect((await request("admin", "/admin/set-user-password", { userId: userRow("target").id, newPassword: "attacker-chosen-password" })).status).toBe(403);
    expect((await request("admin", "/admin/impersonate-user", { userId: userRow("target").id })).status).toBe(403);
    expect(userRow("target").role).toBe("user");
  });

  it("refuses an enrolled admin whose session skipped the code, and allows one that passed it", async () => {
    userRow("admin").twoFactorEnabled = true;
    expect(sessionRows("admin").every(session => session.twoFactorVerified === false)).toBe(true);
    expect((await request("admin", "/admin/list-users")).status).toBe(403);
    setVerified("admin", true);
    expect((await request("admin", "/admin/list-users")).status).toBe(200);
    expect((await request("admin", "/admin/set-role", { userId: userRow("target").id, role: "reviewer" })).status).toBe(200);
    expect(userRow("target").role).toBe("reviewer");
  });

  it("never lets an admin switch two-factor off", async () => {
    const response = await request("admin", "/two-factor/disable", { password });
    expect(response.status).toBe(403);
    expect(userRow("admin").twoFactorEnabled).toBe(true);
  });

  it("still answers anonymous callers without a session", async () => {
    expect((await request("anonymous", "/admin/list-users")).status).toBe(403);
  });
});

describe("two-factor sign-in and management", () => {
  let uri = "";

  it("marks only sessions created by a code check as verified", async () => {
    const enabled = await request("reviewer", "/two-factor/enable", { password });
    expect(enabled.status).toBe(200);
    uri = (await enabled.json()).totpURI;
    expect(sessionRows("reviewer").some(session => session.twoFactorVerified)).toBe(false);

    expect((await request("reviewer", "/two-factor/verify-totp", { code: totp(uri) })).status).toBe(200);
    expect(userRow("reviewer").twoFactorEnabled).toBe(true);
    expect(sessionRows("reviewer").map(session => session.twoFactorVerified)).toEqual([true]);

    expect((await request("reviewer", "/sign-out", {})).status).toBe(200);
    const signIn = await request("reviewer", "/sign-in/email", { email: "reviewer@example.test", password });
    expect(await signIn.json()).toMatchObject({ twoFactorRedirect: true });
    expect(sessionRows("reviewer")).toHaveLength(0);
    expect((await request("reviewer", "/two-factor/verify-totp", { code: totp(uri) })).status).toBe(200);
    expect(sessionRows("reviewer").map(session => session.twoFactorVerified)).toEqual([true]);
  });

  it("needs a verified session to mint backup codes, read the secret or switch two-factor off", async () => {
    setVerified("reviewer", false); // what a Google sign-in on this account would hold
    for (const path of ["/two-factor/generate-backup-codes", "/two-factor/get-totp-uri", "/two-factor/disable"]) {
      expect((await request("reviewer", path, { password })).status, path).toBe(403);
    }
    expect(userRow("reviewer").twoFactorEnabled).toBe(true);

    setVerified("reviewer", true);
    expect((await request("reviewer", "/two-factor/generate-backup-codes", { password })).status).toBe(200);
    expect((await request("reviewer", "/two-factor/disable", { password })).status).toBe(200);
    expect(userRow("reviewer").twoFactorEnabled).toBe(false);
  });
});

describe("sign-in rate limiting", () => {
  it("keys on nginx's X-Real-IP, not a multi-hop X-Forwarded-For", async () => {
    const limited = betterAuth({
      baseURL: origin, secret: "isolated-staff-guard-test-secret-not-production",
      database: memoryAdapter({ user: [], session: [], account: [], verification: [], rateLimit: [] }),
      emailAndPassword: { enabled: true }, logger: { disabled: true },
      rateLimit: { enabled: true, window: 60, max: 2 },
      advanced: { ipAddress: authIpAddressOptions },
    });
    const ask = (ip: string) => limited.handler(new Request(`${origin}/api/auth/ok`, {
      headers: { origin, "x-real-ip": ip, "x-forwarded-for": `198.51.100.7, ${ip}` },
    })).then(response => response.status);
    expect([await ask("203.0.113.1"), await ask("203.0.113.1"), await ask("203.0.113.1")]).toEqual([200, 200, 429]);
    // A second visitor behind the same proxy chain shape is not throttled by the first.
    expect(await ask("203.0.113.2")).toBe(200);
  });
});
