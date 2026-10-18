import NewsletterConfirmation from "@/components/marketing/NewsletterConfirmation";
import { seoMetadata } from "@/lib/seo";
export const metadata = { ...seoMetadata({ title: "Confirm newsletter signup", description: "Confirm your request for Anshkosh updates.", path: "/newsletter/confirm" }), robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <section className="mx-auto max-w-xl space-y-6 px-4 py-16"><h1 className="text-3xl font-bold">Confirm your newsletter signup</h1><NewsletterConfirmation token={typeof token === "string" ? token : ""} mode="confirm" /></section>;
}
