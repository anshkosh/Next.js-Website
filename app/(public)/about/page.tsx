import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "About Anshkosh — Indian startup profiles and public discussions",
  description: "Explore Indian startup profiles, share feedback in public discussions, and use free founder tools to plan a next step.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <section aria-labelledby="about-title" className="page-intro-spacing bg-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 id="about-title" className="page-title mb-4">A home for Indian startup stories.</h1>
        <p className="text-lg leading-relaxed text-gray-600 mb-8">
          Anshkosh helps people explore Indian startup profiles, understand the ideas and products founders describe, and share feedback in public discussions.
        </p>
        <div className="space-y-10 text-gray-600 leading-relaxed text-base">
          <section aria-labelledby="about-purpose">
            <h2 id="about-purpose" className="text-2xl font-bold text-gray-900 mb-3 font-heading">What you’ll find on each profile</h2>
            <p>
              It begins with a problem worth solving. Then come the conversations, rough prototypes, small experiments, and decisions about what to build next. That early work helps explain why an idea matters and how it is taking shape.
            </p>
            <p className="mt-4">
              We want that work to be easier to find, understand, and discuss. Anshkosh gives founders a place to share it, and curious people a way to follow along.
            </p>
          </section>
          <section aria-labelledby="about-founders">
            <h2 id="about-founders" className="text-2xl font-bold text-gray-900 mb-3 font-heading">For founders: tell the story as it takes shape</h2>
            <p>
              Your startup profile brings the problem, your approach, your team, and your progress into one public home. Share what you have tested, what you have learned, and the questions you are still working through. Give people enough context to offer feedback that helps.
            </p>
            <p className="mt-4">
              Profiles are free to submit. You will need an account, and each profile is reviewed before publication. Once published, you can share updates as your work develops.
            </p>
          </section>
          <section aria-labelledby="about-discovery">
            <h2 id="about-discovery" className="text-2xl font-bold text-gray-900 mb-3 font-heading">For the curious: meet the people behind the idea</h2>
            <p>
              Explore what Indian founders are building, who they are building for, and the progress they choose to share. Read their profiles, ask useful questions, and offer feedback from your own experience. A thoughtful response can help a founder see something they have missed.
            </p>
            <Link href="/discover" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-coral-700 underline underline-offset-4">
              Discover Indian startups <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </section>
          <section aria-labelledby="about-tools">
            <h2 id="about-tools" className="text-2xl font-bold text-gray-900 mb-3 font-heading">Practical help for your next step</h2>
            <p>
              When you are working out where to start, our free Launch Support tools can help you plan customer conversations, narrow your first build, explore your runway, and prepare a pitch or launch materials.
            </p>
            <p className="mt-4">
              Use them without an account. Drafts stay in your browser on this device, and you can copy or download your results to keep working elsewhere.
            </p>
            <Link href="/launch-support" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-coral-700 underline underline-offset-4">
              Explore the free founder tools <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </section>
          <section aria-labelledby="about-trust">
            <h2 id="about-trust" className="text-2xl font-bold text-gray-900 mb-3 font-heading">Trust grows from honest progress</h2>
            <p>
              Clear claims, evidence where it exists, and openness about what is still uncertain make a startup easier to understand. That is the kind of sharing we want to encourage here.
            </p>
            <p className="mt-4">
              A published profile or a show of interest does not prove that an idea will work. Our review process supports responsible publishing; founders remain responsible for their claims. You can read more in our <Link href="/trust-safety" className="text-coral-700 underline underline-offset-4">trust and safety standards</Link>.
            </p>
          </section>
          <section aria-labelledby="about-pilot">
            <h2 id="about-pilot" className="text-2xl font-bold text-gray-900 mb-3 font-heading">We are building Anshkosh, too</h2>
            <p>
              Anshkosh is an early-access pilot focused on startup profiles, progress, discovery, feedback, and free founder tools. Payments and preorders are not open during the pilot. Investments are not offered.
            </p>
            <p className="mt-4">
              We are learning from the people who use it. If something is confusing, missing, or could be more useful, <Link href="/contact" className="text-coral-700 underline underline-offset-4">tell us what you think</Link>. For questions about getting started, visit the <Link href="/faq" className="text-coral-700 underline underline-offset-4">FAQ</Link>.
            </p>
          </section>
        </div>
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="font-heading text-2xl font-bold text-gray-900">Give people a clear view of what you’re building.</h2>
          <Link href="/startup/new" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-coral-600 px-6 py-3 text-center font-semibold text-white transition-colors hover:bg-coral-700 active:bg-coral-800">
            Create your free startup profile <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" />
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">An account is needed to submit. Profiles are reviewed before publication.</p>
        </div>
      </div>
    </section>
  );
}
