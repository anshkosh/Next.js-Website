"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const faqData = [
  {
    question: "What is Anshkosh?",
    answer:
      "Anshkosh is a public validation platform for startups, with an optional reward-crowdfunding path. Founders can test a solution, publish evidence and risks, collect structured public signals, and share what they learn before deciding whether to launch a campaign.",
  },
  {
    question: "What can a founder validate?",
    answer:
      "A founder can test problem relevance, solution clarity, audience fit, behavioural intent, reward fit, and practical delivery assumptions.",
  },
  {
    question: "What counts as a validation signal?",
    answer:
      "Depending on the test, signals may include genuine feedback, survey responses, waitlist actions, pilot requests, service enquiries, preorder intent, or other defined actions. A signal is not automatically a customer, order, payment, revenue result, or promise.",
  },
  {
    question: "Can I back a campaign now?",
    answer:
      "No. The current site is an early-access pilot. Public validation, campaign previews, applications, accounts, and interest lists may be available, but backing payments and reward orders are not currently open.",
  },
  {
    question: "Is public validation the same as investing?",
    answer:
      "No. Validation is a learning and decision-support process. It does not offer securities, ownership, dividends, interest, loans, or financial returns.",
  },
  {
    question: "Does a positive validation result prove product-market fit?",
    answer:
      "No. Results may be affected by audience selection, incentives, duplicate submissions, timing, moderation, and incomplete data. Founders must state the method, timeframe, audience, and limitations.",
  },
  {
    question: "Can founders manipulate validation?",
    answer:
      "They must not buy, fabricate, conceal, or selectively misrepresent signals. Anshkosh may apply moderation and anti-abuse controls, request evidence, label limitations, or remove a test.",
  },
  {
    question: "What would a backer receive?",
    answer:
      "Only a formally opened reward campaign can define an exchange. It may offer a product, early access, founding-customer package, service, or experience. A validation page or interest list creates no entitlement.",
  },
  {
    question: "How are startups reviewed?",
    answer:
      "The workflow may include founder checks, submitted evidence review, risk disclosure, validation-method review, and assessment of whether the public page clearly separates claims from measured events.",
  },
  {
    question: "What if a future reward is delayed?",
    answer:
      "The final campaign terms and founder updates will govern. Validation and platform review do not guarantee delivery.",
  },
  {
    question: "Which startups can apply?",
    answer:
      "Founders should have a demonstrable prototype, service, or clear offer; a specific problem and audience; a testable hypothesis; evidence or a plan to gather it; and willingness to publish updates and limitations.",
  },
];

export default function FAQContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <Accordion className="w-full space-y-4">
        {faqData.map((item, index) => (
          <motion.div
            key={`faq-${index + 1}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
          >
            <AccordionItem
              value={`faq-${index + 1}`}
              className="border border-gray-200 rounded-xl bg-white px-6 py-1 shadow-2xs hover:border-coral-200 transition-colors"
            >
              <AccordionTrigger className="text-left text-lg font-medium text-gray-900 hover:text-coral-600 hover:no-underline font-heading py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed text-base pb-5">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
}
