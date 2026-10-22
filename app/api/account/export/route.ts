import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AccountPrivacyError, exportAccountData, privacyCodeSchema } from "@/lib/account-privacy";
import { limitPrivacyAction, privacyActor } from "@/lib/account-privacy-auth";
import { getTrustedAuthOrigins } from "@/lib/auth-origins";

const responseHeaders = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
export async function POST(request: NextRequest) {
  try {
    const origins = getTrustedAuthOrigins();
    if (process.env.NODE_ENV !== "production" && ["127.0.0.1", "localhost", "[::1]"].includes(request.nextUrl.hostname)) origins.push(request.nextUrl.origin);
    if (!origins.includes(request.headers.get("origin") ?? "")) throw new AccountPrivacyError("Invalid request origin.", 403);
    const actor = await privacyActor(request.headers);
    await limitPrivacyAction(actor.userId, "export", 10);
    const reader = request.body?.getReader();
    if (!reader) throw new AccountPrivacyError("Paste your download confirmation code.");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 1024) { await reader.cancel(); throw new AccountPrivacyError("The request is too large.", 413); }
      chunks.push(chunk.value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new AccountPrivacyError("Enter your download confirmation code."); }
    const parsed = z.object({ code: privacyCodeSchema }).strict().safeParse(body);
    if (!parsed.success) throw new AccountPrivacyError("Paste the complete download confirmation code.");
    const json = await exportAccountData(actor, parsed.data.code);
    return new NextResponse(json, { headers: { ...responseHeaders, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="anshkosh-account-data.json"' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof AccountPrivacyError ? error.message : "Your download could not be prepared. Please try again." }, { status: error instanceof AccountPrivacyError ? error.status : 500, headers: responseHeaders });
  }
}
