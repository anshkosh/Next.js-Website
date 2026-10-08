import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { validatePitchDeck, MAX_PITCH_DECK_BYTES } from "@/lib/validators/pitch-deck.schema";
import { sanitizePdf, UnsafePdfError } from "@/lib/uploads/pdf-safety";
import { authorizeUpload, uploadFailure } from "@/lib/uploads/safety";
import { scanIfEnabled } from "@/lib/uploads/scan";
import { UPLOAD_SCAN_MODE } from "@/lib/uploads/scan-mode";
import { qpdfNormalize } from "@/lib/uploads/qpdf";
import { storeUpload } from "@/lib/uploads/store";

export async function POST(req: NextRequest) {
  try {
    const user = await authorizeUpload(req, MAX_PITCH_DECK_BYTES);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
    const error = validatePitchDeck(file);
    if (error) return NextResponse.json({ error }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const contentError = validatePitchDeck(file, bytes);
    if (contentError) return NextResponse.json({ error: contentError }, { status: 400 });
    let clean: Uint8Array;
    try {
      clean = await sanitizePdf(bytes);
    } catch (unsafe) {
      if (unsafe instanceof UnsafePdfError) return NextResponse.json({ error: unsafe.message }, { status: 400 });
      throw unsafe;
    }
    // Interim control while ClamAV is not installed: a second parser validates and rewrites the already-sanitised PDF.
    if (UPLOAD_SCAN_MODE === "sanitize-only") clean = await qpdfNormalize(Buffer.from(clean));
    if (clean.byteLength > MAX_PITCH_DECK_BYTES) return NextResponse.json({ error: "The PDF must be smaller than 5 MB." }, { status: 413 });
    const cleanBytes = Buffer.from(clean);
    await scanIfEnabled(cleanBytes);
    const key = `pitch-decks/${user.id}/${randomUUID()}.pdf`;
    await storeUpload(user.id, key, cleanBytes, "application/pdf");
    return NextResponse.json({ url: `/api/uploads/serve/${key}` });
  } catch (error) {
    return uploadFailure(error);
  }
}
