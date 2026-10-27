import { loginHref } from "@/lib/login-return";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfileSettings from "@/components/account/ProfileSettings";
import AccountSecuritySettings from "@/components/account/AccountSecuritySettings";
import AccountDataSettings from "@/components/account/AccountDataSettings";
import { seoMetadata } from "@/lib/seo";

export const metadata = {
  ...seoMetadata({
    title: "Account settings — Anshkosh",
    description: "Manage your profile, notifications and sign-in security.",
    path: "/settings",
  }),
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(loginHref((await headers()).get("x-anshkosh-path")));
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, emailVerified: true, role: true, image: true, bio: true, location: true, websiteUrl: true, dateOfBirth: true, notifyStartupReviews: true, notifyVoteMilestones: true, notifyCommentActivity: true },
  });
  if (!user) redirect(loginHref((await headers()).get("x-anshkosh-path")));
  const hasPassword = await db.account.count({ where: { userId: session.user.id, providerId: "credential" } });
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-heading text-3xl font-bold text-gray-900">
        Account settings
      </h1>
      <p className="mt-2 mb-8 text-gray-600">
        Manage your profile, emails and sign-in details.
      </p>
      <div className="grid items-start gap-8 md:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Account settings sections" className="rounded-2xl border border-gray-200 bg-white p-3 md:sticky md:top-6">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Jump to</p>
          <div className="grid grid-cols-2 gap-1 text-sm font-semibold text-gray-800 md:grid-cols-1">
            {[
              ["#profile-settings", "Your profile"],
              ["#personal-details", "Personal details"],
              ["#email-notifications", "Email notifications"],
              ["#change-password", hasPassword ? "Change password" : "Set password"],
              ["#email-address", "Email address"],
              ["#other-devices", "Other devices"],
              ["#account-data", "Download your data"],
              ["#delete-account", "Account deletion"],
            ].map(([href, label]) => <a key={href} href={href} className="flex min-h-11 items-center rounded-lg px-3 py-2 hover:bg-coral-50 hover:text-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600">{label}</a>)}
          </div>
        </nav>
        <div className="min-w-0 space-y-8">
          <ProfileSettings user={user} />
          <AccountSecuritySettings email={user.email} emailVerified={user.emailVerified} hasPassword={hasPassword > 0} />
          <AccountDataSettings emailVerified={user.emailVerified} canDelete={user.role === "user"} />
        </div>
      </div>
    </div>
  );
}
