"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/components/useHydrated";
import { saveFounderMode } from "@/app/actions/profile.actions";
import { authClient } from "@/lib/auth-client";
import FounderModeToggle from "./FounderModeToggle";

// Survive the server-rendered dashboard switching layout, but never a document
// reload, sign-out or navigation away. No undo offer is saved on the device.
let feedback: { mode: boolean; at: number; undo: boolean } | null = null;
const listeners = new Set<() => void>();
function publish(value: typeof feedback) { feedback = value; listeners.forEach(listener => listener()); }
export function clearFounderModeFeedback() { publish(null); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const readFeedback = () => feedback;
const serverFeedback = () => null;

export default function DashboardModeControl({ enabled, compact = false }: { enabled: boolean; compact?: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [mode, setMode] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const result = useSyncExternalStore(subscribe, readFeedback, serverFeedback);
  const savedAt = result?.mode === mode ? result.at : null;
  const showUndo = savedAt !== null && result?.undo;
  useEffect(() => {
    if (!savedAt) return;
    const timer = window.setTimeout(() => publish(null), Math.max(0, savedAt + 30_000 - Date.now()));
    return () => clearTimeout(timer);
  }, [savedAt]);
  useEffect(() => {
    const clear = () => publish(null);
    window.addEventListener("pagehide", clear);
    return () => { window.removeEventListener("pagehide", clear); if (window.location.pathname !== "/dashboard") clear(); };
  }, []);

  async function change(value: boolean, offerUndo = true) {
    setBusy(true); setError("");
    try {
      const result = await saveFounderMode({ founderMode: value });
      if (result.error) { setError(result.error); return; }
      setMode(value);
      publish({ mode: value, at: Date.now(), undo: offerUndo });
      try { await authClient.getSession({ query: { disableCookieCache: true } }); } catch { /* Navigation refreshes the session. */ }
      router.refresh();
    } catch { setError("We could not confirm the change. Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="founder-mode-control" aria-label="Dashboard mode" className={compact ? "sm:max-w-72 sm:shrink-0" : "mb-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6"}>
    <fieldset disabled={!hydrated || busy} className={compact ? "flex flex-col gap-2 sm:items-end" : "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"}>
      <legend className="sr-only">Founder mode</legend>
      <div className={compact ? "max-w-72 text-left" : "max-w-2xl"}>
        <p id="founder-mode-help" className={compact ? "sr-only" : "text-sm leading-relaxed text-gray-700"}>
          {mode ? "Your founder workspace is on. Turn it off to hide all your startups and linked journal stories publicly, including direct links."
            : "You’re browsing as a member or backer. Your startups and linked journal stories are hidden publicly. Turn founder mode on to restore their previous visibility."}
        </p>
        <p role="status" className="mt-2 text-xs leading-relaxed text-gray-600">
          {busy ? "Saving founder mode…"
            : showUndo ? <span className="text-sm text-gray-900">{mode ? "Founder mode is on. Your startups are visible again." : "Founder mode is off. Your startups and linked journal stories are now hidden publicly."}</span>
            : "Changes save automatically. Your saved work and review status stay intact."}
        </p>
        {savedAt && <p className="mt-1 text-xs text-gray-700">Saved at {new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(savedAt)} IST</p>}
        {showUndo && !busy && (
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
