ALTER TABLE "JournalPost" ADD COLUMN "scheduledAt" TIMESTAMP(3);
ALTER TABLE "FounderJournalEntry" ADD COLUMN "approvedAt" TIMESTAMP(3);
CREATE TABLE "FounderJournalRevision" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "entryId" TEXT NOT NULL UNIQUE REFERENCES "FounderJournalEntry"("id"),
 "data" JSONB NOT NULL,
 "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
 "version" INTEGER NOT NULL DEFAULT 1,
 "scheduledAt" TIMESTAMP(3),
 "reviewerNotes" VARCHAR(2000),
 "reviewedBy" TEXT,
 "reviewedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "FounderJournalRevision_status_scheduledAt_idx" ON "FounderJournalRevision"("status", "scheduledAt");
