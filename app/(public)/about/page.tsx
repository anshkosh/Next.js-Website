import Link from "next/link";
import { seoMetadata } from "@/lib/seo";

export const metadata = seoMetadata({
  title: "About Anshkosh — Indian startup discovery platform",
  description: "Anshkosh (also written Ansh Kosh) is a public validation and discovery platform for Indian startups before launch. Learn what it is and who it is for.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="bg-white py-16 md:py-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-4">
        <span className="text-xs font-semibold text-coral-500 tracking-widest uppercase mb-4 block">ABOUT</span>
        <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4 tracking-tight">What is Anshkosh?</h1>
        <p className="text-xl text-gray-500 mb-8">
          Anshkosh (also written Ansh Kosh) is a public validation and discovery platform for Indian startups before launch.
        </p>
        <div className="space-y-8 text-gray-600 leading-relaxed text-base">
          <p>
            Anshkosh is the name of this website, anshkosh.com. It is a startup platform, and it is not related to any other use of a similar-sounding word. If a search engine suggests a different spelling, search instead for &ldquo;Anshkosh startup&rdquo; or go directly to <Link href="/" className="text-coral-600 underline">www.anshkosh.com</Link>.
          </p>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 font-heading">Who it is for</h2>
            <p>
              Founders of Indian startups can publish a free profile with evidence of progress, and people can <Link href="/discover" className="text-coral-600 underline">discover startups</Link> and the proof behind them before those startups launch.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 font-heading">Free tools for founders</h2>
            <p>
              The <Link href="/launch-support" className="text-coral-600 underline">free founder toolkit</Link> includes a launch checklist, customer validation planner, pitch builder and runway calculator.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 font-heading">Where Anshkosh is today</h2>
            <p>
              Anshkosh is an early-access pilot. Validation signals are not investments, securities, orders, revenue or guarantees of delivery. Read the <Link href="/faq" className="text-coral-600 underline">FAQ</Link> and our <Link href="/trust-safety" className="text-coral-600 underline">trust and safety standards</Link>, or <Link href="/contact" className="text-coral-600 underline">contact the team</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
