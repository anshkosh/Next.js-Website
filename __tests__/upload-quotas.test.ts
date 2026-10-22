// @vitest-environment node
import { vi, beforeEach, expect, it } from "vitest";
const mock = vi.hoisted(() => ({ aggregate: vi.fn(), create: vi.fn(), owner: vi.fn(), lock: vi.fn(), eval: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: {} }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (fn: (tx: object) => unknown) => fn({ $queryRaw: mock.lock, user: { findUnique: mock.owner }, mediaUpload: { aggregate: mock.aggregate, create: mock.create } }) } }));
vi.mock("ioredis", () => ({ default: class { on() {} disconnect() {} eval = mock.eval; } }));
import { limitUploads, reserveUpload } from "../lib/uploads/safety";
beforeEach(() => { vi.clearAllMocks(); mock.owner.mockResolvedValue({ id: "owner", banned: false }); mock.aggregate.mockResolvedValue({ _sum: { bytes: 0 } }); mock.create.mockResolvedValue({ id: "reserved" }); });
it("rejects a deleted or banned owner before reserving more media", async () => {
  for (const owner of [null, { id: "owner", banned: true }]) {
    mock.owner.mockResolvedValue(owner);
    await expect(reserveUpload("owner", "gallery/test.webp", 1)).rejects.toMatchObject({ status: 401 });
  }
  expect(mock.create).not.toHaveBeenCalled();
});
it("serializes concurrent quota reservations per account", async () => {
  expect(await reserveUpload("owner", "gallery/test.webp", 1000)).toEqual({ id: "reserved" });
  expect(mock.lock).toHaveBeenCalledOnce();
  expect(mock.lock.mock.calls[0][0].join("")).toContain("::text");
  expect(mock.create).toHaveBeenCalledWith({ data: { userId: "owner", key: "gallery/test.webp", bytes: 1000 } });
});
it("blocks an exhausted total allowance before reserving", async () => {
  mock.aggregate.mockResolvedValueOnce({ _sum: { bytes: 500 * 1024 * 1024 } });
  await expect(reserveUpload("owner", "key", 1)).rejects.toMatchObject({ status: 429 }); expect(mock.create).not.toHaveBeenCalled();
});
it("blocks the rolling daily limit", async () => {
  mock.aggregate.mockResolvedValueOnce({ _sum: { bytes: 200 * 1024 * 1024 } }).mockResolvedValueOnce({ _sum: { bytes: 100 * 1024 * 1024 } });
  await expect(reserveUpload("owner", "key", 1)).rejects.toMatchObject({ status: 429 }); expect(mock.create).not.toHaveBeenCalled();
});
it("blocks excess attempts with an atomic expiring counter", async () => {
  mock.eval.mockResolvedValueOnce(21); await expect(limitUploads("owner")).rejects.toMatchObject({ status: 429 });
  expect(mock.eval.mock.calls[0][0]).toContain("EXPIRE");
});
it("fails closed if the limiter is unavailable", async () => {
  mock.eval.mockRejectedValueOnce(new Error("offline")); await expect(limitUploads("owner")).rejects.toMatchObject({ status: 503 });
});
