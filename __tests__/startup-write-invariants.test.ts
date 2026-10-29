// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
vi.mock("@/lib/db", () => ({ db: {} }));
import { createTeamFounder } from "@/lib/startup-team-store";
import { createStartupUpdate, editStartupUpdate, removeStartupUpdate } from "@/lib/startup-update-store";

const tx = {
  contentModeration: { upsert: vi.fn() },
  $queryRaw: vi.fn(), startup: { findUnique: vi.fn(), update: vi.fn() },
  startupFounder: { findMany: vi.fn(), create: vi.fn() },
  startupUpdate: { count: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  startupUpdateRevision: { create: vi.fn() },
};
const transaction = vi.fn(async (operation: (tx: object) => unknown) => operation(tx));
const client = { $transaction: transaction } as unknown as Pick<PrismaClient, "$transaction">;
beforeEach(() => {
  vi.resetAllMocks(); transaction.mockImplementation(async operation => operation(tx));
  tx.startup.findUnique.mockResolvedValue({ id: "startup", slug: "startup", status: "LIVE" });
  tx.startupFounder.findMany.mockResolvedValue([{ sortOrder: 0 }, { sortOrder: 2 }]);
  tx.startupFounder.create.mockResolvedValue({ id: "founder" });
  tx.startupUpdate.create.mockResolvedValue({ id: "update" });
  tx.startupUpdate.findUnique.mockResolvedValue({ startupId: "startup" });
  tx.startupUpdate.update.mockResolvedValue({ id: "update", title: "Changed", body: "New body", imageUrl: null, status: "PENDING" });
  tx.startupUpdate.count.mockResolvedValue(1);
});
it("allocates the missing team position only after the parent lock and ownership check", async () => {
  await createTeamFounder("owner", { startupId: "startup", name: "Founder" }, client);
  expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.startupFounder.findMany.mock.invocationCallOrder[0]);
  expect(tx.startup.findUnique).toHaveBeenCalledWith({ where: { id: "startup", founderId: "owner" }, select: { id: true } });
  expect(tx.startupFounder.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sortOrder: 1 }) }));
});
it("enforces the team cap inside the transaction", async () => {
  tx.startupFounder.findMany.mockResolvedValue([{ sortOrder: 0 }, { sortOrder: 1 }, { sortOrder: 2 }]);
  await expect(createTeamFounder("owner", { startupId: "startup", name: "Founder" }, client)).rejects.toThrow("Maximum of 3");
  expect(tx.startupFounder.create).not.toHaveBeenCalled();
});
it("rejects a non-owner before team/update mutations", async () => {
  tx.startup.findUnique.mockResolvedValue(null);
  await expect(createTeamFounder("other", { startupId: "startup", name: "Founder" }, client)).rejects.toThrow("Unauthorized");
  await expect(createStartupUpdate("other", { startupId: "startup", title: "Title", body: "Body" }, client)).rejects.toThrow("Unauthorized");
  await expect(removeStartupUpdate("other", "update", client)).rejects.toThrow("Unauthorized");
  expect(tx.startupFounder.create).not.toHaveBeenCalled(); expect(tx.startupUpdate.create).not.toHaveBeenCalled(); expect(tx.startupUpdate.delete).not.toHaveBeenCalled();
});
it("creates an update and recounts from persisted rows in one transaction", async () => {
  expect(await createStartupUpdate("owner", { startupId: "startup", title: "Title", body: "Body" }, client)).toEqual({ update: { id: "update" }, slug: "startup" });
  expect(transaction).toHaveBeenCalledOnce();
  expect(tx.startup.update).toHaveBeenCalledWith({ where: { id: "startup" }, data: { updateCount: 1 } });
  expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.startupUpdate.create.mock.invocationCallOrder[0]);
});
it("archives the prior update before resubmitting edits for moderation", async () => {
  tx.startupUpdate.findUnique.mockResolvedValue({ startupId: "startup", title: "Old title", body: "Old body", imageUrl: "https://image.test/old.png" });
  await editStartupUpdate("owner", "update", { title: "Changed", body: "New body" }, client);
  expect(tx.startupUpdateRevision.create).toHaveBeenCalledWith({ data: { updateId: "update", title: "Old title", body: "Old body", imageUrl: "https://image.test/old.png", editorId: "owner" } });
  expect(tx.startupUpdateRevision.create.mock.invocationCallOrder[0]).toBeLessThan(tx.startupUpdate.update.mock.invocationCallOrder[0]);
  expect(tx.startupUpdate.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) }));
});
it("propagates counter failures through the transaction, not after its commit", async () => {
  tx.startup.update.mockRejectedValue(new Error("counter write failed"));
  await expect(createStartupUpdate("owner", { startupId: "startup", title: "Title", body: "Body" }, client)).rejects.toThrow("counter write failed");
  await expect(removeStartupUpdate("owner", "update", client)).rejects.toThrow("counter write failed");
});
it("deletes with an owner predicate and recomputes the counter rather than decrementing stale data", async () => {
  tx.startupUpdate.count.mockResolvedValue(0);
  expect(await removeStartupUpdate("owner", "update", client)).toEqual({ slug: "startup" });
  expect(tx.startupUpdate.delete).toHaveBeenCalledWith({ where: { id: "update", startup: { founderId: "owner" } } });
  expect(tx.startup.update).toHaveBeenCalledWith({ where: { id: "startup" }, data: { updateCount: 0 } });
});
it("does not publish updates for a non-live startup", async () => {
  tx.startup.findUnique.mockResolvedValue({ id: "startup", status: "DRAFT" });
  await expect(createStartupUpdate("owner", { startupId: "startup", title: "Title", body: "Body" }, client)).rejects.toThrow("live startups");
  expect(tx.startupUpdate.create).not.toHaveBeenCalled();
});
