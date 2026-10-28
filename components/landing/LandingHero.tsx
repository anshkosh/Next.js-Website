import Link from "next/link";
import { ArrowRight } from "lucide-react";
import HeroArtwork from "./HeroArtwork";

export default function LandingHero() {
  return (
    <section className="relative isolate w-full overflow-hidden bg-[#F7F1E7] text-gray-900">
      <div className="relative z-10 mx-auto max-w-4xl px-4 pt-6 text-center">
        <h1 className="font-heading text-[2.5rem] font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
          Back the next thing.
          <span className="block text-coral-500">Before it launches.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
          A place for founders to share what they’re building and for early believers to discover new startups, offer feedback, and help shape what comes next.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/startup/new" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral-600 px-7 py-3 font-semibold text-white shadow-sm hover:bg-coral-700 sm:w-auto">
            List your startup <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link href="/discover" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-7 py-3 font-semibold text-gray-900 hover:border-coral-500 hover:text-coral-700 sm:w-auto">
            Discover startups
          </Link>
        </div>
      </div>
      <HeroArtwork />
    </section>
  );
}
