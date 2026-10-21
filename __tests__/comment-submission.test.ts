// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { addCommentReceipt, readCommentReceipts, COMMENT_RECEIPT_COOKIE } from "../lib/comment-receipts";

const mock = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn(), startup: vi.fn(), readLimit: vi.fn(), consume: vi.fn(), verify: vi.fn(), revalidate: vi.fn(), warn: vi.fn(), getCookie: vi.fn(), setCookie: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { comment: { create: mock.create, findMany: mock.findMany }, startup: { findUnique: mock.startup } } }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-real-ip": "192.0.2.1" }), cookies: async () => ({ get: mock.getCookie, set: mock.setCookie }) }));
vi.mock("@/lib/utils/rate-limit", () => ({ readRateLimit: mock.readLimit, checkRateLimit: mock.consume }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: mock.verify }));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: mock.warn } }));
import { submitComment, fetchOwnPendingComments, getCommentAvailability } from "../app/actions/comment.actions";

const startupId = "cmvddwy1h0000zgy2oi9d66n3";
const id = "cmvddwy1h0001zgy2oi9d66n4";
const input = { startupId, authorName: "Kosh", authorEmail: "kosh@example.test", body: "How can a founder join your pilot?", turnstileToken: "single-use-test-token" };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("BETTER_AUTH_SECRET", "isolated-comment-test-signing-secret");
  mock.readLimit.mockResolvedValue({ allowed: true, available: true, retryAfterSeconds: 1 });
  mock.consume.mockResolvedValue(true); mock.verify.mockResolvedValue(true);
  mock.startup.mockResolvedValue({ id: startupId, slug: "fixture" });
  mock.create.mockResolvedValue({ id, authorName: input.authorName, body: input.body, createdAt: new Date("2026-10-20T00:00:00Z") });
  mock.findMany.mockResolvedValue([]);
});
afterEach(() => vi.unstubAllEnvs());

it("reports an exhausted network limit before consuming CAPTCHA or another attempt", async () => {
  mock.readLimit.mockResolvedValue({ allowed: false, available: true, retryAfterSeconds: 1800 });
  expect(await getCommentAvailability()).toMatchObject({ allowed: false, retryAfterSeconds: 1800, message: expect.stringContaining("3 comments per hour") });
  expect(await submitComment(input)).toMatchObject({ error: expect.stringContaining("3 comments per hour") });
  expect(mock.verify).not.toHaveBeenCalled(); expect(mock.consume).not.toHaveBeenCalled(); expect(mock.create).not.toHaveBeenCalled();
});

it("keeps a saved result successful when cache refresh fails, with a private receipt", async () => {
  mock.revalidate.mockImplementation(() => { throw new Error("cache unavailable"); });
  const result = await submitComment(input);
  expect(result).toMatchObject({ success: true, pendingComment: { id, body: input.body } });
  const [name, value, options] = mock.setCookie.mock.calls[0];
  expect(name).toBe(COMMENT_RECEIPT_COOKIE);
  expect(readCommentReceipts(value, process.env.BETTER_AUTH_SECRET)).toEqual([id]);
  expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  expect(mock.warn).toHaveBeenCalled();
  expect(result.pendingComment).not.toHaveProperty("authorEmail");
});

it("does not invite a duplicate when saving the receipt fails after the insert", async () => {
  mock.setCookie.mockImplementation(() => { throw new Error("cookie unavailable"); });
  expect(await submitComment(input)).toMatchObject({ success: true, pendingComment: { id } });
  expect(mock.create).toHaveBeenCalledOnce();
});

it("rejects invalid CAPTCHA without consuming the comment allowance", async () => {
  mock.verify.mockResolvedValue(false);
  expect(await submitComment(input)).toHaveProperty("error");
  expect(mock.consume).not.toHaveBeenCalled(); expect(mock.create).not.toHaveBeenCalled();
});

it("still enforces the atomic network budget after a successful preflight", async () => {
  mock.consume.mockResolvedValue(false);
  expect(await submitComment(input)).toHaveProperty("error"); expect(mock.create).not.toHaveBeenCalled();
});

it("never uses an unverified email address or an unsigned ID to read pending comments", async () => {
  mock.getCookie.mockReturnValue({ value: "forged.receipt" });
  expect(await fetchOwnPendingComments(startupId)).toEqual([]); expect(mock.findMany).not.toHaveBeenCalled();
  mock.getCookie.mockReturnValue({ value: addCommentReceipt(undefined, id, process.env.BETTER_AUTH_SECRET) });
  await fetchOwnPendingComments(startupId);
  expect(mock.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: [id] }, startupId, status: "PENDING", startup: { status: "LIVE", founder: { founderMode: true } } }, select: { id: true, authorName: true, body: true, createdAt: true } }));
});
