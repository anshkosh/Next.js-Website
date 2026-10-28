// Accept local paths only; also reject encoded controls and separator variants.
export function safeReturnPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value) || /%(?:0[0-9a-f]|1[0-9a-f]|2f|5c|7f)/i.test(value)) return fallback;
  try {
    const url = new URL(value, "https://anshkosh.local");
    if (url.origin !== "https://anshkosh.local" || /^\/(?:login|register|signup|logout|api)(?:\/|$)/.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}
export function loginHref(path: string | null | undefined) {
  return `/login?next=${encodeURIComponent(safeReturnPath(path))}`;
}

export function registerHref(path: string | null | undefined) {
  if (!path) return "/register";
  const next = safeReturnPath(path, "");
  return next ? `/register?next=${encodeURIComponent(next)}` : "/register";
}

export function isStartupSubmissionPath(path: string) {
  try {
    return new URL(path, "https://anshkosh.local").pathname === "/startup/new";
  } catch {
    return false;
  }
}
