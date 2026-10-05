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

it("delivers responsive versions of the original artwork without substitute layers or filters", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<HeroArtwork />);
  const images = container.querySelectorAll("img");
  expect(images).toHaveLength(1);
  const source = new URL(images[0].getAttribute("src")!, "https://www.anshkosh.com");
  expect(source.pathname).toBe("/_next/image");
  expect(source.searchParams.get("url")).toContain("hero-dither-provided");
  expect(images[0].getAttribute("srcset")).toContain("640w");
  expect(images[0].getAttribute("sizes")).toContain("610px");
  expect(images[0].getAttribute("loading")).not.toBe("lazy");
  expect(container.querySelector('link[rel="preload"][as="image"]')).not.toBeNull();
  expect(container.querySelector("filter")).toBeNull();
  expect(container.querySelector("[data-hero-dither]")).toBeNull();
});
