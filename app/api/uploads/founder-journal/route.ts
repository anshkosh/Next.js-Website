import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { authorizeUpload, uploadFailure, UploadError } from "@/lib/uploads/safety";
import { scanIfEnabled } from "@/lib/uploads/scan";
import { storeUpload } from "@/lib/uploads/store";

export async function POST(req: NextRequest) {
  try {
    const maxBytes = 5 * 1024 * 1024;
    const user = await authorizeUpload(req, maxBytes);
    const file = (await req.formData()).get("file");
    if (!(file instanceof File) || !file.size || !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) throw new UploadError("Choose a PNG, JPG, WebP or GIF image.", 400);
    if (file.size > maxBytes) throw new UploadError("This image must be smaller than 5 MB.", 413);
    const original = Buffer.from(await file.arrayBuffer());
    await scanIfEnabled(original);
    let bytes: Buffer;
    try {
      bytes = await sharp(original, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    } catch { throw new UploadError("This image could not be read. Try another image.", 400); }
    const key = `founder-journal/${user.id}/${randomUUID()}.webp`;
    await storeUpload(user.id, key, bytes, "image/webp");
    return NextResponse.json({ url: `/api/uploads/serve/${key}` });
  } catch (error) { return uploadFailure(error); }
}
