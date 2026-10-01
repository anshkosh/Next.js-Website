import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LandingCTA from "../components/landing/LandingCTA";

it("uses the supplied PNG unchanged while retaining the CTA copy and destinations", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<LandingCTA />);
  const image = container.querySelector("img")!;
  expect(image.getAttribute("src")).toBe("/images/why-anshkosh-validation-provided.png");
  expect(image.getAttribute("srcset")).toBeNull();
  expect(image.getAttribute("loading")).toBe("lazy");
  expect(container.querySelector("h2")?.textContent).toContain("Build the case.");
  expect(container.querySelector("h2")?.textContent).toContain("Earn the attention.");
  expect(container.querySelector('a[href="/register"]')?.textContent).toBe("Start Validating");
  expect(container.querySelector('a[href="/discover"]')?.textContent).toBe("Explore Startups");
});
