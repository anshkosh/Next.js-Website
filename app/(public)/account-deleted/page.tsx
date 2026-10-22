import AccountDeletionConfirmation from "@/components/account/AccountDeletionConfirmation";
import { seoMetadata } from "@/lib/seo";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
  ...seoMetadata({ title: "Account deleted — Anshkosh", description: "Your account deletion confirmation.", path: "/account-deleted" }),
  robots: { index: false, follow: false },
};

export default async function AccountDeletedPage() {
  const session = await auth.api.getSession({ headers: await headers(), query: { disableCookieCache: true } });
  if (session?.user) redirect("/settings");
  return <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6"><AccountDeletionConfirmation /></div>;
}
