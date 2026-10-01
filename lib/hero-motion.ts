/** Reference-style reaching motion, calibrated to the new hand's finger/thumb gap. */
export function getHeroMotion(progress: number) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const value = Math.min(1, Math.max(0, safeProgress));
  const eased = value * value * (3 - 2 * value);
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
