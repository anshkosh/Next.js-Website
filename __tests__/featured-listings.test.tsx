import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LandingFeaturedOn from "../components/landing/LandingFeaturedOn";
import { FEATURED_LISTINGS } from "../lib/featured-listings";

function renderSection() {
  return new DOMParser().parseFromString(renderToStaticMarkup(<LandingFeaturedOn />), "text/html");
}

describe("Anshkosh directory profile section", () => {
  it("links only to the currently checked Anshkosh profile", () => {
    expect(FEATURED_LISTINGS.map(({ href }) => href)).toEqual([
      "https://apprater.net/a/anshkosh",
    ]);
    const links = renderSection().querySelectorAll("a");
    expect(links).toHaveLength(FEATURED_LISTINGS.length);
    for (const [index, listing] of FEATURED_LISTINGS.entries()) {
      expect(links[index].getAttribute("href")).toBe(listing.href);
      expect(links[index].textContent).toContain(listing.name);
      expect(links[index].textContent).toContain(listing.label);
    }
  });

  it("uses an accessible labelled section, safe external links and no extra H1", () => {
    const document = renderSection();
    expect(document.querySelector("section")?.getAttribute("aria-labelledby")).toBe("directory-profile-title");
    expect(document.querySelector("h2#directory-profile-title")).not.toBeNull();
    expect(document.querySelector("h1")).toBeNull();
    expect(document.querySelectorAll("ul > li")).toHaveLength(FEATURED_LISTINGS.length);
    for (const [index, link] of [...document.querySelectorAll("a")].entries()) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("aria-label")).toBe(`View Anshkosh on ${FEATURED_LISTINGS[index % FEATURED_LISTINGS.length].name} (opens in a new tab)`);
      expect(link.className).toContain("focus-visible:");
      expect(link.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    }
  });

  it("labels the directory profile as independent without endorsement claims", () => {
    const document = renderSection();
    expect(document.body.textContent).toContain("Public profile");
    expect(document.body.textContent).toContain("AppRater hosts an independent public profile.");
    expect(document.body.textContent).toContain("Directory listings are not endorsements.");
    expect(document.body.textContent).not.toMatch(/partner|award|ranked|#1|trusted by/i);
    // Logos are self-hosted site icons, never third-party image requests.
    const images = [...document.querySelectorAll("img")];
    expect(images.length).toBeGreaterThan(0);
    expect(images.every(image => image.getAttribute("src")?.startsWith("/images/listings/") && image.getAttribute("alt") === "")).toBe(true);
  });

  it("does not add controls to the static profile section", () => {
    expect(renderSection().querySelector("button")).toBeNull();
  });

  it("renders one static copy without a moving marquee", () => {
    const document = renderSection();
    expect(document.querySelector(".featured-marquee-track")).toBeNull();
    const items = [...document.querySelectorAll("li")];
    expect(items).toHaveLength(FEATURED_LISTINGS.length);
    expect(items.every(item => item.getAttribute("aria-hidden") === null)).toBe(true);
  });
});
