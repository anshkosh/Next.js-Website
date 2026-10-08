import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroArtwork from "./HeroArtwork";

export default function LandingHero() {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#F7F1E7] px-4 pb-64 pt-12 text-gray-900 sm:pb-80 sm:pt-16 lg:pb-[25rem] lg:pt-20">
      <HeroArtwork />
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-coral-500" />
          Indian startups · Early access pilot
        </p>
        <h1 className="font-heading text-[2.9rem] font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          Discover Indian startups
          <span className="block text-coral-500">before launch.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
          Explore what founders are building, understand the problems they’re solving,
          and follow their progress. Building something yourself? Take your next step with our free founder toolkit.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/discover" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral-600 px-7 py-3.5 font-semibold text-white shadow-sm hover:bg-coral-700 sm:w-auto">
            Discover startups <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link href="/startup/new" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3.5 font-semibold text-gray-900 hover:border-coral-500 hover:text-coral-700 sm:w-auto">
            List your startup
          </Link>
        </div>
        <Link href="/launch-support" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-gray-700 underline decoration-gray-400 underline-offset-4 hover:text-coral-700">
          Working on an idea? Explore the free tools <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
