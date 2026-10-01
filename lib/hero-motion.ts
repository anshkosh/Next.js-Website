/** The supplied ZIP's reversible reaching-hand motion; the fruit never moves. */
export function getHeroMotion(progress: number) {
  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const value = Math.min(1, Math.max(0, safeProgress));
  const eased = value * value * (3 - 2 * value);
  return {
    handX: 8 - 17 * eased,
    handY: -10 + 27 * eased,
    handRotation: 4 - 10 * eased,
  };
}

export function getHeroScrollProgress(scrollY: number, top: number, height: number) {
  const travel = Math.max(height * 0.5, 1);
  return Math.min(1, Math.max(0, (scrollY - top) / travel));
}
