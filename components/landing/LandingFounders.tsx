"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, UserCheck } from "lucide-react";

export default function LandingFounders() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const placeholderFounders = [
    {
      name: "Coming Soon",
      role: "Early Access Founder",
      category: "Developer Tools",
      tagline: "Building autonomous API middleware with verifiable demand logs.",
    },
    {
      name: "Coming Soon",
      role: "Early Access Founder",
      category: "Fintech",
      tagline: "Testing zero-fee cross-border settlement for Indian SMBs.",
    },
    {
      name: "Coming Soon",
      role: "Early Access Founder",
      category: "HealthTech",
      tagline: "Gathering early clinical beta feedback for AI diagnostic triage.",
    },
  ];

  return (
    <section className="bg-white py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-6xl space-y-12">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
            Founders building their <span className="text-coral-500">evidence in public.</span>
          </h2>
        </motion.div>

        {/* 3 Founder Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {placeholderFounders.map((founder, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.5, delay: 0.15 * idx, ease: "easeOut" }}
              className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-coral-200 transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-500 text-sm shrink-0">
                    <UserCheck className="w-5 h-5 text-gray-400" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-200">
                    {founder.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 font-heading">{founder.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{founder.role}</p>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  &quot;{founder.tagline}&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200/60">
                <Link
                  href="/register"
                  className="text-xs font-bold text-coral-500 hover:text-coral-600 transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Submit your startup</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Subtle Link below */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          className="text-center pt-4"
        >
          <Link
            href="/register"
            className="text-coral-500 hover:text-coral-600 font-semibold text-base inline-flex items-center gap-1.5 transition-colors group"
          >
            <span>Apply as a Founder</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
