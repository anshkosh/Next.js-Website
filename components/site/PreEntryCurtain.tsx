"use client";

import { useEffect, useRef, useState } from "react";

const ENTRY_STORAGE_KEY = "anshkosh-preview-entered";
const OPENING_DURATION = 2500;

export function PreEntryCurtain() {
  const [entered, setEntered] = useState(false);
  const [opening, setOpening] = useState(false);
  const enterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hasEntered = window.sessionStorage.getItem(ENTRY_STORAGE_KEY) === "true";

    // The value comes from browser-only storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntered(hasEntered);
    if (!hasEntered) enterButtonRef.current?.focus();
  }, []);

  const enterSite = () => {
    window.sessionStorage.setItem(ENTRY_STORAGE_KEY, "true");
    setOpening(true);

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setEntered(true);
      return;
    }

    window.setTimeout(() => setEntered(true), OPENING_DURATION);
  };

  if (entered) return null;

  return (
    <div
      className={`curtain-stage${opening ? " curtain-stage--opening" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="curtain-title"
      aria-describedby="curtain-description"
    >
      <div className="curtain-panel curtain-panel--left" aria-hidden="true" />
      <div className="curtain-panel curtain-panel--right" aria-hidden="true" />
      <div className="curtain-seam" aria-hidden="true" />

      <div className="curtain-copy">
        <p className="curtain-kicker">Anshkosh · early access pilot</p>
        <h1 id="curtain-title">We’re pulling back the curtain.</h1>
        <p id="curtain-description">
          Anshkosh is under construction. Take a sneak peek at the place where India’s next startups come into view.
        </p>
        <button ref={enterButtonRef} type="button" onClick={enterSite} className="curtain-entry-button">
          Enter the preview
        </button>
        <p className="curtain-note">Preview build · expect a few rough edges</p>
      </div>
    </div>
  );
}
