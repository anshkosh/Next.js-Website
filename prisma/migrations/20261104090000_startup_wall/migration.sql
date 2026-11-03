-- Additive Wall preferences. Existing featured startups are grandfathered in by owner instruction.
ALTER TABLE "Startup" ADD COLUMN "wallOptIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "wallImageUrl" TEXT NOT NULL DEFAULT '';
UPDATE "Startup" SET "wallOptIn" = true WHERE id IN (SELECT "startupId" FROM "FeaturedStartup");
