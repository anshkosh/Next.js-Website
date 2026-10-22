import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "./db";
import { r2 } from "./storage/r2";

// Only recorded application uploads; never operations backups or arbitrary keys.
export function isErasableUploadKey(key: string) {
  return /^(logos|gallery|founders|pitch-decks|journal|update-images|founder-journal)\/[a-zA-Z0-9._/-]+$/.test(key)
    && key.split("/").every(part => part && part !== "." && part !== "..");
}
export async function eraseQueuedAccountMedia() {
  const pending = await db.mediaUpload.findMany({ where: { erasureRequestedAt: { not: null } }, orderBy: [{ erasureAttempts: "asc" }, { erasureRequestedAt: "asc" }], take: 20, select: { id: true, userId: true } });
  let removed = 0;
  for (const record of pending) {
    try {
      removed += await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`uploads:${record.userId}`}))::text`;
        const upload = await tx.mediaUpload.findUnique({ where: { id: record.id } });
        if (!upload?.erasureRequestedAt) return 0;
        if (!isErasableUploadKey(upload.key)) throw new Error("Unsupported queued upload key");
        await r2.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: upload.key }), { abortSignal: AbortSignal.timeout(10000) });
        await tx.mediaUpload.delete({ where: { id: upload.id } });
        return 1;
      }, { timeout: 15000 });
    } catch {
      // Rotate failed records behind untouched work; keep retrying without logging private keys.
      await db.mediaUpload.updateMany({ where: { id: record.id, erasureRequestedAt: { not: null } }, data: { erasureAttempts: { increment: 1 } } }).catch(() => {});
    }
  }
  return { attempted: pending.length, removed, remainingFromBatch: pending.length - removed };
}
