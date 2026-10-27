import type { Metadata } from "next";

export function resolveSiteUrl(configuredUrl = "https://www.anshkosh.com") {
  const url = new URL(configuredUrl);
  if (url.hostname === "anshkosh.com" || url.hostname === "www.anshkosh.com") {
    url.hostname = "www.anshkosh.com";
    url.protocol = "https:";
    url.port = "";
  }
  return url.origin;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_BASE_URL || undefined);
export const DEFAULT_SOCIAL_IMAGE = "/images/hero-pomegranate-v2.webp";
export const PILOT_DESCRIPTION = "Explore Indian startup profiles, follow founder progress, share useful feedback, and use free founder tools.";

export function absoluteUrl(path = "/") {
  const url = new URL(path, `${SITE_URL}/`);
  // Migrate legacy first-party URLs without changing external editorial canonicals.
  if (url.hostname === "anshkosh.com" || url.hostname === "www.anshkosh.com") {
    url.hostname = "www.anshkosh.com";
    url.protocol = "https:";
    url.port = "";
  }
  return url.toString();
}

export function seoMetadata({
  title,
  description,
  path,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, type, siteName: "Anshkosh", locale: "en_IN",
      images: [{ url: absoluteUrl(DEFAULT_SOCIAL_IMAGE), alt: "Anshkosh startup discovery" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [absoluteUrl(DEFAULT_SOCIAL_IMAGE)] },
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Anshkosh",
  alternateName: "Ansh Kosh",
  url: SITE_URL,
  logo: absoluteUrl("/logo.svg"),
  description: PILOT_DESCRIPTION,
  email: "hello@anshkosh.com",
  sameAs: [
    "https://twitter.com/anshkosh",
    "https://www.linkedin.com/company/143187995/",
    "https://github.com/anshkosh",
    "https://www.producthunt.com/products/anshkosh",
    "https://apprater.net/a/anshkosh",
    "https://launchfree.io/listings/anshkosh.html",
    "https://www.crunchbase.com/organization/anshkosh",
    "https://medium.com/@anshkosh",
    "https://www.youtube.com/@Anshkosh",
    "https://www.instagram.com/ansh.kosh/",
    "https://www.facebook.com/profile.php?id=61592499604748",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Anshkosh",
  alternateName: "Ansh Kosh",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export function startupOrganizationSchema(startup: {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  logoUrl?: string | null;
  founders: { name: string; role?: string | null }[];
}) {
  const profileUrl = absoluteUrl(`/startups/${startup.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${profileUrl}#organization`,
    name: startup.name,
    description: startup.description,
    url: startup.websiteUrl || profileUrl,
    mainEntityOfPage: profileUrl,
    ...(startup.logoUrl ? { logo: absoluteUrl(startup.logoUrl) } : {}),
    ...(startup.founders.length ? {
      founder: startup.founders.map(founder => ({
        "@type": "Person",
        name: founder.name,
        ...(founder.role ? { jobTitle: founder.role } : {}),
      })),
    } : {}),
  };
}
