import { absoluteUrl } from "./seo";

// Editorial starter catalogue. Sources are the directories' own public pages,
// reviewed on 2 October 2026. No affiliate links, DR scores or traffic promises.
export const LAUNCH_DIRECTORIES = [
  { name: "Product Hunt", audience: "Tech products", cost: "Check current pricing", stage: "Ready to use", url: "https://www.producthunt.com/", source: "https://help.producthunt.com/en/articles/481909-how-can-i-get-access-to-post", requirements: "Use a personal maker account, not a company account. New accounts normally wait one week before posting.", prepare: "Product website, tagline, screenshots and a maker introduction." },
  { name: "SaaSHub", audience: "Software & SaaS", cost: "Check current pricing", stage: "Released products", url: "https://www.saashub.com/services/submit", source: "https://www.saashub.com/services/submit", requirements: "Released software with an English website and its own domain. Waiting-list pages, agencies and free-hosting subdomains are not accepted.", prepare: "Product URL, relevant categories and comparable products. Domain-email verification helps establish ownership." },
  { name: "ListMySaaS", audience: "Software & SaaS", cost: "Conditional free / paid", stage: "Live SaaS", url: "https://listmysaas.xyz/submit", source: "https://listmysaas.xyz/submit", requirements: "Free listings currently require their badge and a Domain Rating of at least 10. Paid options have different requirements; check before submitting.", prepare: "Website, name, tagline, description, category, pricing and images." },
  { name: "BetaList", audience: "Internet startups", cost: "Paid", stage: "Pre-launch / recently launched", url: "https://betalist.com/submit", source: "https://betalist.com/support", requirements: "Currently paid-only. Requires an original startup, clear value proposition and its own domain; free-hosting subdomains are not accepted.", prepare: "Startup website, clear description and launch stage. Sign in to view current plans." },
  { name: "TechBaseDirectory", audience: "Tech products", cost: "Paid", stage: "Products ready to list", url: "https://techbasedirectory.com/submit-product", source: "https://techbasedirectory.com/submit-product", requirements: "An account is required. Creating a draft is free, but publishing currently requires a paid package.", prepare: "Product URL, reviewed description and images. Review their package terms before paying." },
] as const;

export const LAUNCH_CHECKLIST = [
  { id: "problem", group: "Make the case", title: "Explain the problem and who has it", detail: "Use a specific audience and a concrete problem, not a broad market claim." },
  { id: "evidence", group: "Make the case", title: "Separate evidence from assumptions", detail: "State what you tested, with whom, when, and what you still do not know." },
  { id: "profile", group: "Make the case", title: "Review your startup profile", detail: "Check your name, tagline, stage and founder roles. Listing is not proof of validation." },
  { id: "website", group: "Prepare your materials", title: "Test your website on mobile", detail: "Check links, signup, contact details, HTTPS and what a new visitor can actually use." },
  { id: "assets", group: "Prepare your materials", title: "Prepare a logo and representative images", detail: "Use images you have permission to share. Label mockups or concepts honestly." },
  { id: "copy", group: "Prepare your materials", title: "Prepare reusable launch copy", detail: "Keep a short pitch, longer description and team introduction ready in your launch kit." },
  { id: "privacy", group: "Choose your channels", title: "Remove private information", detail: "Do not share private phone numbers, credentials, customer data or confidential pitch decks." },
  { id: "fit", group: "Choose your channels", title: "Check each directory's fit and rules", detail: "Review audience, stage, eligibility, cost and link policy. Skip irrelevant directories." },
  { id: "consent", group: "Choose your channels", title: "Agree on what your team will publish", detail: "Confirm the team approves the copy and images. Do not create accounts for others without permission." },
  { id: "measure", group: "After launch", title: "Record listings and real outcomes", detail: "Keep accepted listing URLs and measure useful visits or feedback, not just backlink counts." },
  { id: "respond", group: "After launch", title: "Respond to feedback and publish progress", detail: "Share what changed and keep your claims current. Never buy reviews or upvotes." },
] as const;

export function readChecklist(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const allowed = new Set<string>(LAUNCH_CHECKLIST.map(item => item.id));
    return [...new Set(parsed.filter((id): id is string => typeof id === "string" && allowed.has(id)))];
  } catch { return []; }
}

export type LaunchKitData = {
  name: string; tagline: string; description: string; websiteUrl: string;
  audience: string; stage: string; evidence: string; team: string;
  assets: { label: string; url: string }[];
};

export function safeLaunchUrl(value: string | null | undefined): string {
  if (!value) return "";
  if (value.startsWith("/") && !value.startsWith("//") && !/[\\\s]/.test(value)) return value;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? (url.pathname === "/" && !url.search && !url.hash ? url.href.replace(/\/$/, "") : url.href) : "";
  } catch { return ""; }
}

export function launchKitFromProfile(profile: {
  name: string; tagline: string; description: string; websiteUrl: string;
  targetAudience?: string | null; prototypeStatus?: string | null; tractionEvidence?: string | null;
  logoUrl?: string | null; galleryImages: string[];
  founders: { name: string; role: string | null }[];
}): LaunchKitData {
  return {
    name: profile.name, tagline: profile.tagline, description: profile.description,
    websiteUrl: safeLaunchUrl(profile.websiteUrl), audience: profile.targetAudience ?? "",
    stage: profile.prototypeStatus ?? "", evidence: profile.tractionEvidence ?? "",
    team: profile.founders.map(founder => [founder.name, founder.role].filter(Boolean).join(" — ")).join("\n"),
    assets: [{ label: "Logo", url: safeLaunchUrl(profile.logoUrl) },
      ...profile.galleryImages.map((url, index) => ({ label: `Image ${index + 1}`, url: safeLaunchUrl(url) }))].filter(asset => asset.url).map(asset => ({ ...asset, url: absoluteUrl(asset.url) })),
  };
}

export function exportLaunchKit(kit: LaunchKitData): string {
  const sections = [
    ["Startup", kit.name], ["Tagline", kit.tagline], ["Description", kit.description],
    ["Website", safeLaunchUrl(kit.websiteUrl)], ["Audience", kit.audience], ["Stage", kit.stage],
    ["Evidence & limitations", kit.evidence], ["Team introduction", kit.team],
    ["Asset links (not bundled files)", kit.assets.map(asset => `${asset.label}: ${asset.url}`).join("\n")],
  ];
  return "Anshkosh launch kit\nReview before sharing. No submission or publication is performed.\n\n" +
    sections.map(([label, value]) => `${label}\n${value || "Not provided"}`).join("\n\n");
}
