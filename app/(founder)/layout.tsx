import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FounderTopbar from "./FounderTopbar";

export const dynamic = "force-dynamic";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FounderTopbar user={session.user} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
