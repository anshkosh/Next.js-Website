"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Rocket } from "lucide-react";

export default function LandingCTA() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative w-full min-h-[70vh] lg:min-h-[80vh] flex flex-col justify-center overflow-hidden bg-[#FAF8F5] text-gray-900 py-20 md:py-28 border-t border-b border-gray-200/60">
      {/* Woodcut Artwork Background Image */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <Image
          src="/images/why-anshkosh-validation.webp"
          alt="Anshkosh Validation Journey"
          fill
          priority
          className="object-cover object-bottom md:object-right-bottom"
        />
        {/* Soft subtle blend gradient for text legibility on small screens */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/80 to-[#FAF8F5]/20 md:via-[#FAF8F5]/60 pointer-events-none" />
      </div>

      {/* Decorative Glow Orb */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-coral-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content Container - Aligned Left/Center-Left */}
      <div
        ref={containerRef}
        className="relative z-10 container mx-auto px-6 sm:px-12 max-w-6xl"
      >
        <div className="max-w-2xl space-y-6 text-center md:text-left">
          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 font-heading leading-[1.15]"
          >
            Build the case. <br />
            <span className="bg-gradient-to-r from-coral-600 via-coral-500 to-orange-500 bg-clip-text text-transparent">
              Earn the attention.
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-gray-600 text-base sm:text-lg lg:text-xl font-medium max-w-xl leading-relaxed"
          >
            Join a public validation platform for startups. Question the plan, follow real progress, and build evidence before launch.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4 pt-4"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-base shadow-lg shadow-coral-500/25 hover:shadow-coral-500/35 transition-all transform hover:-translate-y-0.5"
            >
              <Rocket className="w-5 h-5 text-white" />
              <span>Start Validating</span>
            </Link>
            <Link
              href="/discover"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-extrabold text-base border border-gray-200/90 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Startups</span>
              <ArrowRight className="w-4 h-4 text-gray-700" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
