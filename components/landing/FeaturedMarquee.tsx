"use client";

import { useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

// Slow, continuous loop. It always moves (including for visitors who prefer reduced
// motion, by request) but pauses on hover or focus and has a visible pause button.
export default function FeaturedMarquee({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <div>
      <div className="featured-marquee" data-paused={paused}>
        {children}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setPaused(value => !value)}
          aria-pressed={paused}
          aria-label={paused ? "Play the directory carousel" : "Pause the directory carousel"}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
        >
          {paused ? <Play aria-hidden="true" className="h-3.5 w-3.5" /> : <Pause aria-hidden="true" className="h-3.5 w-3.5" />}
          {paused ? "Play" : "Pause"}
        </button>
      </div>
    </div>
  );
}
