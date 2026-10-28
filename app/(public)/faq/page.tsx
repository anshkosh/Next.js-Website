import { seoMetadata } from "@/lib/seo";
import FAQContent from "./FAQContent";
import { faqData } from "@/lib/faqs";
import PublicPageIntro from "@/components/layout/PublicPageIntro";

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
      <div className="min-h-screen bg-white">
        <PublicPageIntro title="FAQs" description="Answers about startup listings, free tools, and the early-access pilot." />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <FAQContent />
        </div>
      </div>
    </>
  );
}
