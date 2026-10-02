import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { r2 } from "@/lib/storage/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { validatePitchDeck, MAX_PITCH_DECK_BYTES } from "@/lib/validators/pitch-deck.schema";
import { getTrustedAuthOrigins } from "@/lib/auth-origins";

export async function POST(req: NextRequest) {
  try {
    // Do not allow a different website to upload using a visitor's session.
    const origin = req.headers.get("origin");
    const allowed = getTrustedAuthOrigins();
    if (process.env.NODE_ENV !== "production") allowed.push(req.nextUrl.origin);
    if (!origin || !allowed.includes(origin)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user || !session.user.emailVerified || session.user.banned) {
      return NextResponse.json({ error: "Sign in with a verified account to upload a pitch deck." }, { status: 401 });
    }
    if (Number(req.headers.get("content-length")) > MAX_PITCH_DECK_BYTES + 65536) {
      return NextResponse.json({ error: "The PDF must be smaller than 5 MB." }, { status: 413 });
    }
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
    const error = validatePitchDeck(file);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentError = validatePitchDeck(file, bytes);
    if (contentError) return NextResponse.json({ error: contentError }, { status: 400 });
    const key = `pitch-decks/${session.user.id}/${randomUUID()}.pdf`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key, Body: bytes, ContentType: "application/pdf",
      ContentDisposition: 'attachment; filename="pitch-deck.pdf"',
    }));
    return NextResponse.json({ url: `/api/uploads/serve/${key}` });
  } catch {
    return NextResponse.json({ error: "The upload failed. Please try again." }, { status: 500 });
  }
}
