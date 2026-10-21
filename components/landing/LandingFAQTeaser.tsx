import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { faqData } from "@/lib/faqs";

const questions = ["Is listing my startup free?", "Which startups can apply?", "What happens after I submit?", "Can I use the tools without an account?", "What can I do during the pilot?"];

export default function LandingFAQTeaser() {
  return (
    <section aria-labelledby="home-faq-title" className="border-t border-gray-200 bg-white py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_1.5fr] md:gap-16">
        <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">A few things to know</p><h2 id="home-faq-title" className="font-heading text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Before you start.</h2><p className="mt-4 text-sm leading-relaxed text-gray-600">Straightforward answers about listing, free tools, and the early-access pilot.</p><Link href="/faq" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-coral-700 hover:text-coral-900">Read all FAQs <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
        <div className="divide-y divide-gray-200 border-y border-gray-200">{questions.map(question => {
          const faq = faqData.find(faq => faq.question === question)!;
          return <details key={question} className="group t-acc"><summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 font-semibold text-gray-900 hover:text-coral-700 [&::-webkit-details-marker]:hidden"><span>{faq.question}</span><Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-coral-600 transition-transform group-open:rotate-45 motion-reduce:transition-none" /></summary><p className="pb-5 text-sm leading-relaxed text-gray-600">{faq.answer}</p></details>;
        })}</div>
      </div>
    </section>
  );
}
