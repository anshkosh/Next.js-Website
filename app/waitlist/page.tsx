import { redirect } from "next/navigation";
import { seoMetadata } from "@/lib/seo";

export const metadata = { ...seoMetadata({ title: "List your startup — Anshkosh", description: "Create your Anshkosh founder account and submit your startup for review.", path: "/waitlist" }), robots: { index: false, follow: false } };

// Preserve the founder link used in existing marketing material.
export default function WaitlistPage() {
  redirect("/startup/new");
}
