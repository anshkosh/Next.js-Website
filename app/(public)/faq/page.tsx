import { seoMetadata } from "@/lib/seo";
import FAQContent from "./FAQContent";
import { faqData } from "@/lib/faqs";

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
        mainEntity: faqData.map(({ question, answer }) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
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
