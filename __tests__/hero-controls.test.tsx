import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import HeroArtwork from "../components/landing/HeroArtwork";

it("renders the hero artwork without an animation banner or controls", () => {
  const html = renderToStaticMarkup(<HeroArtwork />);
  expect(html).toContain("data-hero-artwork");
  expect(html).not.toContain("<button");
  expect(html).not.toContain("Pause animation");
  expect(html).not.toContain("Enable scroll animation");
  expect(html).not.toContain("Scroll to bring the hand");
});

it("uses the supplied PNG unchanged without substitute layers or dithering filters", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<HeroArtwork />);
  const images = container.querySelectorAll("img");
  expect(images).toHaveLength(1);
  expect(images[0].getAttribute("src")).toBe("/images/hero-dither-provided.png");
  expect(images[0].getAttribute("srcset")).toBeNull();
  expect(container.querySelector("filter")).toBeNull();
  expect(container.querySelector("[data-hero-dither]")).toBeNull();
});
