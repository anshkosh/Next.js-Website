import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LandingFeaturedOn from "../components/landing/LandingFeaturedOn";
import { FEATURED_LISTINGS } from "../lib/featured-listings";

function renderSection() {
  return new DOMParser().parseFromString(renderToStaticMarkup(<LandingFeaturedOn />), "text/html");
}

describe("Anshkosh directory badge strip", () => {
  it("links only to the three checked Anshkosh profiles, not directory homepages", () => {
    expect(FEATURED_LISTINGS.map(({ href }) => href)).toEqual([
      "https://www.producthunt.com/products/anshkosh",
      "https://techbasedirectory.com/product/anshkosh?utm_source=featured_embed",
      "https://www.crunchbase.com/organization/anshkosh",
    ]);
    const links = renderSection().querySelectorAll("a");
    expect(links).toHaveLength(3);
    for (const [index, listing] of FEATURED_LISTINGS.entries()) {
      expect(links[index].getAttribute("href")).toBe(listing.href);
      expect(links[index].textContent).toContain(listing.name);
      expect(links[index].textContent).toContain(listing.label);
    }
  });

  it("uses an accessible labelled section, safe external links and no extra H1", () => {
    const document = renderSection();
    expect(document.querySelector("section")?.getAttribute("aria-labelledby")).toBe("featured-on-title");
    expect(document.querySelector("h2#featured-on-title")).not.toBeNull();
    expect(document.querySelector("h1")).toBeNull();
    expect(document.querySelectorAll("ul > li")).toHaveLength(3);
    for (const [index, link] of [...document.querySelectorAll("a")].entries()) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("aria-label")).toBe(`View Anshkosh on ${FEATURED_LISTINGS[index].name} (opens in a new tab)`);
      expect(link.className).toContain("focus-visible:");
      expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("distinguishes launches, listings and company profiles without award or partner claims", () => {
    const document = renderSection();
    expect(document.body.textContent).toContain("Launched on");
    expect(document.body.textContent).toContain("Listed on");
    expect(document.body.textContent).toContain("Company profile");
    expect(document.body.textContent).not.toMatch(/partner|award|ranked|#1|trusted by/i);
    expect(document.querySelector("img")).toBeNull(); // No third-party tracking images.
    expect(document.querySelector("ul")?.className).toContain("grid-cols-1");
    expect(document.querySelector("ul")?.className).toContain("md:grid-cols-3");
  });
});
