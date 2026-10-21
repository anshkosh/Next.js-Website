import { ArrowUpRight } from "lucide-react";
import { FEATURED_LISTINGS } from "@/lib/featured-listings";
import FeaturedMarquee from "./FeaturedMarquee";

// The track holds the list twice so the drifting strip can loop seamlessly. The
// second copy is hidden from assistive technology and the tab order.
const TRACK = [...FEATURED_LISTINGS, ...FEATURED_LISTINGS];

export default function LandingFeaturedOn() {
  return (
    <section aria-labelledby="featured-on-title" className="border-t border-gray-200 bg-white py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="featured-on-title" className="font-sans text-sm font-bold uppercase tracking-[0.16em] text-gray-900">
            Featured on &amp; listed in
          </h2>
          <p className="max-w-sm text-sm text-gray-600 sm:text-right">
            Find Anshkosh on startup and company directories.
          </p>
        </div>
        <FeaturedMarquee>
          <ul className="flex w-max">
            {TRACK.map((listing, index) => {
              const copy = index >= FEATURED_LISTINGS.length;
              return (
                <li key={`${listing.id}-${index}`} aria-hidden={copy || undefined} className={`w-[22rem] shrink-0 pr-4${copy ? " featured-marquee-copy" : ""}`}>
                  <a
                    href={listing.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={copy ? -1 : undefined}
                    aria-label={`View Anshkosh on ${listing.name} (opens in a new tab)`}
                    className="group flex h-full min-h-28 items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition-colors hover:border-coral-300 hover:bg-coral-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-500"
                  >
                    {/* Self-hosted site icons; a text monogram where the directory has none. These are listings, not endorsements. */}
                    {"logo" in listing ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.logo} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-[22%] object-cover" />
                    ) : (
                      <span aria-hidden="true" className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white ${listing.accent}`}>
                        {listing.monogram}
                      </span>
                    )}
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
              );
            })}
          </ul>
        </FeaturedMarquee>
      </div>
    </section>
  );
}
