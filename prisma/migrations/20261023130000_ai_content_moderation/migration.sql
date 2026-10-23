-- AlterTable
ALTER TABLE "StartupUpdate" ADD COLUMN     "status" "CommentStatus" NOT NULL DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "pendingRepliedBy" TEXT,
ADD COLUMN     "pendingReply" VARCHAR(2000);

-- CreateTable
CREATE TABLE "ContentModeration" (
    "id" TEXT NOT NULL,
    "kind" VARCHAR(20) NOT NULL,
    "targetId" TEXT NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseToken" TEXT,
    "checkedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "commentId" TEXT,
    "updateId" TEXT,
    "revisionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentModeration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationBudget" (
    "day" VARCHAR(10) NOT NULL,
    "requests" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModerationBudget_pkey" PRIMARY KEY ("day")
);

-- CreateIndex
CREATE INDEX "ContentModeration_status_nextAttemptAt_idx" ON "ContentModeration"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentModeration_kind_targetId_key" ON "ContentModeration"("kind", "targetId");

-- AddForeignKey
ALTER TABLE "ContentModeration" ADD CONSTRAINT "ContentModeration_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModeration" ADD CONSTRAINT "ContentModeration_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "StartupUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentModeration" ADD CONSTRAINT "ContentModeration_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "FounderJournalRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
