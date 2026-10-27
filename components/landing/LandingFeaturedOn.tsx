import { ArrowUpRight } from "lucide-react";
import { FEATURED_LISTINGS } from "@/lib/featured-listings";

export default function LandingFeaturedOn() {
  return (
    <section aria-labelledby="directory-profile-title" className="border-t border-gray-200 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="directory-profile-title" className="font-sans text-sm font-bold uppercase tracking-[0.16em] text-gray-900">
            Directory profile
          </h2>
          <p className="max-w-sm text-sm text-gray-600 sm:text-right">
            AppRater hosts an independent public profile. Directory listings are not endorsements.
          </p>
        </div>
        <ul className="flex">
          {FEATURED_LISTINGS.map((listing) => (
            <li key={listing.id} className="w-full max-w-[22rem]">
              <a
                href={listing.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View Anshkosh on ${listing.name} (opens in a new tab)`}
                className="group flex h-full min-h-28 items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition-colors hover:border-coral-300 hover:bg-coral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500"
              >
                {/* Self-hosted icon for the independent directory profile. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={listing.logo} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-[22%] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {listing.label}
                  </span>
                  <span className="block break-words text-lg font-bold tracking-tight text-gray-900">
                    {listing.name}
                  </span>
                </span>
                <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-coral-700" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
