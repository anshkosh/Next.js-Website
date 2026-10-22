import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const BETA_PENDING_DAYS = 90;
export const BETA_APPROVED_DAYS = 180;
export const daysAgo = (days: number, now = new Date()) => new Date(now.getTime() - days * 86400000);

export function activeBetaRequests(now = new Date()): Prisma.BetaTesterRequestWhereInput {
  return { OR: [
    { status: "PENDING", createdAt: { gte: daysAgo(BETA_PENDING_DAYS, now) } },
    { status: "APPROVED", OR: [{ reviewedAt: { gte: daysAgo(BETA_APPROVED_DAYS, now) } }, { reviewedAt: null, createdAt: { gte: daysAgo(BETA_APPROVED_DAYS, now) } }] },
  ] };
}

export async function applyRequestRetention(now = new Date()) {
  const expired = await db.betaTesterRequest.findMany({ where: { OR: [
    { status: "PENDING", createdAt: { lt: daysAgo(BETA_PENDING_DAYS, now) } },
    { status: "APPROVED", OR: [{ reviewedAt: { lt: daysAgo(BETA_APPROVED_DAYS, now) } }, { reviewedAt: null, createdAt: { lt: daysAgo(BETA_APPROVED_DAYS, now) } }] },
  ] }, take: 500, select: { id: true, status: true, createdAt: true, reviewedAt: true } });
  // Repeat the exact state/time predicate on each write so approval racing with
  // expiry cannot be overwritten using a stale selection.
  for (const request of expired) await db.betaTesterRequest.updateMany({
    where: { id: request.id, status: request.status, createdAt: request.createdAt, reviewedAt: request.reviewedAt },
    data: { name: null, email: null, message: null, status: "DECLINED", reviewedAt: now },
  });
  const oldClosed = await db.betaTesterRequest.findMany({ where: { status: "DECLINED", reviewedAt: { lt: daysAgo(365, now) } }, take: 500, select: { id: true } });
  if (oldClosed.length) await db.betaTesterRequest.deleteMany({ where: { id: { in: oldClosed.map(row => row.id) }, status: "DECLINED", reviewedAt: { lt: daysAgo(365, now) } } });
  await db.verification.deleteMany({ where: { identifier: { startsWith: "newsletter:" }, expiresAt: { lt: now } } });
  await db.verification.deleteMany({ where: { identifier: { startsWith: "account-privacy:" }, expiresAt: { lt: now } } });
  await db.newsletterSubscriber.deleteMany({ where: { OR: [{ unsubscribedAt: { lt: daysAgo(180, now) } }, { confirmedAt: null, subscribedAt: { lt: daysAgo(180, now) } }] } });
  await db.notificationOutbox.deleteMany({ where: { deliveredAt: { lt: daysAgo(7, now) } } });
  return { expired: expired.length, removedClosed: oldClosed.length };
}
