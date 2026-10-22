// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ list: vi.fn(), find: vi.fn(), remove: vi.fn(), rotate: vi.fn(), lock: vi.fn(), send: vi.fn(), owner: vi.fn(), reserve: vi.fn(), transaction: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { mediaUpload: { findMany: m.list, updateMany: m.rotate }, $transaction: m.transaction } }));
vi.mock("@/lib/storage/r2", () => ({ r2: { send: m.send } }));
vi.mock("@/lib/uploads/safety", () => ({ reserveUpload: m.reserve, UploadError: class extends Error { constructor(message: string, public status: number) { super(message); } } }));
import { eraseQueuedAccountMedia, isErasableUploadKey } from "@/lib/account-media-erasure";
import { storeUpload } from "@/lib/uploads/store";
beforeEach(() => {
  vi.resetAllMocks();
  m.transaction.mockImplementation((fn: (tx: object) => unknown) => fn({ $queryRaw: m.lock, mediaUpload: { findUnique: m.find, delete: m.remove }, user: { findUnique: m.owner } }));
  m.list.mockResolvedValue([{ id: "upload", userId: "member" }]);
  m.find.mockResolvedValue({ id: "upload", key: "gallery/owned.webp", erasureRequestedAt: new Date() });
  m.reserve.mockResolvedValue({ id: "upload" }); m.owner.mockResolvedValue({ id: "member", banned: false });
  m.rotate.mockResolvedValue({ count: 1 });
});
it("removes the cleanup record only after storage confirms deletion", async () => {
  expect(await eraseQueuedAccountMedia()).toEqual({ attempted: 1, removed: 1, remainingFromBatch: 0 });
  expect(m.send.mock.calls[0][0].input.Key).toBe("gallery/owned.webp");
  expect(m.remove).toHaveBeenCalledWith({ where: { id: "upload" } });
  expect(m.send.mock.invocationCallOrder[0]).toBeLessThan(m.remove.mock.invocationCallOrder[0]);
});
it("retains failed work and rotates it behind untouched uploads for the next attempt", async () => {
  m.send.mockRejectedValue(new Error("storage offline"));
  expect(await eraseQueuedAccountMedia()).toEqual({ attempted: 1, removed: 0, remainingFromBatch: 1 });
  expect(m.remove).not.toHaveBeenCalled();
  expect(m.rotate).toHaveBeenCalledWith({ where: { id: "upload", erasureRequestedAt: { not: null } }, data: { erasureAttempts: { increment: 1 } } });
});
it("never erases a live or unmarked upload", async () => {
  m.find.mockResolvedValue({ id: "upload", key: "gallery/owned.webp", erasureRequestedAt: null });
  expect((await eraseQueuedAccountMedia()).removed).toBe(0); expect(m.send).not.toHaveBeenCalled();
});
it.each(["backups/production.sql", "gallery/../backup", "gallery/./image", "gallery//image", "/gallery/image", "https://evil.example/key"])("refuses unsafe storage key %s", async key => {
  expect(isErasableUploadKey(key)).toBe(false);
  m.find.mockResolvedValue({ id: "upload", key, erasureRequestedAt: new Date() });
  await eraseQueuedAccountMedia(); expect(m.send).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
});
it("rejects a late upload after its account is deleted, before a storage write", async () => {
  m.owner.mockResolvedValue(null);
  await expect(storeUpload("member", "gallery/owned.webp", Buffer.from("image"), "image/webp")).rejects.toMatchObject({ status: 401 });
  expect(m.send).not.toHaveBeenCalled(); expect(m.rotate).toHaveBeenCalled();
});
it("rejects a late upload when erasure was marked after reservation", async () => {
  await expect(storeUpload("member", "gallery/owned.webp", Buffer.from("image"), "image/webp")).rejects.toMatchObject({ status: 401 });
  expect(m.send).not.toHaveBeenCalled();
});
it("queues uncertain timed-out writes for erasure instead of losing their storage record", async () => {
  m.find.mockResolvedValue({ id: "upload", erasureRequestedAt: null });
  m.send.mockRejectedValue(new Error("timeout"));
  await expect(storeUpload("member", "gallery/owned.webp", Buffer.from("image"), "image/webp")).rejects.toThrow("timeout");
  expect(m.rotate).toHaveBeenCalledWith({ where: { id: "upload" }, data: { erasureRequestedAt: expect.any(Date) } });
  expect(m.remove).not.toHaveBeenCalled();
});
it("writes a valid upload under the same per-account lock as deletion", async () => {
  m.find.mockResolvedValue({ id: "upload", erasureRequestedAt: null });
  await storeUpload("member", "gallery/owned.webp", Buffer.from("image"), "image/webp");
  expect(m.send.mock.calls[0][0].input.Key).toBe("gallery/owned.webp");
  expect(m.lock.mock.calls[0][1]).toBe("uploads:member");
  expect(m.lock.mock.invocationCallOrder[0]).toBeLessThan(m.send.mock.invocationCallOrder[0]);
});
