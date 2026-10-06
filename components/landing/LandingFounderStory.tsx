import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";

const steps = [
  { title: "Tell your story", description: "Introduce your team, the problem you’re solving, and who you’re building for." },
  { title: "Share what you’ve learned", description: "Show what you’ve tested, what changed, and the questions you’re still working through." },
  { title: "Invite people into the journey", description: "Submit your profile for review, then share updates and ask for useful feedback." },
];

export default async function LandingFounderStory() {
  // Only use a public founder's own problem statement; never invent an interview.
  const startup = process.env.DATABASE_URL
    ? await db.startup.findFirst({ where: { status: "LIVE", problemStatement: { not: null } }, orderBy: { publishedAt: "desc" }, select: { name: true, slug: true, founderName: true, problemStatement: true } })
    : null;
  return (
    <section aria-labelledby="founder-story-title" className="bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">For founders, wherever you’re starting</p>
          <h2 id="founder-story-title" className="max-w-md font-heading text-4xl font-bold leading-tight tracking-tight text-gray-900 sm:text-5xl">Every startup starts<br />with a <span className="text-coral-500">problem.</span></h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600">Help people understand why it matters. Anshkosh gives your startup a public home for the idea, the team, and the progress behind it.</p>
          <Link href="/startup/new" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white hover:bg-coral-700">Create your free startup profile <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          <p className="mt-3 text-xs leading-relaxed text-gray-500">An account is needed to submit. Profiles are reviewed before publication.</p>
        </div>
        <div>
          {startup?.problemStatement?.trim() ? (
            <article className="mb-7 rounded-xl border border-coral-200 bg-coral-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-coral-700">From a founder’s profile</p>
              <h3 className="mt-3 font-heading text-2xl font-bold text-gray-900">{startup.name}</h3>
              <p className="mt-1 text-sm text-gray-600">{startup.founderName}</p>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-700">{startup.problemStatement.length > 450 ? `${startup.problemStatement.slice(0, 450)}…` : startup.problemStatement}</p>
              <Link href={`/startups/${startup.slug}`} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-coral-700 underline underline-offset-4">Explore their startup <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </article>
          ) : null}
          <ol className="divide-y divide-gray-200">{steps.map((step, index) => <li key={step.title} className="flex gap-5 py-6 first:pt-0 last:pb-0"><span aria-hidden="true" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-50 text-sm font-semibold text-coral-700">{index + 1}</span><div><h3 className="font-heading text-2xl font-semibold text-gray-900">{step.title}</h3><p className="mt-2 max-w-lg text-sm leading-relaxed text-gray-600">{step.description}</p></div></li>)}</ol>
        </div>
      </div>
    </section>
  );
}
