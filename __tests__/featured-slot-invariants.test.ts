// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
vi.mock("@/lib/db", () => ({ db: {} }));
import { featurePermanentStartup, featureLatestLiveStartup, reorderFeaturedEntries, FeaturedStartupError } from "@/lib/featured-startup-store";

const tx = {
  $queryRaw: vi.fn(), startup: { findUnique: vi.fn(), findFirst: vi.fn() },
  featuredStartup: { count: vi.fn(), findUnique: vi.fn(), aggregate: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
};
const client = { $transaction: async (operation: (tx: object) => unknown) => operation(tx) } as unknown as Pick<PrismaClient, "$transaction">;
beforeEach(() => {
  vi.resetAllMocks(); tx.$queryRaw.mockResolvedValue([]);
  tx.startup.findUnique.mockResolvedValue({ id: "live", name: "Live" });
  tx.startup.findFirst.mockResolvedValue({ id: "live" });
  tx.featuredStartup.findUnique.mockResolvedValue(null);
  tx.featuredStartup.count.mockResolvedValue(5);
  tx.featuredStartup.aggregate.mockResolvedValue({ _min: { sortOrder: 0 }, _max: { sortOrder: 4 } });
});
it("takes the global allocation lock before counting or writing", async () => {
  await featurePermanentStartup("live", undefined, client);
  expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.featuredStartup.count.mock.invocationCallOrder[0]);
  expect(tx.$queryRaw.mock.calls[0][0].join("")).toContain("featured-startup-slots");
});
it.each([false, true])("rejects an extra active feature at capacity (temporary=%s)", async temporary => {
  tx.featuredStartup.count.mockResolvedValue(6);
  await expect(temporary ? featureLatestLiveStartup(client) : featurePermanentStartup("live", 0, client)).rejects.toBeInstanceOf(FeaturedStartupError);
  expect(tx.featuredStartup.upsert).not.toHaveBeenCalled();
});
it("allows renewal of an existing active entry at capacity", async () => {
  tx.featuredStartup.count.mockResolvedValue(6);
  tx.featuredStartup.findUnique.mockResolvedValue({ featuredUntil: null });
  await featurePermanentStartup("live", undefined, client);
  expect(tx.featuredStartup.upsert).toHaveBeenCalledOnce();
});
it("an expired entry cannot bypass the active capacity limit", async () => {
  tx.featuredStartup.count.mockResolvedValue(6);
  tx.featuredStartup.findUnique.mockResolvedValue({ featuredUntil: new Date(0) });
  await expect(featurePermanentStartup("live", undefined, client)).rejects.toBeInstanceOf(FeaturedStartupError);
});
it("does not allocate an unpublished startup", async () => {
  tx.startup.findUnique.mockResolvedValue(null);
  await expect(featurePermanentStartup("draft", undefined, client)).rejects.toThrow("Only live");
  expect(tx.featuredStartup.upsert).not.toHaveBeenCalled();
});
it("validates IDs, integer orders and duplicate reorder IDs before opening a transaction", async () => {
  await expect(featurePermanentStartup("", 0, client)).rejects.toThrow("Invalid");
  await expect(featurePermanentStartup("live", Number.NaN, client)).rejects.toThrow("Invalid");
  await expect(reorderFeaturedEntries(["a", "a"], client)).rejects.toThrow("Invalid");
  expect(tx.$queryRaw).not.toHaveBeenCalled();
});
it("rejects stale or partial reorder submissions before changing any order", async () => {
  tx.featuredStartup.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
  await expect(reorderFeaturedEntries(["a"], client)).rejects.toThrow("Refresh");
  expect(tx.featuredStartup.update).not.toHaveBeenCalled();
});
it("reorders every entry within the same locked transaction", async () => {
  tx.featuredStartup.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
  await reorderFeaturedEntries(["b", "a"], client);
  expect(tx.featuredStartup.update.mock.calls.map(([arg]) => arg)).toEqual([
    { where: { id: "b" }, data: { sortOrder: 0 } }, { where: { id: "a" }, data: { sortOrder: 1 } },
  ]);
});
