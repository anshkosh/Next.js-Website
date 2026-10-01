import { describe, expect, it } from "vitest";
import { getHeroMotion, getHeroScrollProgress } from "../lib/hero-motion";

describe("scroll-linked reaching hand stops before overlapping the pomegranate", () => {
  it("starts with the same raised, rightward pose as the reference", () => {
    expect(getHeroMotion(0)).toEqual({ handX: 8, handY: -10, handRotation: 4 });
  });

  it("eases into the pre-contact pose and holds for the remaining scroll", () => {
    const halfway = getHeroMotion(0.5);
    expect(halfway.handX).toBeCloseTo(-3.655);
    expect(halfway.handY).toBeCloseTo(0.2375);
    expect(halfway.handRotation).toBeCloseTo(0.85);
    const end = getHeroMotion(0.75);
    expect(end.handX).toBeCloseTo(-7.73425);
    expect(end.handY).toBeCloseTo(3.820625);
    expect(end.handRotation).toBeCloseTo(-0.2525);
    expect(getHeroMotion(0.9)).toEqual(end);
    expect(getHeroMotion(1)).toEqual(end);
  });

  it("animates only the hand, with no fruit-lifting or pose-crossfade values", () => {
    expect(Object.keys(getHeroMotion(1))).toEqual(["handX", "handY", "handRotation"]);
  });

  it("keeps the approaching fingertip outside the fruit body at different sizes", () => {
    // Nearest fingertip at (70, 370) in the 960 x 427 hand cutout.
    // Check the full trajectory against the fruit body's elliptical silhouette.
    for (const [width, height] of [[610, 340], [712, 400], [820, 460], [1672, 941]]) {
      const handWidth = width * 0.474;
      const handHeight = handWidth * 427 / 960;
      const pivotX = handWidth * 0.78;
      const pivotY = handHeight * 0.58;
      const tipX = handWidth * 70 / 960 - pivotX;
      const tipY = handHeight * 370 / 427 - pivotY;
      const fruitX = width * (0.4575 + 0.078 * 0.5);
      const fruitHeight = width * 0.078 * 201 / 184;
      const fruitY = height * 0.6665 + fruitHeight * 0.6;
      for (let step = 0; step <= 20; step++) {
        const motion = getHeroMotion(step / 20);
        const angle = motion.handRotation * Math.PI / 180;
        const x = width * 0.527 + handWidth * motion.handX / 100 + pivotX
          + tipX * Math.cos(angle) - tipY * Math.sin(angle);
        const y = height * 0.341 + handHeight * motion.handY / 100 + pivotY
          + tipX * Math.sin(angle) + tipY * Math.cos(angle);
        const distance = Math.hypot((x - fruitX) / (width * 0.078 * 0.45),
          (y - fruitY) / (fruitHeight * 0.39));
        expect(distance).toBeGreaterThan(1.15);
      }
    }
  });

  it("arrives without a sudden jump at the stop point", () => {
    const before = getHeroMotion(0.749);
    const end = getHeroMotion(0.75);
    expect(Math.abs(before.handX - end.handX)).toBeLessThan(0.001);
    expect(Math.abs(before.handY - end.handY)).toBeLessThan(0.001);
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
