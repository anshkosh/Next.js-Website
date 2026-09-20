import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && (forwardedProto === "http" || request.nextUrl.protocol === "http:")) {
    const secureUrl = request.nextUrl.clone();
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl, 308);
  }

  // Better Auth provides a way to get session from headers in Next.js middleware
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const path = request.nextUrl.pathname;

  const isFounderRoute = path.startsWith("/dashboard") || path.startsWith("/startup/");
  const isAdminRoute = path.startsWith("/admin/") && !path.startsWith("/admin/login");

  if (isFounderRoute) {
    if (!session) {
      const destination = path === "/startup/new" ? "/register" : "/login";
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const role = session.user.role;
    const isSuperAdminOnly = path.startsWith("/admin/settings") || path.startsWith("/admin/admins");
    
    if (role !== "admin" && role !== "reviewer") {
      return NextResponse.redirect(new URL("/login", request.url)); // or a 403 page
    }

    if (isSuperAdminOnly && role !== "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
