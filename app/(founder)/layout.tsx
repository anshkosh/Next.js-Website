import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FounderTopbar from "./FounderTopbar";
import { db } from "@/lib/db";
import { loginHref } from "@/lib/login-return";

export const dynamic = "force-dynamic";

export default async function FounderLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect(loginHref((await headers()).get("x-anshkosh-path")));
  }

  const profile = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, image: true, founderMode: true } });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <FounderTopbar user={{ name: profile?.name ?? session.user.name, image: profile?.image, email: session.user.email, founderMode: profile?.founderMode ?? false }} />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
