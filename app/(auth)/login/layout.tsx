import { redirect } from "next/navigation";
import { viewerSession } from "@/lib/viewer-session";

// Always check the session per request, even when a build has no database configured.
export const dynamic = "force-dynamic";

// Signed-in visitors have nothing to do on this form; send them to their dashboard.
export default async function SignedOutOnlyLayout({ children }: { children: React.ReactNode }) {
  if (await viewerSession()) redirect("/dashboard");
  return children;
}
