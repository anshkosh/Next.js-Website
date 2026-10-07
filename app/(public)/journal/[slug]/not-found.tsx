import Link from "next/link";
import ErrorMascot from "@/components/site/ErrorMascot";

export default function JournalPostNotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-24 text-center">
      <ErrorMascot />
      <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-coral-500">404</p>
      <h1 className="mb-4 text-4xl font-bold font-heading text-gray-900">Article not found</h1>
      <p className="mb-8 text-lg text-gray-600">This article isn’t available. Explore the Anshkosh Journal or suggest a topic for a future story.</p>
      <Link href="/journal" className="inline-flex rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-gray-800">Back to the Journal</Link>
    </section>
  );
}
