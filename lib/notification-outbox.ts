import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { emailQueue, notificationQueue } from "@/lib/jobs/queues";
import { logger } from "@/lib/logger";

export async function storeNotification(tx: Prisma.TransactionClient, queue: "email" | "notification", name: string, payload: Prisma.InputJsonObject) {
  return tx.notificationOutbox.create({ data: { queue, name, payload }, select: { id: true } });
}

export async function deliverNotification(id: string): Promise<boolean> {
  try {
    return await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM "NotificationOutbox" WHERE id = ${id} FOR UPDATE`;
      const event = await tx.notificationOutbox.findUnique({ where: { id } });
      if (!event) return false;
      if (event.deliveredAt) return true;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        if (!["email", "notification"].includes(event.queue)) throw new Error("Invalid outbox queue");
        const queue = event.queue === "email" ? emailQueue : notificationQueue;
        await Promise.race([
          queue.add(event.name, event.payload, { jobId: `outbox-${event.id}` }),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error("Delivery timed out")), 3000); }),
        ]);
        await tx.notificationOutbox.update({ where: { id }, data: { deliveredAt: new Date(), attempts: { increment: 1 } } });
        return true;
      } catch {
        await tx.notificationOutbox.update({ where: { id }, data: { attempts: { increment: 1 }, nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(event.attempts, 7))) } });
        // IDs only: don't put email addresses or payloads into logs.
        logger.warn("Notification delivery delayed; durable retry retained", { eventId: id });
        return false;
      } finally { if (timeout) clearTimeout(timeout); }
    }, { timeout: 10000 });
  } catch {
    logger.error("Outbox attempt unavailable; original save remains committed", { eventId: id });
    return false;
  }
}

export async function retryNotifications() {
  const pending = await db.notificationOutbox.findMany({ where: { deliveredAt: null, nextAttemptAt: { lte: new Date() } }, orderBy: { nextAttemptAt: "asc" }, take: 10, select: { id: true } });
  const results = await Promise.all(pending.map(event => deliverNotification(event.id)));
  return { attempted: results.length, delivered: results.filter(Boolean).length };
}
