import Link from "next/link";
import { ArrowRight, Check, FileText, MessageSquare, Users } from "lucide-react";
import { seoMetadata } from "@/lib/seo";
import { FOUNDER_TOOLS } from "@/lib/founder-toolkit";
import PublicPageIntro from "@/components/layout/PublicPageIntro";

export const metadata = seoMetadata({
  title: "Launch Support & Free Founder Toolkit — Anshkosh",
  description: "Free tools to test an idea, plan your MVP, build a pitch, make launch graphics and prepare your startup launch. No account needed for the toolkit.",
  path: "/launch-support",
});

const supportOptions = [
  {
    title: "Your startup, in one place",
    status: "Available now",
    icon: FileText,
    description: "Create a free startup profile with your pitch, founders, images, and progress. Submit it for review before it appears in discovery.",
    href: "/startup/new",
    action: "Create your startup profile",
  },
  {
    title: "Help telling your story",
    status: "Request free support",
    icon: MessageSquare,
    description: "Ask for help making your profile clearer or suggest your startup for a founder spotlight. We review requests individually; an article or featured placement is not guaranteed.",
    href: "/contact?subject=Free%20launch%20support",
    action: "Request free launch support",
  },
  {
    title: "Progress people can follow",
    status: "Available now",
    icon: Users,
    description: "Share founder updates and invite people to explore your published profile. Build a public record of what you are learning, testing, and shipping.",
    href: "/dashboard",
    action: "Manage your startup",
  },
];

const steps = [
  { title: "Build your profile", description: "Introduce your team, the problem, and the evidence behind your idea." },
  { title: "Submit for review", description: "Every startup follows the same review process. Free support does not bypass it." },
  { title: "Tell us what you need", description: "Send your profile link and the help you are looking for. We will discuss what is possible before any work starts." },
];

export default function LaunchSupportPage() {
  return (
    <div className="bg-white text-gray-900">
      <PublicPageIntro title="Your next step, with Anshkosh." description="Test your idea. Decide what to build. Make your launch materials. A free founder toolkit to help you move from a rough idea to a clear next step.">
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="#tools-heading" className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-coral-700">
              Explore the free tools <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/startup/new" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-semibold transition-colors hover:border-coral-600 hover:text-coral-700">
              List your startup for free
            </Link>
            </div>
            <p className="text-sm text-gray-600">No payment details. No automatic paid subscription.</p>
          </div>
      </PublicPageIntro>

      <section aria-labelledby="tools-heading" className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6 md:pb-20">
        <p className="mb-3 text-sm font-semibold text-coral-700">Free founder tools · Available now</p>
        <h2 id="tools-heading" className="scroll-mt-28 font-heading text-3xl font-bold">Small tools. Useful next steps.</h2>
        <p className="mt-4 max-w-2xl text-gray-600">Start anywhere. Your startup details carry across the tools, with drafts saved on this device. Copy and download your results for free.</p>
        <div className="mt-10 space-y-10">{[...new Set(FOUNDER_TOOLS.map(tool => tool.group))].map(group => <section key={group} aria-label={group}>
          <h3 className="mb-4 border-b border-gray-200 pb-3 text-sm font-semibold uppercase tracking-wider text-gray-600">{group}</h3>
          <div className="grid gap-5 md:grid-cols-3">{FOUNDER_TOOLS.filter(tool => tool.group === group).map(tool => <article key={tool.id} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-coral-300">
            <p className="mb-3 text-xs font-semibold text-coral-700">{tool.result}</p><h4 className="font-heading text-2xl font-bold">{tool.title}</h4><p className="mb-6 mt-3 text-sm leading-relaxed text-gray-600">{tool.description}</p><Link href={`/launch-support/${tool.id}`} className="mt-auto inline-flex items-center gap-2 rounded-sm text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900">Open {tool.title.toLowerCase()} <ArrowRight aria-hidden="true" size={15} /></Link>
          </article>)}</div>
        </section>)}</div>
      </section>

      <section aria-labelledby="support-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <h2 id="support-heading" className="font-heading text-3xl font-bold">What you can use today</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {supportOptions.map(({ title, status, icon: Icon, description, href, action }) => (
            <article key={title} className="flex flex-col rounded-2xl border border-gray-200 p-6">
              <Icon aria-hidden="true" className="mb-5 h-7 w-7 text-coral-600" />
              <p className="text-xs font-semibold uppercase tracking-wide text-coral-700">{status}</p>
              <h3 className="mt-2 font-heading text-2xl font-bold">{title}</h3>
              <p className="mb-6 mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
              <Link href={href} className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-coral-700 underline decoration-coral-200 underline-offset-4 hover:decoration-coral-700">
                {action} <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps-heading" className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_2fr] md:py-20">
          <div>
            <h2 id="steps-heading" className="font-heading text-3xl font-bold">Start with the evidence.</h2>
            <p className="mt-4 text-gray-600">A clear profile comes before promotion.</p>
          </div>
          <ol className="space-y-6">
            {steps.map(({ title, description }, index) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-coral-200 bg-white text-sm font-bold text-coral-700">{index + 1}</span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="outreach-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold text-gray-600">Planned — not available yet</p>
            <h2 id="outreach-heading" className="font-heading text-3xl font-bold">Directory submission support.</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              We are exploring a permission-based service to help founders prepare submissions to relevant startup directories. It is planned, not available yet; each directory decides whether to accept a listing or include a link.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              You can use the free Directory catalogue and tracker today to check fit, record submissions in this browser, and follow up yourself. Tracker entries do not sync across devices or accounts and are cleared when you sign out; download the CSV first if you want to keep a copy.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              We do not promise directory acceptance, backlinks, indexing, search rankings, traffic, or funding.
            </p>
          </div>
          <aside aria-labelledby="standards-heading" className="rounded-2xl border border-coral-200 bg-coral-50 p-6 sm:p-8">
            <h2 id="standards-heading" className="font-heading text-2xl font-bold">Support is free. Credibility is earned.</h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-gray-700">
              {[
                "Startup approval, votes, and validation evidence cannot be bought.",
                "Editorial features are selected on merit, not guaranteed by a request.",
                "Any future paid offer will be optional and explained separately. Existing requests will not turn into paid subscriptions.",
              ].map((statement) => (
                <li key={statement} className="flex gap-3"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-coral-700" /><span>{statement}</span></li>
              ))}
            </ul>
            <Link href="/trust-safety" className="mt-6 inline-block text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900">Read our trust and safety standards</Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
