import type { Prisma } from "@prisma/client";
import { contentHash, type ModerationContent, type ModerationKind } from "./moderation-policy";

export async function queueModeration(tx: Prisma.TransactionClient, kind: ModerationKind, targetId: string, content: ModerationContent) {
  const fields = { contentHash: contentHash(content), status: "PENDING", reasons: [], attempts: 0,
    nextAttemptAt: new Date(), leaseToken: null, checkedAt: null, reviewedAt: null, reviewedBy: null };
  return tx.contentModeration.upsert({
    where: { kind_targetId: { kind, targetId } },
    create: { kind, targetId, ...fields,
      ...(kind === "UPDATE" ? { updateId: targetId } : kind === "JOURNAL" ? { revisionId: targetId } : { commentId: targetId }) },
    update: fields,
  });
}
