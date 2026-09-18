import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/storage/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { headers } from "next/headers";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate type
    const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PNG, JPEG, WEBP, and GIF are allowed." }, { status: 400 });
    }

    // Validate size (5MB for gallery)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit." }, { status: 400 });
    }

    const originalBuffer = Buffer.from(await file.arrayBuffer());
    
    // Compress image
    const compressedBuffer = await sharp(originalBuffer)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const uniqueFileName = `${crypto.randomUUID()}.webp`;
    const key = `gallery/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: compressedBuffer,
      ContentType: "image/webp",
    });

    await r2.send(command);

    const publicUrl = `/api/uploads/serve/${key}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
