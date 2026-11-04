// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
vi.mock("@/lib/db", () => ({ db: {} }));
import { featurePermanentStartup, featureLatestLiveStartup, reorderFeaturedEntries } from "@/lib/featured-startup-store";

const tx = {
  $queryRaw: vi.fn(), startup: { findUnique: vi.fn(), findFirst: vi.fn() },
  featuredStartup: { aggregate: vi.fn(), upsert: vi.fn(), findMany: vi.fn(), update: vi.fn() },
};
const client = { $transaction: async (operation: (tx: object) => unknown) => operation(tx) } as unknown as Pick<PrismaClient, "$transaction">;
beforeEach(() => {
  vi.resetAllMocks(); tx.$queryRaw.mockResolvedValue([]);
  tx.startup.findUnique.mockResolvedValue({ id: "live", name: "Live" });
  tx.startup.findFirst.mockResolvedValue({ id: "live" });
  tx.featuredStartup.aggregate.mockResolvedValue({ _min: { sortOrder: 0 }, _max: { sortOrder: 4 } });
});
it("takes the global allocation lock before calculating placement order", async () => {
  await featurePermanentStartup("live", undefined, client);
  expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.featuredStartup.aggregate.mock.invocationCallOrder[0]);
  expect(tx.$queryRaw.mock.calls[0][0].join("")).toContain("featured-startup-slots");
});
it.each([false, true])("allocates an extra placement beyond six entries (temporary=%s)", async temporary => {
  tx.featuredStartup.aggregate.mockResolvedValue({ _min: { sortOrder: 0 }, _max: { sortOrder: 5 } });
  await (temporary ? featureLatestLiveStartup(client) : featurePermanentStartup("live", undefined, client));
  expect(tx.featuredStartup.upsert).toHaveBeenCalledWith(expect.objectContaining({
    create: expect.objectContaining({ startupId: "live", sortOrder: temporary ? -1 : 6 }),
  }));
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
it("updates the changed positions in the same locked transaction", async () => {
  tx.featuredStartup.findMany.mockResolvedValue([{ id: "a", sortOrder: 0 }, { id: "b", sortOrder: 1 }, { id: "c", sortOrder: 2 }]);
  await reorderFeaturedEntries(["b", "a", "c"], client);
  expect(tx.featuredStartup.update.mock.calls.map(([arg]) => arg)).toEqual([
    { where: { id: "b" }, data: { sortOrder: 0 } }, { where: { id: "a" }, data: { sortOrder: 1 } },
  ]);
});
