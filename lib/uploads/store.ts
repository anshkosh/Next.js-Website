import { r2 } from "@/lib/storage/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { reserveUpload } from "./safety";

export async function storeUpload(userId: string, key: string, bytes: Buffer, contentType: string) {
  const reserved = await reserveUpload(userId, key, bytes.length);
  try {
    await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: contentType,
      ...(contentType === "application/pdf" ? { ContentDisposition: 'attachment; filename="pitch-deck.pdf"' } : {}) }));
  } catch (error) {
    await db.mediaUpload.delete({ where: { id: reserved.id } }).catch(() => {});
    throw error;
  }
}
