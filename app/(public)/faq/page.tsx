import { seoMetadata } from "@/lib/seo";
import FAQContent from "./FAQContent";

export const metadata = seoMetadata({
  title: "FAQ — Anshkosh",
  description: "Frequently asked questions about Anshkosh, the public validation platform for Indian startups.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "What is Anshkosh?", acceptedAnswer: { "@type": "Answer", text: "Anshkosh is a public validation platform for startups, with an optional reward-crowdfunding path." } },
          { "@type": "Question", name: "Can I back a campaign now?", acceptedAnswer: { "@type": "Answer", text: "No. The current site is an early-access pilot and backing payments and reward orders are not currently open." } },
          { "@type": "Question", name: "Is public validation the same as investing?", acceptedAnswer: { "@type": "Answer", text: "No. Validation is a learning and decision-support process and does not offer securities, ownership, dividends, interest, loans, or financial returns." } },
          { "@type": "Question", name: "Which startups can apply?", acceptedAnswer: { "@type": "Answer", text: "Founders should have a demonstrable prototype, service, or clear offer; a specific problem and audience; and a testable hypothesis." } },
        ],
      }) }} />
      <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 tracking-tight">
          FAQs
        </h1>
        <p className="text-xl text-gray-500 mt-4 mb-12">
          Clear before clever.
        </p>
        <FAQContent />
      </div>
      </section>
    </>
  );
}
