// Scrolls started from script ignore the CSS reduced-motion rule, so ask first.
export function preferredScrollBehavior(): ScrollBehavior {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
