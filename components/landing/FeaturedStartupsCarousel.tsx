"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import StartupCard from "@/components/startup/StartupCard";

type Startup = ComponentProps<typeof StartupCard>["startup"];

export default function FeaturedStartupsCarousel({ startups }: { startups: Startup[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const prefersReducedMotion = useReducedMotion() === true;
  const hasMultipleStartups = startups.length > 1;
  const rotationPaused = userPaused || hovered || focused || prefersReducedMotion;
  const activeStartup = startups[activeIndex];

  useEffect(() => {
    if (!hasMultipleStartups || rotationPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % startups.length);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [activeIndex, hasMultipleStartups, rotationPaused, startups.length]);

  if (!activeStartup) return null;

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + startups.length) % startups.length);
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured startup carousel"
      className="mx-auto max-w-3xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div key={activeStartup.id} aria-live="off" aria-atomic="true">
        <StartupCard startup={activeStartup} />
      </div>

      {hasMultipleStartups && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-gray-500" aria-live="off">
            {activeIndex + 1} <span aria-hidden="true">/</span> {startups.length}
            <span className="sr-only"> of {startups.length} featured startups</span>
          </p>

          <div className="flex items-center gap-2">
            <span className="mr-1 hidden text-xs text-gray-500 sm:inline">
              {prefersReducedMotion ? "Auto-advance off · reduced motion" : rotationPaused ? "Auto-advance paused" : "Changes every 30 seconds"}
            </span>
            {!prefersReducedMotion && (
              <button
                type="button"
                aria-label={userPaused ? "Resume automatic rotation" : "Pause automatic rotation"}
                aria-pressed={userPaused}
                onClick={() => setUserPaused((paused) => !paused)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-coral-300 hover:text-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
              >
                {userPaused ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
              </button>
            )}
            <button
              type="button"
              aria-label="Show previous featured startup"
              onClick={() => move(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-coral-300 hover:text-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Show next featured startup"
              onClick={() => move(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-coral-300 hover:text-coral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
            >
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
