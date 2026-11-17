import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { contentSecurityPolicy } from "@/lib/content-security-policy";

// Next.js discovers Proxy beside app/, rather than inside app/.
// Authentication and ownership checks remain in layouts and server actions.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Drop old build hashes when forwarding either legacy favicon URL.
  if (pathname === "/favicon.ico" || pathname === "/icon.svg") {
    return NextResponse.redirect(new URL("/favicon.png", request.url), 308);
  }

  const nonce = randomBytes(16).toString("base64");
  const policy = contentSecurityPolicy(nonce, process.env.NODE_ENV === "development");
  const requestHeaders = new Headers(request.headers);
  // Overwrite visitor-supplied values before Next.js extracts the SSR nonce.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-anshkosh-path", `${pathname}${search}`);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // API routes keep their own security headers, including PDF sandbox responses.
  matcher: [
    "/favicon.ico",
    "/icon.svg",
    "/((?!api(?:/|$)|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|txt|xml|json)$).*)",
  ],
};
