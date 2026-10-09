import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Trust & Safety — Anshkosh",
  description: "How profile review, founder-supplied evidence, moderation and voting work during the Anshkosh pilot.",
  path: "/trust-safety",
});

const sections = [
  { title: "What profile review means", paragraphs: [
    "Startup profiles are reviewed before publication. Founders should explain the problem, their approach, current stage and supporting evidence clearly. They remain responsible for the accuracy of their profile, links, media and updates.",
    "Publishing review should not be read as identity certification or independent verification of every claim. A published profile does not prove business registration, prototype performance, traction or product-market fit.",
  ] },
  { title: "Founder progress and evidence", paragraphs: [
    "Progress updates and proof points are supplied by founders. They should distinguish what they plan to do from what they have completed, and explain how results were measured, when the test took place and what its limitations are.",
    "The pilot does not present progress updates as independently verified milestone logs. Read the available evidence, ask questions and consider what remains uncertain.",
  ] },
  { title: "Votes and their limits", paragraphs: [
    "Signals are all-time upvotes minus downvotes. A visitor can have one active vote per startup, switch it or remove it. Votes reflect community opinion; they do not verify a startup’s claims or establish demand, revenue or product-market fit.",
    "Visitor cookies, a hash derived from request IP address and browser user-agent, and rate limits help reduce duplicate voting and abuse. These controls have limits and do not prove that every vote comes from a unique person. Do not buy, fabricate or automate votes.",
  ] },
  { title: "Discussion and conduct", paragraphs: [
    "Comments are reviewed before appearing publicly. Approved comments display the commenter’s name, text and posting date; comment email addresses remain private. Published founder replies are public too.",
    "Keep discussions respectful and useful. Do not submit harassment, hate speech, spam, deceptive impersonation, fabricated claims or material you do not have permission to share. Content that violates these standards may be rejected or removed.",
  ] },
  { title: "No endorsement or guarantee", paragraphs: [
    "Publication, featured placement and voting totals are not an endorsement or a guarantee that a startup will succeed or deliver a product. Founders remain responsible for their public commitments. Visitors should assess the evidence and the risks for themselves.",
  ] },
  { title: "Current pilot limits", paragraphs: [
    "The pilot supports startup profiles, progress, discovery, feedback and free founder tools. Payments and preorders are not open during the pilot. Investments are not offered. A profile, vote or expression of interest creates no financial obligation or order entitlement.",
  ] },
];

export default function TrustSafetyPage() {
  return (
    <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <span className="text-xs font-semibold text-coral-500 tracking-widest uppercase mb-4 block">TRUST & SAFETY</span>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4 tracking-tight">Trust & Safety</h1>
        <p className="text-xl text-gray-500 mb-4">Clear profiles, responsible feedback and an honest view of the pilot’s limits.</p>
        <p className="text-sm text-gray-600 mb-8">Updated: 9 October 2026 · Operator: Anshkosh</p>
        <div className="space-y-12">
          {sections.map(section => (
            <section key={section.title} className="pt-8 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">{section.title}</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed text-base">
                {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
          <section className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">Report a concern</h2>
            <p className="text-gray-600 leading-relaxed">If a profile, comment or voting pattern concerns you, <Link href="/contact" className="text-coral-700 underline underline-offset-4">contact the team</Link> or email <a href="mailto:hello@anshkosh.com" className="text-coral-700 underline underline-offset-4">hello@anshkosh.com</a>. Include the page link and the specific concern. Read the <Link href="/privacy" className="text-coral-700 underline underline-offset-4">Privacy Notice</Link> for how submitted information is handled.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
