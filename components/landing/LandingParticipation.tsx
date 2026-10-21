import Link from "next/link";
import { ArrowRight, Search, MessageCircle, Heart } from "lucide-react";

const waysToHelp = [
  { icon: Search, title: "Get to know the idea", description: "Read the profile. Look at what’s been built and what the founder is working toward." },
  { icon: MessageCircle, title: "Ask a useful question", description: "Share your experience of the problem or ask how the proposed solution would work for you." },
  { icon: Heart, title: "Show your interest", description: "Upvote or downvote a startup to share your view. Explore the founder’s website for available ways to get involved." },
];

export default function LandingParticipation() {
  return (
    <section aria-labelledby="participation-title" className="border-y border-gray-200 bg-gray-50 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl"><p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-coral-700">Curiosity is a good place to start</p><h2 id="participation-title" className="font-heading text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">Your feedback can shape what comes next.</h2><p className="mt-4 text-base leading-relaxed text-gray-600">You don’t need to be a founder to contribute. A thoughtful question or an honest observation can help someone make a better decision.</p></div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">{waysToHelp.map(({ icon: Icon, title, description }) => <article key={title}><Icon aria-hidden="true" className="mb-4 h-6 w-6 text-coral-600" /><h3 className="font-heading text-2xl font-semibold text-gray-900">{title}</h3><p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p></article>)}</div>
        <div className="mt-9 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-relaxed text-gray-600">Anshkosh is in early access. Feedback and interest are welcome. Payments and preorders are not open during the pilot. Votes reflect community opinion and do not verify a startup’s claims.</p><Link href="/discover" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-semibold text-coral-700 hover:text-coral-900">Find a startup to explore <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
      </div>
    </section>
  );
}
