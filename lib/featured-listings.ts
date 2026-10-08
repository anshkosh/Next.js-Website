// Logos are self-hosted copies of each directory's public site icon (no third-party
// image requests); Free Startup Listing publishes none, so it keeps a text monogram.
// Public Anshkosh pages checked on 2026-10-02 (AppRater, LaunchFree and Free
// Startup Listing re-checked on 2026-10-08). These are listings, not
// partnerships or editorial endorsements. Only add a platform after checking
// that its public page identifies Anshkosh and links to the correct website.
export const FEATURED_LISTINGS = [
  {
    id: "product-hunt",
    logo: "/images/listings/product-hunt.png",
    name: "Product Hunt",
    label: "Launched on",
    monogram: "P",
    href: "https://www.producthunt.com/products/anshkosh",
    accent: "bg-[#DA552F]",
  },
  {
    id: "techbase-directory",
    logo: "/images/listings/techbase.png",
    name: "TechBaseDirectory",
    label: "Listed on",
    monogram: "TB",
    href: "https://techbasedirectory.com/product/anshkosh?utm_source=featured_embed",
    accent: "bg-gray-900",
  },
  {
    id: "crunchbase",
    logo: "/images/listings/crunchbase.png",
    name: "Crunchbase",
    label: "Company profile",
    monogram: "cb",
    href: "https://www.crunchbase.com/organization/anshkosh",
    accent: "bg-[#146AFF]",
  },
  {
    id: "apprater",
    logo: "/images/listings/apprater.svg",
    name: "AppRater",
    label: "Listed on",
    monogram: "AR",
    href: "https://apprater.net/a/anshkosh",
    accent: "bg-[#0F766E]",
  },
  {
    id: "launchfree",
    logo: "/images/listings/launchfree.png",
    name: "LaunchFree",
    label: "Listed on",
    monogram: "LF",
    href: "https://launchfree.io/listings/anshkosh.html",
    accent: "bg-[#7C3AED]",
  },
  {
    id: "free-startup-listing",
    name: "Free Startup Listing",
    label: "Listed on",
    monogram: "FS",
    href: "https://freestartuplisting.org/",
    accent: "bg-[#B45309]",
  },
] as const;
