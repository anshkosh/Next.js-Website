-- Additive: existing upvote rows and totals remain intact.
ALTER TABLE "Startup" ADD COLUMN "downvoteCount" INTEGER NOT NULL DEFAULT 0;
-- GENERATED automatically includes existing totals and follows old releases' upvote writes.
ALTER TABLE "Startup" ADD COLUMN "signalCount" INTEGER GENERATED ALWAYS AS ("upvoteCount" - "downvoteCount") STORED;
CREATE INDEX "Startup_signalCount_idx" ON "Startup"("signalCount" DESC);

CREATE TABLE "Downvote" (
  "id" TEXT NOT NULL,
  "startupId" TEXT NOT NULL,
  "fingerprintHash" TEXT NOT NULL,
  "cookieId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Downvote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Downvote_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Downvote_startupId_fingerprintHash_key" ON "Downvote"("startupId", "fingerprintHash");
CREATE UNIQUE INDEX "Downvote_startupId_cookieId_key" ON "Downvote"("startupId", "cookieId");
CREATE INDEX "Downvote_startupId_idx" ON "Downvote"("startupId");
