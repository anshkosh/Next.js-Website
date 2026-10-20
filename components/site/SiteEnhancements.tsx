"use client";

import { ArrowUp, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"];
const UTM_STORAGE_KEY = "anshkosh-utm-context";
const COOKIE_NOTICE_KEY = "anshkosh-cookie-consent";

export function SiteEnhancements() {
  const pathname = usePathname();
  const isFounderWorkspace = pathname === "/dashboard" || pathname?.startsWith("/dashboard/");
  const [showTop, setShowTop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cookiesVisible, setCookiesVisible] = useState(false);

  useEffect(() => {
    // The site is light-only. Clear the former opt-in without touching other preferences.
    document.documentElement.classList.remove("dark");
    try { window.localStorage.removeItem("anshkosh-theme"); } catch { /* Storage may be unavailable. */ }

    const updateScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      setShowTop(window.scrollY > 500);
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });

    const noticeDismissed = window.localStorage.getItem(COOKIE_NOTICE_KEY);
    // This is only a local dismissal preference, not cookie consent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCookiesVisible(!noticeDismissed);

    const incoming = new URLSearchParams(window.location.search);
    const utm = Object.fromEntries(UTM_KEYS.filter((key) => incoming.has(key)).map((key) => [key, incoming.get(key) || ""]));
    if (Object.keys(utm).length > 0) window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));

    const decorateLink = (anchor: HTMLAnchorElement) => {
      if (anchor.dataset.noUtm === "true" || anchor.href.startsWith("mailto:") || anchor.href.startsWith("tel:")) return;
      const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (!stored) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      let params: Record<string, string>;
      try {
        params = JSON.parse(stored) as Record<string, string>;
      } catch {
        window.sessionStorage.removeItem(UTM_STORAGE_KEY);
        return;
      }
      Object.entries(params).forEach(([key, value]) => {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      anchor.href = url.toString();
    };
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (anchor) decorateLink(anchor);
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("scroll", updateScroll);
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  const dismissCookieNotice = () => {
    try { window.localStorage.setItem(COOKIE_NOTICE_KEY, "dismissed"); } catch { /* Close for this visit when storage is unavailable. */ }
    setCookiesVisible(false);
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-1" aria-hidden="true">
        <div className="h-full bg-coral-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {!isFounderWorkspace && !cookiesVisible && <div className="fixed bottom-5 right-5 z-40 hidden flex-col gap-3 md:flex print:hidden">
        <a href="/contact" aria-label="Contact Anshkosh" className="group flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-coral-600 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-coral-700">
          <MessageCircle size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Contact us</span>
        </a>
      </div>}

      {showTop && !isFounderWorkspace && !cookiesVisible && (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })} aria-label="Scroll back to top" className="fixed bottom-20 right-5 z-40 hidden h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-soft transition-colors hover:border-coral-300 hover:text-coral-600 md:flex print:hidden">
          <ArrowUp size={19} aria-hidden="true" />
        </button>
      )}

      {cookiesVisible && (
        <div role="dialog" aria-label="Cookie and browser storage notice" className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl sm:flex sm:items-center sm:gap-5 dark:border-gray-700 dark:bg-gray-900 print:hidden">
          <p className="flex-1 pr-10 text-sm leading-relaxed text-gray-600 sm:pr-0 dark:text-gray-300">Anshkosh uses session and security cookies, a first-party cookie to remember your vote, and browser storage for preferences and drafts. CAPTCHA providers may process browser information. <a href="/privacy" className="font-medium text-coral-600 underline">Read our privacy notice.</a></p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button type="button" onClick={dismissCookieNotice} className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-coral-500 dark:hover:bg-coral-600">Got it</button>
          </div>
          <button type="button" onClick={dismissCookieNotice} aria-label="Dismiss cookie and browser storage notice" className="absolute right-2 top-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-400 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500 sm:static dark:hover:text-white"><X size={18} aria-hidden="true" /></button>
        </div>
      )}
    </>
  );
}
