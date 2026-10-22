"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/components/useHydrated";

export default function ResendVerification() {
  const ready = useHydrated();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  return <form method="post" className="mt-6 space-y-5" onSubmit={async event => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setBusy(true); setError("");
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: "/dashboard" });
      if (result.error) { setError("We could not send a verification link. Wait a minute and try again."); return; }
      setSent(true);
    } catch { setError("We could not confirm the request. Wait a minute and try again."); }
    finally { setBusy(false); }
  }}>
    <label className="block text-sm font-medium">Email address<input type="email" name="email" required autoComplete="email" maxLength={254} className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3" /></label>
    <button disabled={!ready || busy || sent} className="min-h-11 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Requesting link…" : "Resend verification email"}</button>
    {sent && <p role="status" className="text-sm text-gray-700">If this address has an account that still needs verification, a link will arrive shortly. Check your spam folder too.</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </form>;
}
