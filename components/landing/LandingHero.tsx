"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LandingHero() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={targetRef}
      className="relative w-full min-h-[85vh] lg:min-h-[92vh] flex flex-col items-center justify-start overflow-hidden bg-[#FAF8F5] text-gray-900 pt-6 sm:pt-10 lg:pt-12 pb-64 sm:pb-80 lg:pb-[26rem]"
    >
      {/* Clear Parallax Background Image */}
      <motion.div
        style={{ y: backgroundY }}
        className="absolute inset-0 w-full h-[115%] -top-[5%] pointer-events-none"
      >
        <Image
          src="/images/hero-pomegranate-v2.webp"
          alt="Anshkosh Hero Background"
          fill
          priority
          className="object-cover object-bottom"
        />
        {/* Soft subtle top blend for header legibility without dimming the artwork */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8F5]/80 via-[#FAF8F5]/20 to-transparent pointer-events-none" />
      </motion.div>

      {/* Decorative Glow Orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-coral-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Content Container - Top Aligned */}
      <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center space-y-6">
        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-coral-50/90 backdrop-blur-md border border-coral-200 text-coral-600 text-xs sm:text-sm font-semibold uppercase tracking-wider shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-coral-500 animate-pulse" />
          <span>EARLY ACCESS PILOT</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] font-heading text-gray-900"
        >
          Back the next thing <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-coral-600 via-coral-500 to-orange-500 bg-clip-text text-transparent">
            before it launches.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg lg:text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed"
        >
          Discover Indian startups before launch, examine what they can prove,
          and follow the teams turning early demand into measurable traction.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-base shadow-lg shadow-coral-500/25 hover:shadow-coral-500/35 transition-all transform hover:-translate-y-0.5"
          >
            <span>I'm a Founder</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/discover"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-extrabold text-base border border-gray-200/90 shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <span>Discover Startups</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
