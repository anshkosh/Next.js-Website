CREATE TABLE "StartupUpdateRevision" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "editorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StartupUpdateRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentRevision" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "editorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FounderReplyRevision" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reply" VARCHAR(2000) NOT NULL,
    "repliedBy" TEXT,
    "editorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FounderReplyRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommentManagementToken" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommentManagementToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommentManagementToken_tokenHash_key" ON "CommentManagementToken"("tokenHash");
CREATE INDEX "StartupUpdateRevision_updateId_createdAt_idx" ON "StartupUpdateRevision"("updateId", "createdAt" DESC);
CREATE INDEX "CommentRevision_commentId_createdAt_idx" ON "CommentRevision"("commentId", "createdAt" DESC);
CREATE INDEX "FounderReplyRevision_commentId_createdAt_idx" ON "FounderReplyRevision"("commentId", "createdAt" DESC);
CREATE INDEX "CommentManagementToken_commentId_expiresAt_idx" ON "CommentManagementToken"("commentId", "expiresAt");

ALTER TABLE "StartupUpdateRevision" ADD CONSTRAINT "StartupUpdateRevision_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "StartupUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentRevision" ADD CONSTRAINT "CommentRevision_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FounderReplyRevision" ADD CONSTRAINT "FounderReplyRevision_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommentManagementToken" ADD CONSTRAINT "CommentManagementToken_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
