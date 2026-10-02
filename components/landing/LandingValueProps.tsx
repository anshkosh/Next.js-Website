"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Rocket, Users, Check } from "lucide-react";
import LaunchSupportTeaser from "./LaunchSupportTeaser";

export default function LandingValueProps() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const cards = [
    {
      id: "founder-benefits",
      title: "For Founders",
      description:
        "Test your solution, publish evidence and risks, collect structured public signals, and share what you learn before deciding whether to launch.",
      icon: Rocket,
      bullets: [
        "Validate before you build",
        "Publish evidence openly",
        "Collect real demand signals",
      ],
    },
    {
      id: "backer-benefits",
      title: "For Backers",
      description:
        "Discover startups before launch, examine what they can prove, and follow the teams turning early demand into measurable traction.",
      icon: Users,
      bullets: [
        "Early access to opportunities",
        "Evidence-backed discovery",
        "Transparent founder progress",
      ],
    },
  ];

  return (
    <section className="bg-gray-50 py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-6xl">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
            A better starting point <span className="text-coral-500">for both sides.</span>
          </h2>
        </motion.div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.article
                key={card.title}
                aria-labelledby={`${card.id}-title`}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.6, delay: 0.2 * idx, ease: "easeOut" }}
                className="bg-white rounded-2xl border border-gray-200 p-8 shadow-soft hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-coral-50 text-coral-500 flex items-center justify-center shrink-0 border border-coral-100">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 id={`${card.id}-title`} className="text-xl font-bold text-gray-900 font-heading">
                      {card.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8">
                    {card.description}
                  </p>

                  {/* Bullet Points */}
                  <ul className="space-y-3.5 mb-2">
                    {card.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-3 text-sm text-gray-800 font-medium">
                        <div className="w-5 h-5 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center shrink-0 border border-coral-100">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                    {card.id === "founder-benefits" && <LaunchSupportTeaser />}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
