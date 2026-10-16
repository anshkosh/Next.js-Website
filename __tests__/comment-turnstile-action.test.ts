// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const mock = vi.hoisted(() => ({ verify: vi.fn(), limit: vi.fn(), startup: vi.fn(), create: vi.fn(), cache: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { startup: { findUnique: mock.startup }, comment: { create: mock.create } } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: mock.verify }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: mock.limit }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "192.0.2.2", "user-agent": "Comment test" }) }));
vi.mock("next/cache", () => ({ revalidatePath: mock.cache }));
import { submitComment } from "../app/actions/comment.actions";

const input = { startupId: "cmvajoncw0001zgxyg2kloy8o", authorName: "Test visitor", authorEmail: "visitor@example.test", body: "A useful question about this startup.", turnstileToken: "" };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", undefined);
  mock.verify.mockResolvedValue(true);
  mock.limit.mockResolvedValue(true);
  mock.startup.mockResolvedValue({ id: input.startupId, slug: "example" });
  mock.create.mockResolvedValue({ id: "comment" });
});
afterEach(() => vi.unstubAllEnvs());

it("requires CAPTCHA by default before any comment can be stored", async () => {
  expect(await submitComment(input)).toEqual({ error: "Please complete the CAPTCHA challenge." });
  expect(mock.create).not.toHaveBeenCalled();
});
it("does not accept an invalid token when CAPTCHA is enabled", async () => {
  mock.verify.mockResolvedValue(false);
  expect(await submitComment({ ...input, turnstileToken: "invalid" })).toHaveProperty("error");
  expect(mock.create).not.toHaveBeenCalled();
});
it("does not treat other flag values or request properties as permission to bypass CAPTCHA", async () => {
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", "0");
  expect(await submitComment({ ...input, turnstileEnabled: false } as typeof input)).toHaveProperty("error");
  expect(mock.create).not.toHaveBeenCalled();
});
it("accepts a tokenless comment only during the explicit server pause and retains moderation and rate limits", async () => {
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", "false");
  expect(await submitComment(input)).toEqual({ success: true });
  expect(mock.verify).not.toHaveBeenCalled();
  expect(mock.limit).toHaveBeenCalledWith(expect.stringMatching(/^rate-limit:comment:/), 3, 3600);
  expect(mock.startup).toHaveBeenCalledWith(expect.objectContaining({ where: { id: input.startupId, status: "LIVE" } }));
  expect(mock.create).toHaveBeenCalledWith({ data: { startupId: input.startupId, authorName: input.authorName, authorEmail: input.authorEmail, body: input.body, status: "PENDING" } });
});
it("still blocks excessive comments while CAPTCHA is paused", async () => {
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", "false");
  mock.limit.mockResolvedValue(false);
  expect(await submitComment(input)).toHaveProperty("error");
  expect(mock.create).not.toHaveBeenCalled();
});
it("still rejects unpublished startups while CAPTCHA is paused", async () => {
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", "false");
  mock.startup.mockResolvedValue(null);
  expect(await submitComment(input)).toEqual({ error: "Startup not found." });
  expect(mock.create).not.toHaveBeenCalled();
});
it("still validates comment fields while CAPTCHA is paused", async () => {
  vi.stubEnv("COMMENTS_TURNSTILE_ENABLED", "false");
  expect(await submitComment({ ...input, authorEmail: "invalid", body: "x" })).toHaveProperty("error");
  expect(mock.limit).not.toHaveBeenCalled();
  expect(mock.create).not.toHaveBeenCalled();
});
