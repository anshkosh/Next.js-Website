-- CreateTable
CREATE TABLE "FeaturedStartup" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedStartup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedStartup_sortOrder_idx" ON "FeaturedStartup"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedStartup_startupId_key" ON "FeaturedStartup"("startupId");

-- AddForeignKey
ALTER TABLE "FeaturedStartup" ADD CONSTRAINT "FeaturedStartup_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
