ALTER TABLE "FounderJournalEntry" ADD COLUMN "contentJson" JSONB,
ADD COLUMN "mediaKeys" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
CREATE INDEX "FounderJournalEntry_mediaKeys_idx" ON "FounderJournalEntry" USING GIN ("mediaKeys");
