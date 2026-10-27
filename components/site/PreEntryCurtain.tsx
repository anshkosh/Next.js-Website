"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { CURTAIN_SEEN_KEY } from "@/lib/curtain";

// Shown once per browser session; app/layout.tsx hides it before paint on later visits.
function curtainSeen() {
  try { return window.sessionStorage.getItem(CURTAIN_SEEN_KEY) === "1"; } catch { return false; }
}

function rememberCurtain() {
  try { window.sessionStorage.setItem(CURTAIN_SEEN_KEY, "1"); } catch { /* Storage may be unavailable. */ }
}

const subscribeToNothing = () => () => {};

export function PreEntryCurtain({ authenticated = false }: { authenticated?: boolean }) {
  const pathname = usePathname();
  return pathname === "/" && !authenticated ? <HomeCurtain /> : null;
}

function HomeCurtain() {
  const [entered, setEntered] = useState(false);
  const [opening, setOpening] = useState(false);
  const enterButtonRef = useRef<HTMLButtonElement>(null);
  const seen = useSyncExternalStore(subscribeToNothing, curtainSeen, () => false);

  useEffect(() => {
    if (entered || curtainSeen()) return;

    const content = document.getElementById("site-content");
    const previousOverflow = document.body.style.overflow;
    if (content) content.inert = true;
    document.body.style.overflow = "hidden";
    enterButtonRef.current?.focus({ preventScroll: true });

    return () => {
      if (content) content.inert = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [entered]);

  useEffect(() => {
    if (entered) {
      // Remember only once the reveal is over, so the opening is not cut short.
      rememberCurtain();
      const main = document.getElementById("main-content");
      if (main) {
        if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
      }
    }
  }, [entered]);

  useEffect(() => {
    if (!opening || entered) return;
    // Unlock even if the browser cancels the transition or the motion preference changes.
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) setEntered(true);
    };
    const fallback = window.setTimeout(() => setEntered(true), 1200);
    media?.addEventListener("change", onMotionChange);
    return () => {
      window.clearTimeout(fallback);
      media?.removeEventListener("change", onMotionChange);
    };
  }, [opening, entered]);

  const enterSite = () => {
    if (opening) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }
    setOpening(true);
  };

  if (entered || seen) return null;

  return (
    <div
      className={`curtain-stage${opening ? " curtain-stage--opening" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="curtain-title"
      aria-describedby="curtain-description"
      data-print-hide="true"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          enterButtonRef.current?.focus();
        }
      }}
    >
      <div className="curtain-panel curtain-panel--left" aria-hidden="true" />
      <div
        className="curtain-panel curtain-panel--right"
        aria-hidden="true"
        onTransitionEnd={(event) => {
          if (opening && event.target === event.currentTarget && event.propertyName === "transform") {
            setEntered(true);
          }
        }}
      />
      <div className="curtain-seam" aria-hidden="true" />

      <div className="curtain-copy">
        <p className="curtain-kicker">Anshkosh · early access pilot</p>
        <h2 id="curtain-title">Explore the Anshkosh pilot.</h2>
        <p id="curtain-description">
          Browse startup profiles, follow founder progress, and use free Launch Support tools. Profiles are reviewed before publication.
        </p>
        <button ref={enterButtonRef} type="button" onClick={enterSite} aria-disabled={opening} className="curtain-entry-button">
          Browse Anshkosh
        </button>
        <p className="curtain-note">Early access · no payments or preorders</p>
      </div>
    </div>
  );
}
