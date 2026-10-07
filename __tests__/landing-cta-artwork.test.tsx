import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingCTA from "../components/landing/LandingCTA";

it("keeps the original CTA artwork optimized and points the revised copy to discovery and listing", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<LandingCTA />);
  const image = container.querySelector("img")!;
  const source = new URL(image.getAttribute("src")!, "https://www.anshkosh.com");
  expect(source.pathname).toBe("/_next/image");
  expect(source.searchParams.get("url")).toContain("why-anshkosh-validation-provided");
  expect(image.getAttribute("srcset")).toContain("640w");
  expect(image.getAttribute("sizes")).toBe("100vw");
  expect(image.getAttribute("loading")).toBe("lazy");
  expect(container.querySelector("h2")?.textContent).toContain("Bring your next step");
  expect(container.querySelector("h2")?.textContent).toContain("to Anshkosh.");
  expect(container.querySelector('a[href="/startup/new"]')?.textContent).toBe("List your startup");
  expect(container.querySelector('a[href="/discover"]')?.textContent?.trim()).toBe("Discover startups");
});
