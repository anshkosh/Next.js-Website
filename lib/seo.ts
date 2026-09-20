import type { Metadata } from "next";

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://anshkosh.com").replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
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
    alternates: { canonical: path },
    openGraph: { title, description, url, type, siteName: "Anshkosh", locale: "en_IN" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Anshkosh",
  alternateName: "Ansh Kosh",
  url: SITE_URL,
  logo: absoluteUrl("/logo.svg"),
  description: "A public validation platform for Indian startups before launch.",
  email: "hello@anshkosh.com",
  sameAs: [
    "https://twitter.com/anshkosh",
    "https://www.linkedin.com/company/143187995/",
    "https://github.com/anshkosh",
    "https://www.producthunt.com/products/anshkosh",
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
