import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { authorizeUpload, uploadFailure, UploadError } from "./safety";
import { scanIfEnabled } from "./scan";
import { storeUpload } from "./store";

export async function imageUpload(req: NextRequest, kind: "logos" | "gallery" | "founders") {
  try {
    const maxBytes = (kind === "gallery" ? 5 : 2) * 1024 * 1024;
    const user = await authorizeUpload(req, maxBytes);
    const file = (await req.formData()).get("file");
    if (!(file instanceof File)) throw new UploadError("Choose an image file.", 400);
    const types = kind === "gallery" ? ["image/png", "image/jpeg", "image/webp", "image/gif"] : ["image/png", "image/jpeg", "image/webp"];
    if (!types.includes(file.type) || !file.size) throw new UploadError("Choose a PNG, JPG or WebP image.", 400);
    if (file.size > maxBytes) throw new UploadError(`This image must be smaller than ${maxBytes / 1024 / 1024} MB.`, 413);
    const original = Buffer.from(await file.arrayBuffer());
    await scanIfEnabled(original);
    let bytes: Buffer;
    try {
      const pipeline = sharp(original, { limitInputPixels: 40_000_000 }).rotate();
      bytes = await (kind === "gallery" ? pipeline.resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 80 })
        : pipeline.resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 })).toBuffer();
    } catch { throw new UploadError("This image could not be read. Try another PNG, JPG or WebP image.", 400); }
    const key = `${kind}/${randomUUID()}.webp`;
    await storeUpload(user.id, key, bytes, "image/webp");
    return NextResponse.json({ url: `/api/uploads/serve/${key}` });
  } catch (error) { return uploadFailure(error); }
}
