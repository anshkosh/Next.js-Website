import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Terms of Service — Anshkosh",
  description: "Terms for using the Anshkosh early-access platform and beta tester request feature.",
  path: "/terms",
});

const sections = [
  {
    title: "The pilot service",
    paragraphs: [
      "Anshkosh is an early-access platform for discovering startup profiles, following founder progress, sharing feedback, and using free founder tools. Features and availability may change during the pilot. Payments, preorders, and investments are not open through Anshkosh during the pilot.",
      "A published or featured profile, vote, comment, or beta tester request does not verify a startup or its claims, guarantee that it will succeed, or create an order, investment, or financial entitlement.",
    ],
  },
  {
    title: "Accounts and acceptable use",
    paragraphs: [
      "Keep account details accurate, protect your sign-in credentials, and use the platform lawfully. Do not impersonate another person, submit information without permission, manipulate votes, harass others, distribute spam, or attempt to access another person’s account or private information.",
      "You are responsible for the accuracy of information and for having the rights needed to submit any text, image, link, or other material. Do not submit passwords, financial credentials, confidential trade secrets, or sensitive personal information in public profiles or discussions.",
    ],
  },
  {
    title: "Beta tester requests",
    paragraphs: [
      "A beta tester request is an expression of interest, not a promise of selection or access. Requests are currently limited to people aged 18 or older. Anshkosh shares your name and optional note with the selected startup’s founder for review. If the founder approves your request, Anshkosh shares your email address with that founder so they can contact you.",
      "The founder decides whether to accept a request and is responsible for contacting approved testers and arranging product access, onboarding, support, and any reward stated on the startup page. Anshkosh does not provide the product being tested, guarantee a reward, or manage the founder’s beta program. Applicants should review the separate Beta Tester Consent Notice before submitting a request.",
      "Founders must describe the beta opportunity and any reward accurately, use tester details only to review and coordinate that opportunity, keep contact details private, and remove records they no longer need. A reward does not create a payment or preorder through Anshkosh.",
    ],
  },
  {
    title: "Content and moderation",
    paragraphs: [
      "You retain ownership of material you submit. You give Anshkosh permission to store, review, display, and distribute that material as needed to operate the feature you used and the platform. Public content may be visible, indexed, copied, or shared by others. Do not submit content you intend to keep confidential.",
      "We may review, restrict, or remove content or access when reasonably needed to protect people, enforce these terms, comply with law, or keep the pilot operating safely. Profile review is not independent verification of every claim.",
    ],
  },
  {
    title: "Privacy and requests",
    paragraphs: [
      "The Privacy Notice explains the information Anshkosh handles, how to make privacy requests, and how to raise a concern. Beta tester data is handled as described in the Beta Tester Consent Notice.",
    ],
  },
  {
    title: "Availability and liability",
    paragraphs: [
      "The pilot is provided while it is being developed and may be changed, paused, or discontinued. To the extent permitted by applicable law, Anshkosh does not guarantee uninterrupted availability or the accuracy, safety, or performance of a third-party startup’s product. Nothing in these terms limits a right or remedy that cannot lawfully be limited.",
    ],
  },
];

export default function TermsPage() {
  return (
    <section className="min-h-screen bg-white px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-coral-600">PILOT TERMS</span>
        <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">Terms of Service</h1>
        <p className="mb-8 text-sm text-gray-600">Updated: 18 October 2026 · Operator: Anshkosh Pvt Ltd · Hyderabad, Telangana, India · Questions: <a className="font-semibold text-coral-700 underline" href="mailto:hello@anshkosh.com">hello@anshkosh.com</a></p>
        <div className="space-y-12 text-base leading-relaxed text-gray-600">
          {sections.map((section) => <section key={section.title} className="border-t border-gray-100 pt-8">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900">{section.title}</h2>
            <div className="space-y-4">{section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            {section.title === "Beta tester requests" && <p className="mt-4">Read the <Link href="/beta-consent" className="font-semibold text-coral-700 underline">Beta Tester Consent Notice</Link> for details of the information collected and shared.</p>}
            {section.title === "Privacy and requests" && <p className="mt-4">Read our <Link href="/privacy" className="font-semibold text-coral-700 underline">Privacy Notice</Link> and the <Link href="/beta-consent" className="font-semibold text-coral-700 underline">Beta Tester Consent Notice</Link>.</p>}
          </section>)}
          <section className="border-t border-gray-100 pt-8">
            <h2 className="mb-4 font-heading text-2xl font-bold text-gray-900">Contact</h2>
            <p>Questions about these terms can be sent to <a className="font-semibold text-coral-700 underline" href="mailto:hello@anshkosh.com">hello@anshkosh.com</a> or through our <Link href="/contact" className="font-semibold text-coral-700 underline">contact page</Link>.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
