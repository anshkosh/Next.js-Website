import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FounderTopbar from "./FounderTopbar";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect("/login");
  }

  const profile = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, founderMode: true } });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FounderTopbar user={{ name: profile?.name ?? session.user.name, email: session.user.email, founderMode: profile?.founderMode ?? false }} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
