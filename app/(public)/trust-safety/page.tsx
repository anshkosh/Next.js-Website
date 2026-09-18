import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Safety — Anshkosh",
  description:
    "How Anshkosh keeps public validation and campaigns accountable.",
};

export default function TrustSafetyPage() {
  return (
    <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* Badge & Title */}
        <span className="text-xs font-semibold text-coral-500 tracking-widest uppercase mb-4 block">
          TRUST & SAFETY
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4 tracking-tight">
          Trust & Safety
        </h1>
        <p className="text-xl text-gray-500 mb-4">
          How Anshkosh keeps public validation and campaigns accountable.
        </p>
        <p className="text-sm text-gray-400 mb-8 block">
          Reference: https://www.anshkosh.com/
        </p>

        {/* Sections */}
        <div className="space-y-12">
          {/* Section 1 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Purpose
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Anshkosh is designed to establish authentic public proof and transparent validation standards. We maintain strict trust guidelines to ensure that founders publish honest metrics and that supporters participate in a safe, accountable environment.
            </p>
          </div>

          {/* Section 2 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Founder and campaign checks
            </h2>
            <ul className="space-y-3 text-gray-600 leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Identity screening and contact verification for all founding team members</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Pre-listing review of startup briefs, prototype status, and website URLs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Methodological check ensuring claims are separated from measured events</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Rejection of fraudulent projects, clone listings, or deceptive claims</span>
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Validation integrity
            </h2>
            <ul className="space-y-3 text-gray-600 leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Prohibition of purchased, fabricated, or bot-generated upvotes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Technical abuse controls including browser fingerprinting and rate limiting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Requirement for founders to disclose test methodology and limitations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Right to request supporting documentation for published traction claims</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Clear labeling of unverified vs. verified milestone logs</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Removal or suspension of listings violating integrity standards</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Content and conduct
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Participants must maintain respectful, constructive communication. We enforce zero tolerance for harassment, hate speech, spam, intellectual property theft, or deceptive impersonation.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              No endorsement or guarantee
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Listing on Anshkosh does not constitute an endorsement, financial recommendation, or guarantee of product delivery. Backers and visitors participate at their own discretion.
            </p>
          </div>

          {/* Section 6 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Current payment status
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              During the current early-access pilot phase, backing payments, crowdfunding pledges, and reward orders are not active. Interest lists and upvotes create no financial obligation or entitlement.
            </p>
          </div>

          {/* Section 7 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Participant responsibility
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Founders are responsible for fulfilling their public commitments and accurately representing their progress. Supporters are encouraged to examine evidence logs critically and ask questions before backing future campaigns.
            </p>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className="text-sm text-gray-400 italic mt-12 pt-6 border-t border-gray-100">
          This documentation does not replace jurisdiction-specific legal advice.
        </p>
      </div>
    </section>
  );
}
