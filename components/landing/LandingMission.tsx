import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingMission() {
  return (
    <section aria-label="Why Anshkosh exists" className="bg-[#F7F1E7] py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">Why we’re building Anshkosh</p>
        <blockquote className="font-heading text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
          “Good companies should not need the <span className="text-coral-500">right introductions</span> to be taken seriously.”
        </blockquote>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600">We’re creating a place where people can discover the work behind an idea, and founders can share their progress openly.</p>
        <Link href="/trust-safety" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900">Read our trust and safety standards <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </section>
  );
}
