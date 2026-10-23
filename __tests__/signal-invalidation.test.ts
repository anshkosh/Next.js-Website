// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), comment: vi.fn(), findComment: vi.fn(), cache: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("@/lib/db", () => {
  const tx = { comment: { update: mock.comment, findUnique: mock.findComment }, contentModeration: { updateMany: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn() } };
  return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: mock.cache }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/utils/turnstile", () => ({ verifyTurnstileToken: vi.fn() }));
import { approveComment, rejectComment, replyToComment, deleteReply } from "../app/actions/comment.actions";
const id = "cmvddwy1h0000zgy2oi9d66n3";
beforeEach(() => {
  vi.clearAllMocks();
  mock.session.mockResolvedValue({ user: { id: "owner", name: "Founder", role: "admin", emailVerified: true } });
  mock.comment.mockResolvedValue({ startup: { slug: "fixture" } });
  mock.findComment.mockResolvedValue({ startup: { slug: "fixture", founderId: "owner" } });
});
it.each([
  ["approval", () => approveComment(id)], ["rejection", () => rejectComment(id)],
  ["reply", () => replyToComment({ commentId: id, reply: "Thanks for the feedback!" })], ["reply removal", () => deleteReply(id)],
] as const)("refreshes both ranking surfaces after %s", async (_, action) => {
  expect(await action()).toMatchObject({ success: true });
  expect(mock.cache).toHaveBeenCalledWith("/");
  expect(mock.cache).toHaveBeenCalledWith("/leaderboard");
});
it("does not mutate or refresh rankings for an unauthorized reply", async () => {
  mock.session.mockResolvedValue({ user: { id: "someone-else", role: "user" } });
  expect(await replyToComment({ commentId: id, reply: "Not the startup owner" })).toHaveProperty("error");
  expect(mock.comment).not.toHaveBeenCalled();
  expect(mock.cache).not.toHaveBeenCalled();
});
