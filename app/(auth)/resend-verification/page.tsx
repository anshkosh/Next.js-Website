import Link from "next/link";
import ResendVerification from "@/components/auth/ResendVerification";
import { seoMetadata } from "@/lib/seo";
import { safeReturnPath } from "@/lib/login-return";

export const metadata = { ...seoMetadata({ title: "Resend verification — Anshkosh", description: "Request another email verification link.", path: "/resend-verification" }), robots: { index: false, follow: false } };
export default async function ResendVerificationPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const suppliedNext = (await searchParams).next;
  const next = safeReturnPath(typeof suppliedNext === "string" ? suppliedNext : undefined);
  const signInHref = `/login?next=${encodeURIComponent(next)}`;
  return <main className="mx-auto max-w-md px-4 py-16"><h1 className="font-heading text-3xl font-bold">Verify your email</h1><p className="mt-3 text-sm text-gray-600">Use the address you registered with to request a new link. Only the latest link may work.</p><ResendVerification next={next} /><Link href={signInHref} className="mt-6 inline-flex min-h-11 items-center font-semibold text-coral-700 underline">Return to sign in</Link></main>;
}
