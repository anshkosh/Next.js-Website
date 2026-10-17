import Link from "next/link";
import { ArrowRight, Bell, CheckCircle2, Clock3 } from "lucide-react";
import NextStepPrompt, { type FounderNextStep } from "./NextStepPrompt";

export interface DashboardNotice { id: string; title: string; detail: string; href: string; scheduled?: boolean }

export default function DashboardOverview({ notices, nextStep }: { notices: DashboardNotice[]; nextStep: FounderNextStep | null }) {
  return <div className="mb-8 space-y-4">
    {notices.length > 0 && <section aria-labelledby="dashboard-attention" className="rounded-2xl border border-amber-200 bg-amber-50/70 px-5 py-4">
      <h2 id="dashboard-attention" className="flex items-center gap-2 text-sm font-bold text-amber-950"><Bell size={16} aria-hidden="true" /> On your radar</h2>
      <ul className="mt-2 divide-y divide-amber-200/60">{notices.map(notice => <li key={notice.id}><Link href={notice.href} className="flex min-h-14 items-start gap-3 rounded-lg py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">
        {notice.scheduled ? <Clock3 className="mt-0.5 shrink-0 text-amber-700" size={16} aria-hidden="true" /> : <CheckCircle2 className="mt-0.5 shrink-0 text-amber-700" size={16} aria-hidden="true" />}
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">{notice.title}</span><span className="mt-1 block text-sm leading-relaxed text-gray-600">{notice.detail}</span></span><ArrowRight size={16} className="mt-1 shrink-0 text-amber-700" aria-hidden="true" />
      </Link></li>)}</ul>
    </section>}
    <NextStepPrompt step={nextStep} />
  </div>;
}
