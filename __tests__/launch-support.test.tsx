import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LaunchSupportPage, { metadata } from "../app/(public)/launch-support/page";
import ContactPage from "../app/(public)/contact/page";
import { absoluteUrl } from "../lib/seo";
import { CONTACT_SUBJECTS, contactSchema } from "../lib/validators/contact.schema";
import LaunchSupportTeaser from "../components/landing/LaunchSupportTeaser";
import LandingValueProps from "../components/landing/LandingValueProps";
import LandingHero from "../components/landing/LandingHero";
import LandingCTA from "../components/landing/LandingCTA";

vi.mock("../app/(public)/contact/ContactContent", () => ({ default: () => null }));

describe("free early-access launch support", () => {
  it("places listing and SEO outreach only in founder benefits, not the hero or closing banner", () => {
    const document = new DOMParser().parseFromString(renderToStaticMarkup(<LandingValueProps />), "text/html");
    const founders = document.querySelector('article[aria-labelledby="founder-benefits-title"]');
    const backers = document.querySelector('article[aria-labelledby="backer-benefits-title"]');
    expect(founders?.querySelector('a[href="/launch-support"]')).not.toBeNull();
    expect(founders?.textContent).toContain("credible SEO backlink outreach");
    expect(founders?.textContent).toContain("credible SEO backlink outreach (planned)");
    const benefits = founders?.querySelectorAll("ul > li");
    expect(benefits).toHaveLength(5);
    for (const benefit of benefits ?? []) {
      expect(benefit.className).toBe(benefits?.[0].className);
      expect(benefit.querySelector("svg")).not.toBeNull();
    }
    expect(founders?.querySelector('ul > li a[href="/launch-support"]')).not.toBeNull();
    expect(backers?.querySelectorAll("ul > li")).toHaveLength(3);
    expect(backers?.querySelector('a[href="/launch-support"]')).toBeNull();
    for (const banner of [<LandingHero key="hero" />, <LandingCTA key="cta" />]) {
      const markup = renderToStaticMarkup(banner);
      expect(markup).not.toContain("Free startup listings");
      expect(markup).not.toContain("SEO backlink");
    }
  });

  it("explains the free listing offer and planned SEO outreach on the homepage", () => {
    const document = new DOMParser().parseFromString(renderToStaticMarkup(<ul><LaunchSupportTeaser /></ul>), "text/html");
    expect(document.querySelector('a[href="/launch-support"]')?.textContent).toContain("Free startup listings & launch support");
    expect(document.body.textContent).toContain("credible SEO backlink outreach");
    expect(document.body.textContent).toContain("credible SEO backlink outreach (planned)");
    expect(document.querySelectorAll("ul > li")).toHaveLength(2);
    expect(document.querySelector("p")).toBeNull();
  });

  it("renders one H1, free support, and working internal calls to action", () => {
    const document = new DOMParser().parseFromString(renderToStaticMarkup(<LaunchSupportPage />), "text/html");
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("h1")?.textContent).toContain("Anshkosh");
    expect(document.body.textContent).toContain("Free during early access");
    expect(document.body.textContent).toContain("No payment details. No automatic paid subscription.");
    expect(document.querySelector('a[href="/startup/new"]')).not.toBeNull();
    expect(document.querySelector('a[href="/contact?subject=Free%20launch%20support"]')).not.toBeNull();
    expect(document.querySelector('a[href="/trust-safety"]')).not.toBeNull();
    for (const tool of ["directories", "checklist", "kit"]) {
      expect(document.querySelector(`a[href="/launch-support/${tool}"]`)).not.toBeNull();
    }
    expect(document.body.textContent).not.toMatch(/₹|\$\d|buy now/i);
  });

  it("keeps future outreach separate from available services and avoids ranking promises", () => {
    const html = renderToStaticMarkup(<LaunchSupportPage />);
    expect(html).toContain("Planned — not available yet");
    expect(html).toContain("backlink packages are not currently offered");
    expect(html).toContain("We do not guarantee backlinks");
    expect(html).toContain("Startup approval, upvotes, and validation signals cannot be bought.");
  });

  it("supplies canonical and share metadata", () => {
    expect(metadata.title).toContain("Anshkosh");
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/launch-support"));
    expect(metadata.openGraph).toMatchObject({ url: absoluteUrl("/launch-support") });
  });

  it("accepts support requests through the existing validated contact flow", () => {
    expect(CONTACT_SUBJECTS).toContain("Free launch support");
    const request = {
      name: "Founder", email: "founder@example.com", subject: "Free launch support",
      message: "Please help improve our startup profile and founder story.", turnstileToken: "test-token",
    };
    expect(contactSchema.safeParse(request).success).toBe(true);
    expect(contactSchema.safeParse({ ...request, turnstileToken: "" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...request, subject: "Unrecognised" }).success).toBe(false);
  });

  it("preselects an allowed subject and rejects arbitrary or repeated query values", async () => {
    const support = await ContactPage({ searchParams: Promise.resolve({ subject: "Free launch support" }) });
    expect(support.props.initialSubject).toBe("Free launch support");
    const defaultPage = await ContactPage({ searchParams: Promise.resolve({}) });
    expect(defaultPage.props.initialSubject).toBe("");
    for (const subject of ["Unrecognised", ["Free launch support", "General"]]) {
      const page = await ContactPage({ searchParams: Promise.resolve({ subject }) });
      expect(page.props.initialSubject).toBe("");
    }
  });
});
