import Link from "next/link";
import { ArrowRight, MessageCircle, Scissors, FileText, Calculator } from "lucide-react";
import { FOUNDER_TOOLS } from "@/lib/founder-toolkit";

const highlights = [
  { id: "validation", icon: MessageCircle, question: "Does this problem matter?", action: "Plan your customer conversations" },
  { id: "mvp", icon: Scissors, question: "What should I build first?", action: "Choose your essential features" },
  { id: "pitch", icon: FileText, question: "How do I explain my idea?", action: "Write your startup pitch" },
  { id: "runway", icon: Calculator, question: "How long can my cash last?", action: "Calculate your runway" },
] as const;

export default function LandingToolkit() {
  return (
    <section id="founder-tools" aria-labelledby="founder-tools-title" className="scroll-mt-24 bg-gray-900 py-16 text-white md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-300">For the idea on your mind</p>
            <h2 id="founder-tools-title" className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Working on an idea?<br /><span className="text-coral-400">Start here.</span></h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-300">A useful next step, whatever stage you’re at. Test the problem, decide what to build, or get your launch materials ready.</p>
          </div>
          <p className="shrink-0 border-l-2 border-coral-500 pl-4 text-sm leading-7 text-gray-300"><strong className="block text-lg font-semibold text-white">{FOUNDER_TOOLS.length} free founder tools</strong>No sign-in. Free downloads.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ id, icon: Icon, question, action }) => {
            const tool = FOUNDER_TOOLS.find(tool => tool.id === id)!;
            return (
              <Link key={id} href={`/launch-support/${id}`} className="group flex flex-col rounded-xl border border-gray-700 bg-gray-800/50 p-6 hover:border-coral-400 hover:bg-gray-800">
                <Icon aria-hidden="true" className="mb-6 h-6 w-6 text-coral-300" />
                <h3 className="font-heading text-2xl font-medium leading-snug text-white">{question}</h3>
                <p className="mb-7 mt-3 text-sm leading-relaxed text-gray-300">{action}</p>
                <span className="mt-auto flex items-center justify-between gap-2 border-t border-gray-700 pt-4 text-xs font-semibold text-coral-200">{tool.title}<ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 motion-reduce:transform-none" /></span>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-lg text-sm leading-relaxed text-gray-300">Also inside: a launch card maker, reusable launch kit, checklist, directory catalogue, and submission tracker.</p>
          <Link href="/launch-support#tools-heading" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-coral-200 underline underline-offset-4 hover:text-white">Explore all {FOUNDER_TOOLS.length} free tools <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
