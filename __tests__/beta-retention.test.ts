// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ list: vi.fn(), update: vi.fn(), remove: vi.fn(), verification: vi.fn(), newsletter: vi.fn(), outbox: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {
  betaTesterRequest: { findMany: mock.list, updateMany: mock.update, deleteMany: mock.remove },
  verification: { deleteMany: mock.verification }, newsletterSubscriber: { deleteMany: mock.newsletter }, notificationOutbox: { deleteMany: mock.outbox },
} }));
import { activeBetaRequests, applyRequestRetention, daysAgo } from "@/lib/beta-retention";
const now = new Date("2026-10-18T10:00:00.000Z");
beforeEach(() => { vi.clearAllMocks(); mock.list.mockResolvedValue([]); });
it("bounds selection and removes personal details only for the exact selected state", async () => {
  const createdAt = daysAgo(91, now);
  mock.list.mockResolvedValueOnce([{ id: "expired", status: "PENDING", createdAt, reviewedAt: null }]).mockResolvedValueOnce([]);
  expect(await applyRequestRetention(now)).toEqual({ expired: 1, removedClosed: 0 });
  expect(mock.list.mock.calls[0][0].take).toBe(500);
  expect(mock.update).toHaveBeenCalledWith({ where: { id: "expired", status: "PENDING", createdAt, reviewedAt: null }, data: { name: null, email: null, message: null, status: "DECLINED", reviewedAt: now } });
  expect(mock.remove).not.toHaveBeenCalled();
});
it("excludes expired contacts from display even before hourly cleanup runs", () => {
  expect(activeBetaRequests(now)).toEqual({ OR: [
    { status: "PENDING", createdAt: { gte: daysAgo(90, now) } },
    { status: "APPROVED", OR: [{ reviewedAt: { gte: daysAgo(180, now) } }, { reviewedAt: null, createdAt: { gte: daysAgo(180, now) } }] },
  ] });
});
it("purges only closed old consent records, expired newsletter tokens and aged delivery history", async () => {
  mock.list.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "old-closed" }]);
  await applyRequestRetention(now);
  expect(mock.remove).toHaveBeenCalledWith({ where: { id: { in: ["old-closed"] }, status: "DECLINED", reviewedAt: { lt: daysAgo(365, now) } } });
  expect(mock.verification).toHaveBeenCalledWith({ where: { identifier: { startsWith: "newsletter:" }, expiresAt: { lt: now } } });
  expect(mock.verification).toHaveBeenCalledWith({ where: { identifier: { startsWith: "account-privacy:" }, expiresAt: { lt: now } } });
  expect(mock.outbox).toHaveBeenCalledWith({ where: { deliveredAt: { lt: daysAgo(7, now) } } });
  expect(mock.newsletter).toHaveBeenCalledWith({ where: { OR: [{ unsubscribedAt: { lt: daysAgo(180, now) } }, { confirmedAt: null, subscribedAt: { lt: daysAgo(180, now) } }] } });
});
