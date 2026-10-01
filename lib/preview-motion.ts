// Session-only permission: no autoplay override before a visitor chooses Sneak peek.
let requested = false;
const listeners = new Set<() => void>();

export function subscribeToPreviewMotion(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function previewMotionRequested() {
  return requested;
}

export function requestPreviewMotion() {
  if (requested) return;
  requested = true;
  listeners.forEach((listener) => listener());
}
