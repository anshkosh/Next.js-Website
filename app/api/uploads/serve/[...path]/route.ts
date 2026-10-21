import { publicStartupWhere } from "@/lib/startup-visibility";
import { NextRequest, NextResponse } from "next/server";
import { r2 } from "@/lib/storage/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { publicPitchDeck, mayReadDeck } from "@/lib/pitch-deck-access";
import { pitchDeckUrlSchema } from "@/lib/validators/pitch-deck.schema";
import { journalImagePattern } from "@/lib/journal-rich-text";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.path.join("/");
    // Storage also holds encrypted operations backups; never expose arbitrary keys.
    if (!["logos", "gallery", "founders", "pitch-decks", "journal", "update-images", "founder-journal"].includes(resolvedParams.path[0])) return new NextResponse("Not Found", { status: 404 });
    if (resolvedParams.path.some(part => !/^[a-zA-Z0-9._-]+$/.test(part) || part === "." || part === "..")) return new NextResponse("Not Found", { status: 404 });
    const isPitchDeck = key.startsWith("pitch-decks/");
    const isFounderJournal = key.startsWith("founder-journal/");
    if (isFounderJournal) {
      const url = `/api/uploads/serve/${key}`;
      if (!journalImagePattern.test(url)) return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
      const ownerId = resolvedParams.path[1];
      const session = await auth.api.getSession({ headers: req.headers });
      if (session?.user.id !== ownerId) {
        const shared = await db.founderJournalEntry.findFirst({
          where: { authorId: ownerId, visibility: "PUBLIC", approvedAt: { not: null }, publishedAt: { lte: new Date() }, mediaKeys: { has: key }, startup: { ...publicStartupWhere, founderId: ownerId } }, select: { id: true },
        });
        const reviewer = session?.user.emailVerified && !session.user.banned && ["admin", "reviewer"].includes(session.user.role ?? "");
        const submitted = !shared && reviewer ? await db.founderJournalRevision.findFirst({
          where: {
            status: { in: ["PENDING_REVIEW", "SCHEDULED"] },
            entry: { authorId: ownerId, visibility: "PUBLIC" },
            data: { path: ["contentJson", "ops"], array_contains: [{ insert: { image: url } }] },
          }, select: { id: true },
        }) : null;
        if (!shared && !submitted) return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "private, no-store", "Vary": "Cookie" } });
      }
    }
    if (isPitchDeck) {
      const url = `/api/uploads/serve/${key}`;
      if (!pitchDeckUrlSchema.safeParse(url).success) return new NextResponse("Not Found", { status: 404 });
      const profiles = await db.startup.findMany({ where: { ...publicStartupWhere, metadata: { path: ["pitchDeckUrl"], equals: url } }, select: { metadata: true } });
      const isPublic = profiles.some(profile => publicPitchDeck(profile.metadata) === url);
      if (!isPublic) {
        const session = await auth.api.getSession({ headers: req.headers });
        if (!mayReadDeck(session?.user, resolvedParams.path[1])) return new NextResponse("Not Found", { status: 404, headers: { "Cache-Control": "private, no-store" } });
      }
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    });

    const response = await r2.send(command);
    if (!response.Body) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const byteArray = await response.Body.transformToByteArray();
    return new NextResponse(Buffer.from(byteArray), {
      headers: {
        "Content-Type": response.ContentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(isFounderJournal ? { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff" } : {}),
        ...(isPitchDeck ? {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="pitch-deck.pdf"',
          "Content-Security-Policy": "sandbox",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "private, no-store",
          "Vary": "Cookie",
        } : {}),
      },
    });
  } catch (error) {
    console.error("Error serving R2 object:", error);
    return new NextResponse("Not Found", { status: 404 });
  }
}
