-- Optional private calendar date. Existing accounts remain unspecified.
ALTER TABLE "User" ADD COLUMN "dateOfBirth" TEXT NOT NULL DEFAULT '';
