import NewsletterConfirmation from "@/components/marketing/NewsletterConfirmation";
import { seoMetadata } from "@/lib/seo";
export const metadata = { ...seoMetadata({ title: "Unsubscribe from newsletter", description: "Withdraw your newsletter consent without signing in.", path: "/newsletter/unsubscribe" }), robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <section className="mx-auto max-w-xl space-y-6 px-4 py-16"><h1 className="text-3xl font-bold">Unsubscribe from newsletter</h1><NewsletterConfirmation token={typeof token === "string" ? token : ""} mode="unsubscribe" /></section>;
}
