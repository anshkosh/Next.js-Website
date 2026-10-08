import { seoMetadata } from "@/lib/seo";
import FAQContent from "./FAQContent";
import { faqData } from "@/lib/faqs";

export const metadata = seoMetadata({
  title: "FAQ — Anshkosh",
  description: "Answers about discovering Indian startups, submitting a free startup profile, using the founder toolkit, and participating in the Anshkosh pilot.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqData.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      }) }} />
      <section className="page-intro-spacing bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="page-title">
          FAQs
        </h1>
        <p className="text-lg leading-relaxed text-gray-600 mt-4 mb-10">
          Answers about startup listings, free tools, and the early-access pilot.
        </p>
        <FAQContent />
      </div>
      </section>
    </>
  );
}
