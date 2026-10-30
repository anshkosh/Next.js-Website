CREATE TABLE "AdminPasswordResetAudit" (
  "id" TEXT NOT NULL,
  "operatorName" VARCHAR(100) NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "targetEmail" TEXT NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "approvalReference" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminPasswordResetAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminPasswordResetAudit_targetUserId_createdAt_idx"
  ON "AdminPasswordResetAudit"("targetUserId", "createdAt" DESC);