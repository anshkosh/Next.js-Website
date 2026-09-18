"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight } from "lucide-react";

export default function LandingFAQTeaser() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "What is Anshkosh?",
      a: "Anshkosh is a public validation platform for startups, with an optional reward-crowdfunding path. Founders can test a solution, publish evidence and risks, collect structured public signals, and share what they learn before deciding whether to launch a campaign.",
    },
    {
      q: "Can I back a campaign now?",
      a: "No. The current site is an early-access pilot. Public validation, campaign previews, applications, accounts, and interest lists may be available, but backing payments and reward orders are not currently open.",
    },
    {
      q: "Is public validation the same as investing?",
      a: "No. Validation is a learning and decision-support process. It does not offer securities, ownership, dividends, interest, loans, or financial returns.",
    },
    {
      q: "Which startups can apply?",
      a: "Founders should have a demonstrable prototype, service, or clear offer; a specific problem and audience; a testable hypothesis; evidence or a plan to gather it; and willingness to publish updates and limitations.",
    },
  ];

  const toggleFAQ = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="bg-gray-50 py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-3xl space-y-10">
        {/* Section Heading & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-2"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
            Questions <span className="text-coral-500">worth answering only.</span>
          </h2>
          <p className="text-gray-500 text-base sm:text-lg font-medium">
            Clear before clever.
          </p>
        </motion.div>

        {/* 4 FAQ Accordion Cards */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 25 }}
                transition={{ duration: 0.5, delay: 0.1 * idx, ease: "easeOut" }}
                className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-bold font-heading text-gray-900 text-base sm:text-lg group hover:text-coral-600 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-coral-50 group-hover:text-coral-500 text-gray-400 flex items-center justify-center transition-all shrink-0 ${
                      isOpen ? "bg-coral-50 text-coral-500 rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-5 pb-5 pt-1 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100 mt-1">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA Button: Fades in last */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          className="text-center pt-2"
        >
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white px-6 py-3 rounded-lg font-medium text-base transition-colors shadow-md shadow-coral-500/20 group"
          >
            <span>View all FAQs</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
