import { describe, expect, it } from "vitest";
import { getHeroMotion, getHeroScrollProgress } from "../lib/hero-motion";

describe("reference ZIP's scroll-linked reaching hand", () => {
  it("starts with the same raised, rightward pose as the reference", () => {
    expect(getHeroMotion(0)).toEqual({ handX: 8, handY: -10, handRotation: 4 });
  });

  it("eases leftward and down into the grabbing position", () => {
    expect(getHeroMotion(0.5)).toEqual({ handX: -0.5, handY: 3.5, handRotation: -1 });
    expect(getHeroMotion(1)).toEqual({ handX: -9, handY: 17, handRotation: -6 });
  });

  it("animates only the hand, with no fruit-lifting or pose-crossfade values", () => {
    expect(Object.keys(getHeroMotion(1))).toEqual(["handX", "handY", "handRotation"]);
  });

  it("clamps overscroll and invalid progress", () => {
    expect(getHeroMotion(-2)).toEqual(getHeroMotion(0));
    expect(getHeroMotion(3)).toEqual(getHeroMotion(1));
    expect(getHeroMotion(Number.NaN)).toEqual(getHeroMotion(0));
  });

  it("uses the reference half-hero-height scroll range at different sizes", () => {
    expect(getHeroScrollProgress(0, 132, 900)).toBe(0);
    expect(getHeroScrollProgress(132, 132, 900)).toBe(0);
    expect(getHeroScrollProgress(357, 132, 900)).toBe(0.5);
    expect(getHeroScrollProgress(582, 132, 900)).toBe(1);
    expect(getHeroScrollProgress(482, 132, 700)).toBe(1);
    expect(getHeroScrollProgress(-50, 132, 900)).toBe(0);
    expect(getHeroScrollProgress(10, 0, 0)).toBe(1);
  });
});
