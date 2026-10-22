"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/components/useHydrated";
import { saveFounderMode } from "@/app/actions/profile.actions";
import { authClient } from "@/lib/auth-client";
import FounderModeToggle from "./FounderModeToggle";

// Switching founder mode re-renders the dashboard in a different layout, so the
// undo offer lives in session storage for two minutes instead of component state.
const UNDO_KEY = "anshkosh-founder-mode-undo";
const UNDO_MS = 2 * 60 * 1000;
const subscribeToNothing = () => () => {};

function readUndo() {
  try {
    const stored = window.sessionStorage.getItem(UNDO_KEY);
    if (!stored) return "";
    const { at } = JSON.parse(stored) as { value: boolean; at: number };
    if (Date.now() - at < UNDO_MS) return stored;
    window.sessionStorage.removeItem(UNDO_KEY);
  } catch { /* Storage may be unavailable; the undo offer is optional. */ }
  return "";
}

function writeUndo(value: boolean | null) {
  try {
    if (value === null) window.sessionStorage.removeItem(UNDO_KEY);
    else window.sessionStorage.setItem(UNDO_KEY, JSON.stringify({ value, at: Date.now() }));
  } catch { /* Storage may be unavailable; the undo offer is optional. */ }
}

export default function DashboardModeControl({ enabled, compact = false }: { enabled: boolean; compact?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [mode, setMode] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [undoDismissed, setUndoDismissed] = useState(false);
  const storedUndo = useSyncExternalStore(subscribeToNothing, readUndo, () => "");
  let undoFor: boolean | null = null;
  try { if (storedUndo && !undoDismissed) undoFor = (JSON.parse(storedUndo) as { value: boolean }).value; } catch { /* Ignore a malformed entry. */ }
  const showUndo = undoFor === mode;

  async function change(value: boolean, offerUndo = true) {
    setBusy(true); setError("");
    try {
      const result = await saveFounderMode({ founderMode: value });
      if (result.error) { setError(result.error); return; }
      setMode(value);
      writeUndo(offerUndo ? value : null);
      setUndoDismissed(!offerUndo);
      try { await authClient.getSession({ query: { disableCookieCache: true } }); } catch { /* Navigation refreshes the session. */ }
      router.refresh();
    } catch { setError("We could not confirm the change. Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="founder-mode-control" aria-label="Dashboard mode" className={compact ? "sm:max-w-72 sm:shrink-0" : "mb-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6"}>
    <fieldset disabled={!hydrated || busy} className={compact ? "flex flex-col gap-2 sm:items-end" : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"}>
      <legend className="sr-only">Founder mode</legend>
      <div className={compact ? "sr-only" : "max-w-2xl"}>
        <p id="founder-mode-help" className="text-sm leading-relaxed text-gray-700">
          {mode ? "Your founder workspace is on. Turn it off to hide all your startups and linked journal stories publicly, including direct links."
            : "You’re browsing as a member or backer. Your startups and linked journal stories are hidden publicly. Turn founder mode on to restore their previous visibility."}
        </p>
        <p role="status" className="mt-2 text-xs leading-relaxed text-gray-600">
          {busy ? "Saving founder mode…"
            : showUndo ? <span className="text-sm text-gray-900">{mode ? "Founder mode is on. Your startups are visible again." : "Founder mode is off. Your startups and linked journal stories are now hidden publicly."}</span>
            : "Changes save automatically. Your saved work and review status stay intact."}
        </p>
        {!compact && showUndo && !busy && (
          <button type="button" onClick={() => change(!mode, false)} className="mt-2 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-coral-700 underline underline-offset-4 hover:bg-coral-50">
            Undo
          </button>
        )}
      </div>
      <div className={compact ? "order-first shrink-0" : "shrink-0"}><FounderModeToggle checked={mode} onChange={change} /></div>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
