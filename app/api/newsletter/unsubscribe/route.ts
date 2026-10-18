import { type NextRequest } from "next/server";
import { unsubscribeNewsletter } from "@/app/actions/newsletter.actions";

// RFC 8058 endpoint for a future bulk sender's List-Unsubscribe header.
// Possession of the secret token is the authority; no login or GET mutation.
export async function POST(request: NextRequest) {
  const result = await unsubscribeNewsletter(request.nextUrl.searchParams.get("token") || "");
  return new Response(null, { status: result.error ? 400 : 200, headers: { "Cache-Control": "no-store" } });
}
