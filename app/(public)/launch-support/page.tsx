import Link from "next/link";
import { ArrowRight, Check, FileText, MessageSquare, Users } from "lucide-react";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "Anshkosh — Free Startup Launch Support",
  description: "List your startup on Anshkosh for free and request early-access profile and founder-story support. No payment or guaranteed search rankings.",
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
      <section className="border-b border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <p className="mb-5 text-sm font-semibold uppercase tracking-wider text-coral-700">
            Free during early access
          </p>
          <h1 className="max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Anshkosh launch support.<br />
            Build your case. Share your story.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            You are building a startup, not a marketing department. List on
            Anshkosh for free and ask for help presenting your idea clearly.
            There are no paid packages or checkout during this pilot.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/startup/new" className="inline-flex items-center justify-center gap-2 rounded-xl bg-coral-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-coral-700">
              List your startup for free <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link href="/contact?subject=Free%20launch%20support" className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-6 py-3 font-semibold transition-colors hover:border-coral-600 hover:text-coral-700">
              Ask for launch support
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-600">No payment details. No automatic paid subscription.</p>
        </div>
      </section>

      <section aria-labelledby="tools-heading" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20">
        <p className="mb-3 text-sm font-semibold text-coral-700">Free founder tools · Available now</p>
        <h2 id="tools-heading" className="font-heading text-3xl font-bold">Prepare once. Share with care.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { title: "Directory catalogue", description: "Find relevant directories, eligibility notes, cost labels and official submission links. External fees may apply.", href: "/launch-support/directories" },
            { title: "Launch checklist", description: "Prepare your evidence, website and materials. Tick off tasks with progress saved in this browser.", href: "/launch-support/checklist" },
            { title: "Reusable launch kit", description: "Prepare copyable pitches, descriptions and team introductions. Open your saved startup's kit from the dashboard to prefill it.", href: "/launch-support/kit" },
          ].map(tool => <article key={tool.href} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6"><h3 className="font-heading text-2xl font-bold">{tool.title}</h3><p className="mb-6 mt-3 text-sm leading-relaxed text-gray-600">{tool.description}</p><Link href={tool.href} className="mt-auto text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900">Open {tool.title.toLowerCase()} →</Link></article>)}
        </div>
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
            <h2 id="outreach-heading" className="font-heading text-3xl font-bold">Startup directory listings &amp; credible SEO backlinks.</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              We plan to explore submissions to relevant, credible startup
              directories with your permission. Automated submissions and
              backlink packages are not currently offered. Each directory makes
              its own acceptance and linking decisions.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              Credible SEO backlinks would come from relevant listings that
              genuinely help people discover your startup — never bulk or
              misleading link schemes.
            </p>
            <p className="mt-4 leading-relaxed text-gray-600">
              The goal is useful discovery and accurate brand citations, not
              bulk link spam. We do not guarantee backlinks, indexing, search
              rankings, traffic, or funding.
            </p>
          </div>
          <aside aria-labelledby="standards-heading" className="rounded-2xl border border-coral-200 bg-coral-50 p-6 sm:p-8">
            <h2 id="standards-heading" className="font-heading text-2xl font-bold">Support is free. Credibility is earned.</h2>
            <ul className="mt-5 space-y-4 text-sm leading-relaxed text-gray-700">
              {[
                "Startup approval, upvotes, and validation signals cannot be bought.",
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
