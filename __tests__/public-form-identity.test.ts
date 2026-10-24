// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ headers: vi.fn(), rate: vi.fn(), send: vi.fn(), comment: vi.fn(), request: vi.fn() }));
vi.mock("next/headers", () => ({ headers: mock.headers, cookies: async () => ({ get: () => undefined, set: vi.fn() }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/db", () => { const tx = {
  startup: { findUnique: async () => ({ id: "startup", slug: "startup" }) }, comment: { create: mock.comment },
  betaTesterProgram: { findFirst: async () => ({ id: "program", startup: { slug: "startup" } }) },
  betaTesterRequest: { findUnique: async () => null, create: mock.request },
  appSetting: { findUnique: async () => null },
  contentModeration: { upsert: vi.fn() },
  commenterBlock: { findUnique: async () => null },
}; return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } }; });
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: mock.rate, readRateLimit: async () => ({ allowed: true, available: true, retryAfterSeconds: 1 }) }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: async () => true }));
vi.mock("@/lib/email/adapter", () => ({ sendEmail: mock.send }));
vi.mock("@/lib/email/templates", () => ({ renderEmailTemplate: async () => "<p>Test</p>" }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
import { submitComment } from "@/app/actions/comment.actions";
import { submitContactForm } from "@/app/actions/contact.actions";
import { submitBetaTesterRequest } from "@/app/actions/beta-tester.actions";
const startupId = "cmvddwy1h0000zgy2oi9d66n3";
const calls = [
  () => submitComment({ startupId, authorName: "Tester", authorEmail: "tester@example.test", body: "Useful feedback", turnstileToken: "valid" }),
  () => submitContactForm({ name: "<b>Tester</b>", email: "tester@example.test", subject: "General", message: "A useful test message that exceeds twenty characters.", turnstileToken: "valid" }),
  () => submitBetaTesterRequest({ startupId, name: "Tester", email: "tester@example.test", message: "Interested", consent: true, adultConfirmed: true, turnstileToken: "valid" }),
];
beforeEach(() => { vi.clearAllMocks(); mock.send.mockResolvedValue(undefined); mock.comment.mockResolvedValue({ id: "cmvddwy1h0001zgy2oi9d66n4", authorName: "Tester", body: "Useful feedback", createdAt: new Date() }); });
it.each(calls)("rotating user-agent and client-prepended forwarded addresses cannot reset a public form budget", async action => {
  let attempts = 0; mock.rate.mockImplementation(async () => ++attempts <= 3);
  for (let index = 0; index < 5; index++) {
    mock.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.4", "x-forwarded-for": `198.51.100.${index}`, "user-agent": `bot-${index}` }));
    const result = await action();
    expect(Boolean(result.error)).toBe(index >= 3);
  }
  expect(mock.rate).toHaveBeenCalledTimes(5);
  expect(new Set(mock.rate.mock.calls.map(([key]) => key)).size).toBe(1);
  for (const [, limit, seconds] of mock.rate.mock.calls) { expect(limit).toBe(3); expect(seconds).toBe(3600); }
});
it("escapes user names in the contact auto-reply without sending external email", async () => {
  mock.rate.mockResolvedValue(true); mock.headers.mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.4" }));
  await calls[1]();
  const reply = mock.send.mock.calls.find(([payload]) => payload.to === "tester@example.test")?.[0];
  expect(reply.html).toContain("&lt;b&gt;Tester&lt;/b&gt;"); expect(reply.html).not.toContain("<b>Tester</b>");
});
