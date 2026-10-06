CREATE TABLE "StartupRevision" (
  "id" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StartupRevision_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StartupRevision_startupId_key" ON "StartupRevision"("startupId");
CREATE INDEX "StartupRevision_status_updatedAt_idx" ON "StartupRevision"("status", "updatedAt");
ALTER TABLE "StartupRevision" ADD CONSTRAINT "StartupRevision_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id");
CREATE TABLE "MediaUpload" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaUpload_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaUpload_key_key" ON "MediaUpload"("key");
CREATE INDEX "MediaUpload_userId_createdAt_idx" ON "MediaUpload"("userId", "createdAt");
