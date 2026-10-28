import Link from "next/link";
import { ArrowRight } from "lucide-react";

const steps = [
  { title: "Tell your story", description: "Introduce your team, the problem you’re solving, and who you’re building for." },
  { title: "Share what you’ve learned", description: "Show what you’ve tested, what changed, and the questions you’re still working through." },
  { title: "Invite people into the journey", description: "Submit your profile for review, share updates, and invite questions. Approved comments appear in your founder dashboard after moderation." },
];

export default function LandingFounderStory() {
  return (
    <section aria-labelledby="founder-story-title" className="bg-white py-16 md:pt-16 md:pb-8">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-x-20 lg:gap-y-7">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">For founders, wherever you’re starting</p>
          <h2 id="founder-story-title" className="max-w-md font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">Every startup starts with a <span className="text-coral-500">problem.</span></h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">Help people understand why it matters. Anshkosh gives your startup a public home for the idea, the team, and the progress behind it.</p>
        </div>
        <div>
          <ol className="divide-y divide-gray-200">{steps.map((step, index) => <li key={step.title} className="flex gap-5 py-6 first:pt-0 last:pb-0"><span aria-hidden="true" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-50 text-sm font-semibold text-coral-700">{index + 1}</span><div><h3 className="font-heading text-2xl font-semibold text-gray-900">{step.title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">{step.description}</p></div></li>)}</ol>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center lg:col-span-2">
          <p className="text-left text-xs leading-relaxed text-gray-500">An account is needed to submit. Profiles are reviewed before publication.</p>
          <Link href="/startup/new" className="inline-flex min-h-12 items-center justify-self-end gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white hover:bg-coral-700">Create your free startup profile <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
      </div>
    </section>
  );
}
