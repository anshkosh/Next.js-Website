import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingCTA from "../components/landing/LandingCTA";

it("optimizes the original CTA artwork while retaining lazy loading, copy and destinations", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<LandingCTA />);
  const image = container.querySelector("img")!;
  const source = new URL(image.getAttribute("src")!, "https://www.anshkosh.com");
  expect(source.pathname).toBe("/_next/image");
  expect(source.searchParams.get("url")).toContain("why-anshkosh-validation-provided");
  expect(image.getAttribute("srcset")).toContain("640w");
  expect(image.getAttribute("sizes")).toBe("100vw");
  expect(image.getAttribute("loading")).toBe("lazy");
  expect(container.querySelector("h2")?.textContent).toContain("Build the case.");
  expect(container.querySelector("h2")?.textContent).toContain("Earn the attention.");
  expect(container.querySelector('a[href="/register"]')?.textContent).toBe("Start Validating");
  expect(container.querySelector('a[href="/discover"]')?.textContent).toBe("Explore Startups");
});
