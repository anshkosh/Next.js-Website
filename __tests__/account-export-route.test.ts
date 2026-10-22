// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ session: vi.fn(), limit: vi.fn(), export: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: m.limit }));
vi.mock("@/lib/account-privacy", async original => ({ ...await original<object>(), exportAccountData: m.export }));
import { POST } from "@/app/api/account/export/route";
const code = "a".repeat(32);
const request = (body: unknown = { code }, origin = "https://www.anshkosh.com") => new NextRequest("https://www.anshkosh.com/api/account/export", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); m.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, banned: false }, session: { id: "current" } });
  m.limit.mockResolvedValue(true); m.export.mockResolvedValue('{"account":{"id":"owner"}}');
});
afterEach(() => vi.unstubAllEnvs());
it("only downloads the current account, as a private JSON attachment", async () => {
  const result = await POST(request());
  expect(result.status).toBe(200);
  expect(result.headers.get("content-disposition")).toContain("attachment;");
  expect(result.headers.get("content-type")).toContain("application/json");
  expect(result.headers.get("cache-control")).toBe("private, no-store");
  expect(result.headers.get("x-content-type-options")).toBe("nosniff");
  expect(m.export).toHaveBeenCalledWith({ userId: "owner", sessionId: "current" }, code);
  expect(m.session).toHaveBeenCalledWith(expect.objectContaining({ query: { disableCookieCache: true } }));
});
it.each(["https://evil.example", "null", ""])("rejects an untrusted origin %s before loading the session", async origin => {
  expect((await POST(request({ code }, origin))).status).toBe(403);
  expect(m.session).not.toHaveBeenCalled(); expect(m.export).not.toHaveBeenCalled();
});
it("rejects an expired login before checking or exporting data", async () => {
  m.session.mockResolvedValue(null);
  expect((await POST(request())).status).toBe(401); expect(m.export).not.toHaveBeenCalled();
});
it("fails closed when rate protection is unavailable or exhausted", async () => {
  m.limit.mockResolvedValue(false);
  expect((await POST(request())).status).toBe(429); expect(m.export).not.toHaveBeenCalled();
});
it.each([{ code, userId: "another" }, { code: "bad" }, { code, password: "unneeded" }])("rejects malformed or extra request fields", async body => {
  expect((await POST(request(body))).status).toBe(400); expect(m.export).not.toHaveBeenCalled();
});
it("bounds the request body even without a content-length header", async () => {
  expect((await POST(request({ code: "a".repeat(2048) }))).status).toBe(413); expect(m.export).not.toHaveBeenCalled();
});
it("does not expose database or credential-bearing errors", async () => {
  m.export.mockRejectedValue(new Error("postgresql://private-user:private-value@database/secret"));
  const result = await POST(request());
  expect(result.status).toBe(500); expect(await result.text()).not.toContain("private-value");
  expect(result.headers.get("cache-control")).toBe("private, no-store");
});
it("never trusts loopback origins in production", async () => {
  vi.stubEnv("NODE_ENV", "production");
  const result = await POST(new NextRequest("http://127.0.0.1:3100/api/account/export", { method: "POST", headers: { origin: "http://127.0.0.1:3100" }, body: JSON.stringify({ code }) }));
  expect(result.status).toBe(403);
});
it("accepts the explicitly configured loopback browser when Next reports localhost", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3100");
  const result = await POST(new NextRequest("http://localhost:3100/api/account/export", { method: "POST", headers: { origin: "http://127.0.0.1:3100", "content-type": "application/json" }, body: JSON.stringify({ code }) }));
  expect(result.status).toBe(200);
});
it("does not add arbitrary configured origins in development", async () => {
  vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("BETTER_AUTH_URL", "https://evil.example");
  expect((await POST(request({ code }, "https://evil.example"))).status).toBe(403);
  expect(m.export).not.toHaveBeenCalled();
});
