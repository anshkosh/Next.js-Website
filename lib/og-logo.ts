import { GetObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { r2 } from "@/lib/storage/r2";

// Never hand a profile-controlled URL to the renderer. Only immutable logo
// objects are loaded through our configured SDK endpoint (no HTTP redirects).
export async function ogLogo(url: string | null): Promise<string | undefined> {
  const match = url?.match(/^\/api\/uploads\/serve\/(logos\/[a-zA-Z0-9_-]+\.(?:webp|png|jpg|jpeg))$/);
  if (!match) return;
  try {
    const object = await r2.send(new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: match[1] }), { abortSignal: AbortSignal.timeout(3000) });
    if (!object.Body || (object.ContentLength ?? 0) > 2 * 1024 * 1024) return;
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) return;
      chunks.push(Buffer.from(chunk));
    }
    const png = await sharp(Buffer.concat(chunks), { limitInputPixels: 40_000_000 })
      .resize({ width: 200, height: 200, fit: "inside", withoutEnlargement: true }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return; // Missing/corrupt logos must not break share images.
  }
}
