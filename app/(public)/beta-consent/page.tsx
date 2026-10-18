import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Beta Tester Consent Notice — Anshkosh",
  description: "What Anshkosh collects and shares when you request to beta test a startup.",
  path: "/beta-consent",
});

export default function BetaTesterConsentPage() {
  return (
    <section className="min-h-screen bg-white px-4 py-16 md:py-24">
      <article className="mx-auto max-w-3xl">
        <span className="mb-4 block text-xs font-semibold uppercase tracking-widest text-coral-600">BETA TESTER DATA NOTICE</span>
        <h1 className="mb-4 font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">Beta Tester Consent Notice</h1>
        <p className="mb-8 text-sm text-gray-600">Updated: 18 October 2026 · Data fiduciary: Anshkosh Pvt Ltd · Grievance contact: Hyderabad, Telangana, India · <a href="mailto:hello@anshkosh.com" className="font-semibold text-coral-700 underline">hello@anshkosh.com</a></p>
        <p className="mb-10 text-lg leading-relaxed text-gray-600">Read this notice before asking to test a product. It explains what Anshkosh collects, what the startup founder can see, and what happens if your request is approved.</p>

        <div className="space-y-9 text-base leading-relaxed text-gray-600">
          <section className="border-t border-gray-100 pt-7">
            <h2 className="mb-3 font-heading text-2xl font-bold text-gray-900">Information and purpose</h2>
            <p>To route your request, Anshkosh collects your name, email address, the startup you chose, any optional note you submit, and a record of the consent notice version and time you accepted it. CAPTCHA and rate-limit checks may process browser or request information to reduce spam. We use these details only to record and route your interest, let the founder review it, prevent abuse, and handle related privacy or support requests. Your information is not used for marketing through this feature.</p>
          </section>

          <section className="border-t border-gray-100 pt-7">
            <h2 className="mb-3 font-heading text-2xl font-bold text-gray-900">What the founder can see</h2>
            <p>The founder of the startup you selected can see your name and optional note while reviewing the request. Your email stays hidden from the founder until they approve you. If approved, Anshkosh shares your email address with that founder so they can contact you directly. The request is not published publicly or shared with other founders. Anshkosh does not independently verify the email address you enter.</p>
          </section>

          <section className="border-t border-gray-100 pt-7">
            <h2 className="mb-3 font-heading text-2xl font-bold text-gray-900">Your choice and withdrawal</h2>
            <p>Beta requests are optional and are currently for people aged 18 or older. You must actively check the consent box before sending a request. You may ask Anshkosh to withdraw or delete a pending request by emailing <a href="mailto:hello@anshkosh.com" className="font-semibold text-coral-700 underline">hello@anshkosh.com</a> with the startup name and the email address you used. If the founder has already approved you, contact the founder and Anshkosh if you want to stop taking part or ask us to remove our copy.</p>
          </section>

          <section className="border-t border-gray-100 pt-7">
            <h2 className="mb-3 font-heading text-2xl font-bold text-gray-900">Founder contact and beta access</h2>
            <p>The founder decides whether to accept your request. Approval does not guarantee that a product, service, reward, or particular testing experience will be available. The founder—not Anshkosh—will contact approved testers and arrange access, onboarding, support, and any reward described on the startup page. Anshkosh does not handle payments or provide the product being tested.</p>
          </section>

          <section className="border-t border-gray-100 pt-7">
            <h2 className="mb-3 font-heading text-2xl font-bold text-gray-900">Retention and requests</h2>
            <p>If a founder declines your request, we remove your name, email address, and note. Pending requests expire after 90 days; approved contact details expire 180 days after approval. Hourly housekeeping removes those personal details and closes the request. Expired details are excluded from the founder dashboard even before housekeeping runs. Founders can clear pending requests older than 30 days or remove approved requests sooner. Minimal closed consent records are removed after a further year. You can contact Anshkosh to request earlier removal. A founder may have copied your contact details outside Anshkosh; we cannot remove those separate copies. You can also ask us questions, request access or correction, or raise a privacy grievance using the email above. See the <Link href="/privacy" className="font-semibold text-coral-700 underline">Privacy Notice</Link> for the broader policy.</p>
          </section>
        </div>
      </article>
    </section>
  );
}
