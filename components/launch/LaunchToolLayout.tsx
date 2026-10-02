import Link from "next/link";
import type { ReactNode } from "react";

export const launchLinkStyle = "rounded-md text-sm font-semibold text-coral-700 underline underline-offset-4 hover:text-coral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500";

export default function LaunchToolLayout({ title, description, active, children }: {
  title: string; description: string; active: string; children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-gray-900 sm:px-6 md:py-16">
      <Link href="/launch-support" className={launchLinkStyle}>← Free launch support</Link>
      <p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-coral-700">Founder workspace · Free</p>
      <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600">{description}</p>
      <nav aria-label="Launch tools" className="my-8 flex flex-wrap gap-2 border-b border-gray-200 pb-5">
        {[["directories", "Directory catalogue"], ["checklist", "Launch checklist"], ["kit", "Launch kit"]].map(([id, label]) => (
          <Link key={id} href={`/launch-support/${id}`} aria-current={active === id ? "page" : undefined}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 ${active === id ? "border-coral-200 bg-coral-50 text-coral-800" : "border-gray-200 bg-white text-gray-700 hover:border-coral-300"}`}>{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
