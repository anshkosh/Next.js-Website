"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";

function AnimatedNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{count}</span>;
}

export default function LandingSignal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="bg-white py-20 md:py-28 border-b border-gray-100 overflow-hidden">
      <div ref={containerRef} className="container mx-auto px-4 max-w-5xl space-y-12">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight font-heading">
            Separate the story <span className="text-coral-500">from the signal.</span>
          </h2>
        </motion.div>

        {/* Visual Comparison Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: What founders claim (Unverified) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-gray-100 rounded-2xl p-8 text-gray-400 flex flex-col justify-between space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200/80">
                <XCircle className="w-5 h-5 text-gray-400" />
                <h3 className="font-bold text-gray-500 text-lg font-heading uppercase tracking-wider text-xs">
                  What founders claim
                </h3>
              </div>

              <ul className="space-y-4">
                {[
                  "Market-ready product",
                  "Strong customer demand",
                  "Industry-leading solution",
                ].map((claim, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-400 line-through decoration-gray-300">
                    <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                    <span>&quot;{claim}&quot;</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-gray-400 font-medium italic pt-4">
              Subjective pitch copy without verifiable public evidence.
            </p>
          </motion.div>

          {/* Right Column: What the platform records (Evidence-Backed) */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="bg-white border-2 border-coral-500 rounded-2xl p-8 shadow-lg flex flex-col justify-between space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-coral-500/10 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <Sparkles className="w-5 h-5 text-coral-500" />
                <h3 className="font-bold text-gray-900 text-lg font-heading uppercase tracking-wider text-xs">
                  What the platform records
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-gray-900 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                  <span>
                    <AnimatedNumber value={423} /> waitlist signups in 14 days
                  </span>
                </li>

                <li className="flex items-start gap-3 text-sm text-gray-900 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                  <span>
                    <AnimatedNumber value={67} />% survey respondents confirmed problem
                  </span>
                </li>

                <li className="flex items-start gap-3 text-sm text-gray-900 font-semibold">
                  <CheckCircle2 className="w-5 h-5 text-coral-500 shrink-0 mt-0.5" />
                  <span>
                    Prototype tested with <AnimatedNumber value={12} /> pilot users
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-coral-600 font-bold">
              <span>● Live Validation Signal</span>
              <span>Spam-Resistant Fingerprints</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
