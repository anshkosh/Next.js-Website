import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import validationArtwork from "@/public/images/why-anshkosh-validation-provided.png";

export default function LandingCTA() {
  return (
    <section aria-labelledby="next-step-title" className="relative isolate overflow-hidden border-y border-gray-200 bg-[#FAF8F5] py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <Image src={validationArtwork} alt="" fill quality={85} sizes="100vw" className="object-cover object-bottom md:object-right-bottom" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5]/95 via-[#FAF8F5]/90 to-[#FAF8F5]/30 md:via-[#FAF8F5]/70" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">There’s a place for your next step</p>
          <h2 id="next-step-title" className="font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">
            Bring your next step<br />
            <span className="text-coral-500">to Anshkosh.</span>
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-gray-600 sm:text-lg">
            Find a startup that interests you. Share the one you’re building.
            Or start with a free tool and make your idea a little clearer today.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/discover" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white hover:bg-coral-700">
              Discover startups <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/startup/new" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 hover:border-coral-500 hover:text-coral-700">
              List your startup
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
