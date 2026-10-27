import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LaunchSupportPage, { metadata } from "../app/(public)/launch-support/page";
import ContactPage from "../app/(public)/contact/page";
import { absoluteUrl } from "../lib/seo";
import { CONTACT_SUBJECTS, contactSchema } from "../lib/validators/contact.schema";
import LandingHero from "../components/landing/LandingHero";
import LandingCTA from "../components/landing/LandingCTA";

vi.mock("../app/(public)/contact/ContactContent", () => ({ default: () => null }));

describe("free early-access launch support", () => {
  it("keeps listing and SEO outreach offers out of the hero and closing banner", () => {
    for (const banner of [<LandingHero key="hero" />, <LandingCTA key="cta" />]) {
      const markup = renderToStaticMarkup(banner);
      expect(markup).not.toContain("Free startup listings");
      expect(markup).not.toContain("SEO backlink");
    }
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
    expect(html).toContain("We do not promise directory acceptance, backlinks, indexing, search rankings, traffic, or funding.");
    expect(html).toContain("Startup approval, votes, and validation evidence cannot be bought.");
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
