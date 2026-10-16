CREATE TYPE "FounderEntryVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TABLE "FounderJournalEntry" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "startupId" TEXT,
    "title" VARCHAR(180) NOT NULL,
    "body" VARCHAR(12000) NOT NULL,
    "prompt" VARCHAR(30) NOT NULL DEFAULT 'FREE_WRITE',
    "visibility" "FounderEntryVisibility" NOT NULL DEFAULT 'PRIVATE',
    "milestone" VARCHAR(180),
    "milestoneDone" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FounderJournalEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "FounderJournalEntry_authorId_updatedAt_idx" ON "FounderJournalEntry"("authorId", "updatedAt" DESC);
CREATE INDEX "FounderJournalEntry_startupId_visibility_publishedAt_idx" ON "FounderJournalEntry"("startupId", "visibility", "publishedAt" DESC);
ALTER TABLE "FounderJournalEntry" ADD CONSTRAINT "FounderJournalEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FounderJournalEntry" ADD CONSTRAINT "FounderJournalEntry_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
