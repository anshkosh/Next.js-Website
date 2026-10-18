// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ rate: vi.fn(), captcha: vi.fn(), find: vi.fn(), upsert: vi.fn(), update: vi.fn(), create: vi.fn(), pending: vi.fn(), remove: vi.fn(), queue: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "192.0.2.1" }) }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: mock.rate }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: mock.captcha }));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: mock.queue } }));
vi.mock("@/lib/db", () => {
  const tx = { newsletterSubscriber: { findFirst: mock.find, upsert: mock.upsert, updateMany: mock.update }, verification: { create: mock.create, findFirst: mock.pending, deleteMany: mock.remove }, $queryRaw: vi.fn() };
  return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
import { subscribeToNewsletter, confirmNewsletter, unsubscribeNewsletter } from "@/app/actions/newsletter.actions";
import { newsletterHash, activeNewsletterWhere, NEWSLETTER_CONSENT_VERSION } from "@/lib/newsletter";
const token = "a".repeat(64);
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("DATABASE_URL", "test-only-not-connected");
  mock.rate.mockResolvedValue(true); mock.captcha.mockResolvedValue(true); mock.find.mockResolvedValue(null);
  mock.create.mockResolvedValue({ id: "verification" }); mock.queue.mockResolvedValue({}); mock.remove.mockResolvedValue({ count: 1 });
});
afterEach(() => vi.unstubAllEnvs());
it.each(["person@example.test", { email: "bad", consent: true, token: "captcha" }, { email: "person@example.test", consent: false, token: "captcha" }])("rejects invalid/unconsented requests before writes", async input => {
  expect(await subscribeToNewsletter(input)).toHaveProperty("error"); expect(mock.create).not.toHaveBeenCalled();
});
it("limits before sending and does not enroll a submitted third-party email", async () => {
  const result = await subscribeToNewsletter({ email: " Person@example.test ", consent: true, token: "captcha" });
  expect(result).toEqual({}); expect(mock.upsert).not.toHaveBeenCalled();
  expect(mock.rate).toHaveBeenCalledWith(expect.stringMatching(/^newsletter:ip:/), 3, 3600);
  expect(mock.rate).toHaveBeenCalledWith(expect.stringMatching(/^newsletter:email:/), 1, 86400);
  const pending = mock.create.mock.calls[0][0].data;
  const message = mock.queue.mock.calls[0][1]; const raw = new URL(message.data.confirmationUrl).searchParams.get("token")!;
  expect(pending.identifier).toBe(`newsletter:${newsletterHash(raw)}`);
  expect(pending.value).not.toContain(raw);
  expect(JSON.parse(pending.value)).toMatchObject({ email: "person@example.test", consentVersion: NEWSLETTER_CONSENT_VERSION });
  expect(pending.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(86400000);
});
it("does not write or send when rate protection or CAPTCHA denies a request", async () => {
  mock.rate.mockResolvedValueOnce(false);
  expect(await subscribeToNewsletter({ email: "person@example.test", consent: true, token: "captcha" })).toHaveProperty("error");
  mock.captcha.mockResolvedValueOnce(false);
  expect(await subscribeToNewsletter({ email: "person@example.test", consent: true, token: "captcha" })).toHaveProperty("error");
  expect(mock.create).not.toHaveBeenCalled(); expect(mock.queue).not.toHaveBeenCalled();
});
it("never activates an expired or malformed token", async () => {
  mock.pending.mockResolvedValue(null);
  expect(await confirmNewsletter("invalid")).toHaveProperty("error");
  expect(await confirmNewsletter(token)).toHaveProperty("error");
  expect(mock.pending).toHaveBeenCalledWith({ where: { identifier: `newsletter:${newsletterHash(token)}`, expiresAt: { gt: expect.any(Date) } } });
  expect(mock.upsert).not.toHaveBeenCalled();
});
it("consumes confirmation atomically and records consent, without a login", async () => {
  mock.pending.mockResolvedValue({ id: "pending", value: JSON.stringify({ email: "person@example.test", consentVersion: NEWSLETTER_CONSENT_VERSION, requestedAt: "2026-10-18T10:00:00.000Z" }) });
  expect(await confirmNewsletter(token)).toEqual({ success: true });
  expect(mock.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ confirmedAt: expect.any(Date), consentVersion: NEWSLETTER_CONSENT_VERSION, unsubscribeTokenHash: newsletterHash(token) }) }));
  expect(mock.remove).toHaveBeenCalledWith({ where: { id: "pending" } });
});
it("makes confirmation retries idempotent, but does not reactivate a withdrawn address", async () => {
  mock.pending.mockResolvedValue(null); mock.find.mockResolvedValueOnce({ id: "confirmed" });
  expect(await confirmNewsletter(token)).toEqual({ success: true });
  expect(mock.find).toHaveBeenCalledWith({ where: { unsubscribeTokenHash: newsletterHash(token), ...activeNewsletterWhere }, select: { id: true } });
  mock.find.mockResolvedValueOnce(null);
  expect(await confirmNewsletter(token)).toHaveProperty("error"); expect(mock.upsert).not.toHaveBeenCalled();
});
it("withdraws consent using only the secret link and excludes unconfirmed/withdrawn recipients", async () => {
  expect(await unsubscribeNewsletter(token)).toEqual({ success: true });
  expect(mock.update).toHaveBeenCalledWith({ where: { unsubscribeTokenHash: newsletterHash(token), unsubscribedAt: null }, data: { unsubscribedAt: expect.any(Date) } });
  expect(activeNewsletterWhere).toEqual({ confirmedAt: { not: null }, unsubscribedAt: null });
});
