import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfileSettings from "@/components/account/ProfileSettings";
import { seoMetadata } from "@/lib/seo";

export const metadata = {
  ...seoMetadata({
    title: "Profile settings — Anshkosh",
    description: "Manage your profile and founder mode.",
    path: "/settings",
  }),
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerified: true, founderMode: true },
  });
  if (!user) redirect("/login");
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="font-heading text-3xl font-bold text-gray-900">
        Profile settings
      </h1>
      <p className="mt-2 mb-8 text-gray-600">
        Your account, the way you use Anshkosh.
      </p>
      <ProfileSettings user={user} />
    </div>
  );
}
