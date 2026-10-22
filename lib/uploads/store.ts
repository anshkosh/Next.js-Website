import { r2 } from "@/lib/storage/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { reserveUpload, UploadError } from "./safety";

export async function storeUpload(userId: string, key: string, bytes: Buffer, contentType: string) {
  const reserved = await reserveUpload(userId, key, bytes.length);
  try {
    await db.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`uploads:${userId}`}))::text`;
      const owner = await tx.user.findUnique({ where: { id: userId }, select: { id: true, banned: true } });
      const upload = await tx.mediaUpload.findUnique({ where: { id: reserved.id } });
      if (!owner || owner.banned || !upload || upload.erasureRequestedAt) throw new UploadError("Sign in again before uploading.", 401);
      await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: contentType,
        ...(contentType === "application/pdf" ? { ContentDisposition: 'attachment; filename="pitch-deck.pdf"' } : {}) }), { abortSignal: AbortSignal.timeout(10000) });
    }, { timeout: 15000 });
  } catch (error) {
    // A timed-out PUT may still have reached storage. Retain a durable cleanup row.
    await db.mediaUpload.updateMany({ where: { id: reserved.id }, data: { erasureRequestedAt: new Date() } }).catch(() => {});
    throw error;
  }
}
