ALTER TABLE "MediaUpload" ADD COLUMN "erasureRequestedAt" TIMESTAMP(3);
ALTER TABLE "MediaUpload" ADD COLUMN "erasureAttempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "MediaUpload_erasureRequestedAt_idx" ON "MediaUpload"("erasureRequestedAt");
