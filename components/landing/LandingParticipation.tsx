"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";

export default function LandingParticipation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const participationItems = [
    { label: "Give feedback on a startup", allowed: true },
    { label: "Join a waitlist", allowed: true },
    { label: "Express interest", allowed: true },
    { label: "Make a payment", allowed: false },
    { label: "Place an order", allowed: false },
  ];

  return (
    <section className="bg-white py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-7 space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
              Participation starts <span className="text-coral-500">before payment.</span>
            </h2>

            <div className="space-y-4 text-gray-600 leading-relaxed text-base sm:text-lg">
              <p>
                The current site is an early-access pilot. Public validation, campaign previews, and interest lists may be available, but backing payments and reward orders are not currently open.
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                Joining a list, giving feedback, or expressing interest does not create a pledge, purchase, investment, or promise.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/faq"
                className="text-coral-500 hover:text-coral-600 font-semibold text-base inline-flex items-center gap-1.5 transition-colors group"
              >
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Right Column: Illustration Card with Stacked List */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-5"
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg space-y-3 relative overflow-hidden">
              <div className="pb-3 border-b border-gray-100 mb-4">
                <h3 className="font-bold text-gray-900 font-heading text-sm uppercase tracking-wider text-gray-500">
                  Pilot Engagement Model
                </h3>
              </div>

              {participationItems.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                    item.allowed
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-400 border-gray-200 line-through opacity-75"
                  }`}
                >
                  {item.allowed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                  <span>{item.allowed ? `✓ ${item.label}` : `✕ ${item.label}`}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
