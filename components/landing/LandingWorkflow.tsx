"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FileText, Search, BarChart3, Rocket } from "lucide-react";

export default function LandingWorkflow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const steps = [
    {
      num: 1,
      title: "Apply",
      description: "Submit your startup with evidence and a testable hypothesis.",
      icon: FileText,
    },
    {
      num: 2,
      title: "Review",
      description: "Team checks founder identity, prototype, and proposed validation.",
      icon: Search,
    },
    {
      num: 3,
      title: "Validate",
      description: "Publish a public test, collect signals, report results honestly.",
      icon: BarChart3,
    },
    {
      num: 4,
      title: "Launch",
      description: "If validated, proceed to an optional reward-crowdfunding campaign.",
      icon: Rocket,
    },
  ];

  return (
    <section className="bg-gray-50 py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-6xl space-y-16">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
            From private brief <span className="text-coral-500">to public validation.</span>
          </h2>
        </motion.div>

        {/* Workflow Timeline Container */}
        <div className="relative">
          {/* Animated Connecting Line for Desktop */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 pointer-events-none">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="w-full h-full border-t-2 border-dashed border-coral-400 origin-left"
            />
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.5, delay: 0.2 * idx, ease: "easeOut" }}
                  className="bg-white md:bg-transparent rounded-2xl p-6 md:p-0 border border-gray-200/80 md:border-none shadow-2xs md:shadow-none flex flex-col items-start md:items-center text-left md:text-center space-y-4 group"
                >
                  {/* Numbered Circle & Icon Header */}
                  <div className="flex items-center gap-3 md:flex-col md:gap-4">
                    <div className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md shadow-coral-500/20 shrink-0 group-hover:scale-110 transition-transform">
                      {step.num}
                    </div>
                    <div className="p-2.5 rounded-xl bg-coral-50 text-coral-600 border border-coral-100 shrink-0 md:mt-2">
                      <Icon className="w-5 h-5 text-coral-500" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold font-heading text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
