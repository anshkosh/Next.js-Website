-- AlterTable
ALTER TABLE "Startup" ADD COLUMN     "updateCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StartupUpdate" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StartupUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StartupUpdate_startupId_idx" ON "StartupUpdate"("startupId");

-- CreateIndex
CREATE INDEX "StartupUpdate_createdAt_idx" ON "StartupUpdate"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "StartupUpdate" ADD CONSTRAINT "StartupUpdate_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
