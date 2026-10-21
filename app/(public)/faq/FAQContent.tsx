"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqData } from "@/lib/faqs";

export default function FAQContent() {
  return (
    <div className="w-full">
      <Accordion className="w-full space-y-4">
        {faqData.map((item, index) => (
          <AccordionItem
            key={`faq-${index + 1}`}
            value={`faq-${index + 1}`}
            className="border border-gray-200 rounded-xl bg-white px-6 py-1 shadow-2xs hover:border-coral-200 transition-colors"
          >
            <AccordionTrigger headingLevel={2} className="text-left text-lg font-medium text-gray-900 hover:text-coral-600 hover:no-underline font-heading py-4">
              {item.question}
            </AccordionTrigger>
            <AccordionContent keepMounted className="text-gray-600 leading-relaxed text-base pb-5">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
