"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { requestPreviewMotion } from "@/lib/preview-motion";

export function PreEntryCurtain({ authenticated = false }: { authenticated?: boolean }) {
  const pathname = usePathname();
  return pathname === "/" && !authenticated ? <HomeCurtain /> : null;
}

function HomeCurtain() {
  const [entered, setEntered] = useState(false);
  const [opening, setOpening] = useState(false);
  const enterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (entered) return;

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
    const fallback = window.setTimeout(() => setEntered(true), 3400);
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
    requestPreviewMotion();
    setOpening(true);
  };

  if (entered) return null;

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
        <h2 id="curtain-title">Anshkosh is under construction.</h2>
        <p id="curtain-description">
          We’re getting things ready. Take a sneak peek behind the curtains and explore what we’re building.
        </p>
        <button ref={enterButtonRef} type="button" onClick={enterSite} aria-disabled={opening} className="curtain-entry-button">
          Sneak peek
        </button>
        <p className="curtain-note">Preview build · expect a few rough edges</p>
      </div>
    </div>
  );
}
