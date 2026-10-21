"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHydrated } from "@/components/useHydrated";
import { saveFounderMode } from "@/app/actions/profile.actions";
import { authClient } from "@/lib/auth-client";
import FounderModeToggle from "./FounderModeToggle";

export default function DashboardModeControl({ enabled }: { enabled: boolean }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [mode, setMode] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function change(value: boolean) {
    setBusy(true); setError("");
    try {
      const result = await saveFounderMode({ founderMode: value });
      if (result.error) { setError(result.error); return; }
      setMode(value);
      try { await authClient.getSession({ query: { disableCookieCache: true } }); } catch { /* Navigation refreshes the session. */ }
      router.refresh();
    } catch { setError("We could not confirm the change. Please try again."); }
    finally { setBusy(false); }
  }
  return <section id="founder-mode-control" aria-label="Dashboard mode" className="mb-8 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
    <fieldset disabled={!hydrated || busy} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <legend className="sr-only">Founder mode</legend>
      <div className="max-w-2xl">
        <p id="founder-mode-help" className="text-sm leading-relaxed text-gray-700">
          {mode ? "Your founder workspace is on. Turn it off to hide all your startups and linked journal stories publicly, including direct links."
            : "You’re browsing as a member or backer. Your startups and linked journal stories are hidden publicly. Turn founder mode on to restore their previous visibility."}
        </p>
        <p role="status" className="mt-2 text-xs text-gray-600">{busy ? "Saving founder mode…" : "Changes save automatically. Your saved work and review status stay intact."}</p>
      </div>
      <div className="shrink-0"><FounderModeToggle checked={mode} onChange={change} /></div>
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </section>;
}
