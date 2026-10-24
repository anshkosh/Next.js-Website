import { redirect } from "next/navigation";
import { viewerSession } from "@/lib/viewer-session";
import { headers } from "next/headers";
import { safeReturnPath } from "@/lib/login-return";

// Always check the session per request, even when a build has no database configured.
export const dynamic = "force-dynamic";

// Signed-in visitors have nothing to do on this form; send them to their dashboard.
export default async function SignedOutOnlyLayout({ children }: { children: React.ReactNode }) {
  if (await viewerSession()) {
    const currentPath = (await headers()).get("x-anshkosh-path") ?? "/login";
    let next: string | null = null;
    try { next = new URL(currentPath, "https://anshkosh.local").searchParams.get("next"); } catch {}
    redirect(safeReturnPath(next));
  }
  return children;
}
