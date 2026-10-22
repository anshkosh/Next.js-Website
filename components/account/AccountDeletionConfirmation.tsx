"use client";

import { useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function AccountDeletionConfirmation() {
  useEffect(() => {
    // Database sessions were revoked by deletion. Clear this browser's stale
    // auth cookies on the public receipt, without refreshing protected settings.
    // An authoritative session read expires revoked cookies without signing out
    // a valid account if this informational URL is visited independently.
    void authClient.getSession({ query: { disableCookieCache: true } }).catch(() => {});
  }, []);

  return <section role="status" className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
    <h1 className="font-heading text-2xl font-bold text-gray-900">Your account has been deleted</h1>
    <p className="mt-3 text-sm leading-relaxed text-gray-600">Your account and owned content are removed, and all sessions are revoked. Upload removal is queued and retried if needed. Backups are not erased immediately; contact us about retained backup copies. Clear this site’s browser storage to remove device-only drafts.</p>
    <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-coral-700 underline underline-offset-4">Return to Anshkosh</Link>
  </section>;
}
