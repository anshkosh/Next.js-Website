-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "issuer" TEXT;

-- AlterTable
ALTER TABLE "Startup" ADD COLUMN     "galleryImages" TEXT[],
ADD COLUMN     "videoUrl" TEXT;

-- CreateTable
CREATE TABLE "StartupFounder" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "photoUrl" TEXT,
    "linkedinUrl" TEXT,
    "twitterUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StartupFounder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StartupFounder_startupId_idx" ON "StartupFounder"("startupId");

-- AddForeignKey
ALTER TABLE "StartupFounder" ADD CONSTRAINT "StartupFounder_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "Startup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
