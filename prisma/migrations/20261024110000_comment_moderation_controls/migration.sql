ALTER TABLE "Comment" ADD COLUMN "authorUserId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Comment" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "Comment" ADD COLUMN "reviewNote" VARCHAR(500);

CREATE INDEX "Comment_authorUserId_createdAt_idx" ON "Comment"("authorUserId", "createdAt" DESC);

CREATE TABLE "CommenterBlock" (
    "id" TEXT NOT NULL,
    "emailHash" VARCHAR(64) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "sourceCommentId" TEXT,
    "accountBanId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    CONSTRAINT "CommenterBlock_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommenterBlock_emailHash_key" ON "CommenterBlock"("emailHash");
CREATE INDEX "CommenterBlock_revokedAt_expiresAt_idx" ON "CommenterBlock"("revokedAt", "expiresAt");
CREATE INDEX "CommenterBlock_sourceCommentId_idx" ON "CommenterBlock"("sourceCommentId");
CREATE INDEX "CommenterBlock_accountBanId_idx" ON "CommenterBlock"("accountBanId");

CREATE TABLE "ModerationAccountBan" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "sourceCommentId" TEXT,
    "reason" VARCHAR(500) NOT NULL,
    "banMarker" VARCHAR(80) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedById" TEXT,
    CONSTRAINT "ModerationAccountBan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModerationAccountBan_sourceCommentId_key" ON "ModerationAccountBan"("sourceCommentId");
CREATE UNIQUE INDEX "ModerationAccountBan_banMarker_key" ON "ModerationAccountBan"("banMarker");
CREATE INDEX "ModerationAccountBan_targetUserId_revokedAt_expiresAt_idx" ON "ModerationAccountBan"("targetUserId", "revokedAt", "expiresAt");
