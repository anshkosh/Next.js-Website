/** Reach to just before contact, then hold without crossing the stationary fruit. */
export function getHeroMotion(progress: number) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const value = Math.min(1, Math.max(0, safeProgress) / 0.75);
  // 45% of the previous trajectory is the last clear, pre-contact pose.
  // Re-ease to that point instead of abruptly clipping a moving hand.
  const contactProgress = 0.45;
  const contactEase = contactProgress * contactProgress * (3 - 2 * contactProgress);
  const eased = value * value * (3 - 2 * value) * contactEase;
  return {
    handX: 8 - 37 * eased,
    handY: -10 + 32.5 * eased,
    handRotation: 4 - 10 * eased,
  };
}

export function getHeroScrollProgress(scrollY: number, top: number, height: number) {
  const travel = Math.max(height * 0.5, 1);
  return Math.min(1, Math.max(0, (scrollY - top) / travel));
}
