ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;

ALTER TABLE "Session" ADD COLUMN "twoFactorVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "TwoFactor" (
  "id" TEXT NOT NULL,
  "secret" TEXT NOT NULL,
  "backupCodes" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "verified" BOOLEAN DEFAULT true,
  "failedVerificationCount" INTEGER DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  CONSTRAINT "TwoFactor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TwoFactor_secret_idx" ON "TwoFactor"("secret");
CREATE INDEX "TwoFactor_userId_idx" ON "TwoFactor"("userId");

ALTER TABLE "TwoFactor" ADD CONSTRAINT "TwoFactor_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AdminTwoFactorResetAudit" (
  "id" TEXT NOT NULL,
  "operatorId" TEXT,
  "operatorName" VARCHAR(100) NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "targetEmail" TEXT NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminTwoFactorResetAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminTwoFactorResetAudit_targetUserId_createdAt_idx"
  ON "AdminTwoFactorResetAudit"("targetUserId", "createdAt" DESC);
