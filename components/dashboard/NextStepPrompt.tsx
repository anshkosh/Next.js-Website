import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface FounderNextStep { title: string; detail: string; href: string; label: string }

export default function NextStepPrompt({ step }: { step: FounderNextStep | null }) {
  if (!step) return null;
  return <section aria-labelledby="dashboard-next" className="rounded-2xl border border-gray-200 bg-white px-5 py-5">
    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-coral-700">Your next step</p>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div aria-live="polite" className="min-w-0"><h2 id="dashboard-next" className="font-heading text-lg font-bold text-gray-900">{step.title}</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">{step.detail}</p></div>
      <Link href={step.href} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">{step.label}<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
  </section>;
}
