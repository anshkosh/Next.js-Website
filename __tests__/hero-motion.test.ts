import { describe, expect, it } from "vitest";
import { getHeroMotion, getHeroScrollProgress } from "../lib/hero-motion";

describe("scroll-linked reaching hand aligned with the pomegranate", () => {
  it("starts with the same raised, rightward pose as the reference", () => {
    expect(getHeroMotion(0)).toEqual({ handX: 8, handY: -10, handRotation: 4 });
  });

  it("eases leftward and down into the grabbing position", () => {
    expect(getHeroMotion(0.5)).toEqual({ handX: -10.5, handY: 6.25, handRotation: -1 });
    expect(getHeroMotion(1)).toEqual({ handX: -29, handY: 22.5, handRotation: -6 });
  });

  it("animates only the hand, with no fruit-lifting or pose-crossfade values", () => {
    expect(Object.keys(getHeroMotion(1))).toEqual(["handX", "handY", "handRotation"]);
  });

  it("centers the finger/thumb gap on the fruit across scene sizes", () => {
    const motion = getHeroMotion(1);
    const angle = motion.handRotation * Math.PI / 180;
    // Asset-space gap at (206, 312), CSS pivot at 78% / 58%.
    // Match the fruit's body center, slightly below its crown.
    for (const [width, height] of [[610, 340], [712, 400], [820, 460], [1672, 941]]) {
      const handWidth = width * 0.474;
      const handHeight = handWidth * 427 / 960;
      const pivotX = handWidth * 0.78;
      const pivotY = handHeight * 0.58;
      const gapX = handWidth * 206 / 960 - pivotX;
      const gapY = handHeight * 312 / 427 - pivotY;
      const x = width * 0.527 + handWidth * motion.handX / 100 + pivotX
        + gapX * Math.cos(angle) - gapY * Math.sin(angle);
      const y = height * 0.341 + handHeight * motion.handY / 100 + pivotY
        + gapX * Math.sin(angle) + gapY * Math.cos(angle);
      const fruitX = width * (0.4575 + 0.078 * 0.5);
      const fruitY = height * 0.6665 + width * 0.078 * 201 / 184 * 0.55;
      expect(Math.abs(x - fruitX)).toBeLessThan(width * 0.003);
      expect(Math.abs(y - fruitY)).toBeLessThan(height * 0.003);
    }
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
