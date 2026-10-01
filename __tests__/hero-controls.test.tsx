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
