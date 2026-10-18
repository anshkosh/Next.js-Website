-- Temporary featured placements expire automatically from public Discover queries.
ALTER TABLE "FeaturedStartup"
ADD COLUMN "featuredUntil" TIMESTAMP(3);
