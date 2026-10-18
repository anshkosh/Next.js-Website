CREATE TABLE "NotificationOutbox" (
  "id" TEXT NOT NULL,
  "queue" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NotificationOutbox_deliveredAt_nextAttemptAt_idx" ON "NotificationOutbox"("deliveredAt", "nextAttemptAt");
