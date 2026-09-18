"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileCheck, BarChart3, AlertTriangle, RefreshCw } from "lucide-react";

export default function LandingMission() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const badges = [
    { label: "Public Evidence", icon: FileCheck },
    { label: "Structured Signals", icon: BarChart3 },
    { label: "Risk Disclosed", icon: AlertTriangle },
    { label: "Open Updates", icon: RefreshCw },
  ];

  return (
    <section className="bg-white py-20 md:py-32 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-5xl text-center space-y-12">
        {/* Large Typographic Quote */}
        <motion.blockquote
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-3xl md:text-5xl font-bold text-gray-900 max-w-4xl mx-auto text-center leading-tight font-heading tracking-tight"
        >
          “Good companies should not need the <span className="text-coral-500">right introductions</span> to be taken seriously.”
        </motion.blockquote>

        {/* Row of 4 Stat/Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs sm:text-sm font-medium transition-colors border border-gray-200/60 shadow-2xs"
              >
                <Icon className="w-4 h-4 text-coral-500 shrink-0" />
                <span>{badge.label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
