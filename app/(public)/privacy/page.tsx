import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Notice — Anshkosh",
  description:
    "How Anshkosh handles information during the early-access pilot.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        {/* Badge & Title */}
        <span className="text-xs font-semibold text-coral-500 tracking-widest uppercase mb-4 block">
          PILOT PRIVACY NOTICE
        </span>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4 tracking-tight">
          Privacy Notice
        </h1>
        <p className="text-sm text-gray-400 mb-8 block">
          Reference: https://www.anshkosh.com/privacy
        </p>

        {/* Intro */}
        <p className="text-gray-600 text-base leading-relaxed mb-8">
          This notice describes information handled by the current Anshkosh early-access website and the planned public-validation model. It is a working product reference and should receive legal review before publication.
        </p>

        {/* Sections */}
        <div className="space-y-12">
          {/* Section 1 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              What the pilot may collect
            </h2>
            <ul className="space-y-3 text-gray-600 leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Founder details submitted via forms (name, contact info, startup details, links)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Interest-list signups (email, persona, requested updates)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Validation activity (actions taken on test pages, feedback submitted)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Technical data (IP addresses, browser signatures, device logs to prevent abuse)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-coral-500 font-bold shrink-0 mt-1">•</span>
                <span>Cookies & local tokens necessary for session management and vote tracking</span>
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              How information is used
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Collected data is used to operate the validation platform, verify founder identity, prevent bot-generated signals or voting fraud, analyze platform usage, communicate pilot updates, and refine future crowdfunding mechanics.
            </p>
          </div>

          {/* Section 3 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Public visibility
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Startup profiles, problem statements, evidence logs, reward proposals, and overall signal aggregates are intended for public discovery. Personal contact numbers, private credentials, and raw technical logs remain confidential and non-public.
            </p>
          </div>

          {/* Section 4 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Signals and consent
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              By submitting feedback, joining a waitlist, or completing a survey on Anshkosh, you consent to having your input aggregated and displayed to founders as validation telemetry. Your consent can be withdrawn by contacting support.
            </p>
          </div>

          {/* Section 5 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Service providers
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              We utilize trusted cloud infrastructure, database hosting, email delivery, and security providers to process data securely. All service providers are bound by strict data processing and confidentiality obligations.
            </p>
          </div>

          {/* Section 6 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Retention, choices, and security
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              We retain information only as long as necessary for platform operation, legal compliance, and abuse prevention. You may request account deletion, data access, or correction at any time.
            </p>
          </div>

          {/* Section 7 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Do not submit
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              Do not submit confidential trade secrets, unpatented proprietary source code, protected personal health information, or highly sensitive financial credentials through public validation forms.
            </p>
          </div>

          {/* Section 8 */}
          <div className="pt-8 border-t border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 font-heading">
              Contact
            </h2>
            <p className="text-gray-600 leading-relaxed text-base">
              If you have questions or privacy concerns regarding this notice, please contact us at{" "}
              <a href="mailto:hello@anshkosh.com" className="text-coral-500 hover:text-coral-600 font-semibold underline">
                hello@anshkosh.com
              </a>.
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
