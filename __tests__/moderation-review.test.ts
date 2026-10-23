// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), claim: vi.fn(), source: vi.fn(), apply: vi.fn(), query: vi.fn(), cache: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/cache-after-save", () => ({ revalidateSavedPath: m.cache }));
vi.mock("@/lib/moderation-source", () => ({ moderationSource: m.source, applyModeration: m.apply }));
vi.mock("@/lib/db", () => {
  const tx = { contentModeration: { findUnique: m.find, findUniqueOrThrow: m.find, updateMany: m.claim, update: m.update }, $queryRaw: m.query };
  return { db: { $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
import { reviewContent } from "@/app/actions/content-moderation.actions";
const hash = "a".repeat(64);
beforeEach(() => {
  vi.resetAllMocks(); m.session.mockResolvedValue({ user: { id: "reviewer", role: "reviewer", emailVerified: true } });
  m.find.mockResolvedValue({ id: "job", kind: "UPDATE", contentHash: hash });
  m.source.mockResolvedValue({ startupId: "startup", slug: "fixture" }); m.apply.mockResolvedValue({ slug: "fixture" }); m.claim.mockResolvedValue({ count: 1 });
});
it.each([null, { user: { id: "owner", role: "user", emailVerified: true } }, { user: { id: "reviewer", role: "reviewer", emailVerified: false } }, { user: { id: "admin", role: "admin", emailVerified: true, banned: true } }])("requires a verified, non-banned reviewer for every mutation", async session => {
  m.session.mockResolvedValue(session); expect(await reviewContent("job", hash, true)).toHaveProperty("error"); expect(m.find).not.toHaveBeenCalled(); expect(m.apply).not.toHaveBeenCalled();
});
it("rejects an invalid review before any database access", async () => {
  expect(await reviewContent("job", "forged", true)).toHaveProperty("error"); expect(m.find).not.toHaveBeenCalled();
});
it("refuses stale hashes or already-decided work", async () => {
  m.claim.mockResolvedValue({ count: 0 }); expect(await reviewContent("job", hash, true)).toHaveProperty("error"); expect(m.apply).not.toHaveBeenCalled();
});
it("stores the reviewer and invalidates public surfaces only after a committed decision", async () => {
  expect(await reviewContent("job", hash, true)).toEqual({ success: true });
  expect(m.claim).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ contentHash: hash, kind: { not: "JOURNAL" } }), data: expect.objectContaining({ reviewedBy: "reviewer", status: "APPROVED", leaseToken: null }) }));
  expect(m.cache).toHaveBeenCalledWith("/startups/fixture"); expect(m.cache).toHaveBeenCalledWith("/leaderboard");
});
it("allows a human to hide previously auto-approved content", async () => {
  expect(await reviewContent("job", hash, false)).toEqual({ success: true });
  expect(m.apply).toHaveBeenCalledWith(expect.anything(), expect.anything(), false, true);
  expect(m.claim.mock.calls[0][0].where.status.in).toContain("SAFE");
});
it("does not publish when the source no longer matches the checked content", async () => {
  m.apply.mockResolvedValue(null); expect(await reviewContent("job", hash, true)).toHaveProperty("error"); expect(m.update).toHaveBeenCalledWith({ where: { id: "job" }, data: { status: "STALE" } }); expect(m.cache).not.toHaveBeenCalled();
});
