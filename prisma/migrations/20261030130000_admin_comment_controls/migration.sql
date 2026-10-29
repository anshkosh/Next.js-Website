ALTER TABLE "Comment"
  ADD COLUMN "deletedAt" TIMESTAMP(3),
  ADD COLUMN "deletedBy" TEXT,
  ADD COLUMN "deletionReason" VARCHAR(500),
  ADD COLUMN "deletedFromStatus" "CommentStatus";

CREATE INDEX "Comment_deletedAt_createdAt_idx" ON "Comment"("deletedAt", "createdAt" DESC);

CREATE TABLE "CommentStaffEvent" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "action" VARCHAR(16) NOT NULL CHECK ("action" IN ('EDIT', 'APPROVE', 'HIDE', 'DELETE', 'RESTORE')),
  "actorId" TEXT,
  "reason" VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentStaffEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommentStaffEvent_commentId_createdAt_idx" ON "CommentStaffEvent"("commentId", "createdAt" DESC);
ALTER TABLE "CommentStaffEvent" ADD CONSTRAINT "CommentStaffEvent_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id");

CREATE TABLE "CommentPurgeAudit" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "actorId" TEXT,
  "reason" VARCHAR(500) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommentPurgeAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CommentPurgeAudit_commentId_createdAt_idx" ON "CommentPurgeAudit"("commentId", "createdAt" DESC);
