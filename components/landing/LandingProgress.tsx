"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle, Shield } from "lucide-react";

export default function LandingProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const features = [
    {
      title: "Evidence and validation are public",
      description:
        "Every founder claim is paired with methodology, measurement, and limitations.",
      icon: CheckCircle,
    },
    {
      title: "No unverified claims of traction",
      description:
        "Validation signals state what was tested, how, and what remains uncertain.",
      icon: Shield,
    },
  ];

  return (
    <section className="bg-gray-900 text-white py-20 md:py-28 overflow-hidden relative border-b border-gray-800">
      <div ref={containerRef} className="container mx-auto px-4 max-w-4xl space-y-12 md:space-y-16">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-heading">
            Progress, <span className="text-coral-400">not press releases.</span>
          </h2>
        </motion.div>

        {/* Feature Rows */}
        <div className="space-y-8 md:space-y-10">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 sm:gap-6 p-6 sm:p-8 rounded-2xl bg-gray-800/40 border border-gray-800/80 backdrop-blur-sm"
              >
                {/* Icon: Fade in from left */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ duration: 0.6, delay: 0.2 * idx, ease: "easeOut" }}
                  className="bg-gray-800 p-3.5 rounded-xl border border-gray-700/60 shrink-0 text-coral-400"
                >
                  <Icon className="w-6 h-6 text-coral-400" />
                </motion.div>

                {/* Text: Fade in from right */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
                  transition={{ duration: 0.6, delay: 0.2 * idx + 0.1, ease: "easeOut" }}
                  className="space-y-1.5"
                >
                  <h3 className="text-xl font-bold font-heading text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
