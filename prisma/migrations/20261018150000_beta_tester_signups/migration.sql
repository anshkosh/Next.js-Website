CREATE TYPE "BetaTesterRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

CREATE TABLE "BetaTesterProgram" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(1000) NOT NULL,
    "reward" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BetaTesterProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BetaTesterRequest" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "message" VARCHAR(500),
    "status" "BetaTesterRequestStatus" NOT NULL DEFAULT 'PENDING',
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "consentVersion" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    CONSTRAINT "BetaTesterRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BetaTesterProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BetaTesterRequest" ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX "BetaTesterProgram_startupId_key" ON "BetaTesterProgram"("startupId");
CREATE UNIQUE INDEX "BetaTesterRequest_programId_email_key" ON "BetaTesterRequest"("programId", "email");
CREATE INDEX "BetaTesterRequest_programId_status_createdAt_idx" ON "BetaTesterRequest"("programId", "status", "createdAt");

ALTER TABLE "BetaTesterProgram" ADD CONSTRAINT "BetaTesterProgram_startupId_fkey"
  FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BetaTesterRequest" ADD CONSTRAINT "BetaTesterRequest_programId_fkey"
  FOREIGN KEY ("programId") REFERENCES "BetaTesterProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
