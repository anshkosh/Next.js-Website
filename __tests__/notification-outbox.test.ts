// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ create: vi.fn(), find: vi.fn(), list: vi.fn(), update: vi.fn(), queue: vi.fn(), lock: vi.fn(), warn: vi.fn() }));
vi.mock("@/lib/db", () => {
  const tx = { notificationOutbox: { create: mock.create, findUnique: mock.find, findMany: mock.list, update: mock.update }, $queryRaw: mock.lock };
  return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: mock.queue }, notificationQueue: { add: mock.queue } }));
vi.mock("@/lib/logger", () => ({ logger: { warn: mock.warn, error: vi.fn() } }));
import { deliverNotification, retryNotifications, storeNotification } from "@/lib/notification-outbox";
import { db } from "@/lib/db";
beforeEach(() => {
  vi.clearAllMocks(); mock.find.mockResolvedValue({ id: "event", queue: "email", name: "approved", payload: { to: "private@example.test" }, attempts: 0, deliveredAt: null });
  mock.queue.mockResolvedValue({}); mock.update.mockResolvedValue({});
});
it("writes delivery intent using the caller's business transaction", async () => {
  await db.$transaction(async tx => storeNotification(tx, "email", "approved", { to: "fixture@example.test" }));
  expect(mock.create).toHaveBeenCalledWith({ data: { queue: "email", name: "approved", payload: { to: "fixture@example.test" } }, select: { id: true } });
  expect(mock.queue).not.toHaveBeenCalled();
});
it("retains a failed attempt for retry without reporting an unsaved business operation", async () => {
  mock.queue.mockRejectedValueOnce(new Error("redis offline"));
  expect(await deliverNotification("event")).toBe(false);
  expect(mock.update).toHaveBeenCalledWith({ where: { id: "event" }, data: { attempts: { increment: 1 }, nextAttemptAt: expect.any(Date) } });
  expect(JSON.stringify(mock.warn.mock.calls)).not.toContain("private@example.test");
  expect(await deliverNotification("event")).toBe(true);
  expect(mock.queue.mock.calls.map(call => call[2].jobId)).toEqual(["outbox-event", "outbox-event"]);
});
it("does not re-enqueue a delivered event, even on retry", async () => {
  mock.find.mockResolvedValue({ id: "event", deliveredAt: new Date() });
  expect(await deliverNotification("event")).toBe(true); expect(mock.queue).not.toHaveBeenCalled();
});
it("selects only bounded, due, undelivered intents", async () => {
  mock.list.mockResolvedValue([]);
  expect(await retryNotifications()).toEqual({ attempted: 0, delivered: 0 });
  expect(mock.list).toHaveBeenCalledWith({ where: { deliveredAt: null, nextAttemptAt: { lte: expect.any(Date) } }, orderBy: { nextAttemptAt: "asc" }, take: 10, select: { id: true } });
});
