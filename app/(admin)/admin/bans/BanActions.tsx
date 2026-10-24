"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { revokeCommenterBlock, revokeModerationAccountBan } from "@/app/actions/moderation-controls.actions";

export function BanAction({ id, kind }: { id: string; kind: "email" | "account" }) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  function revoke() {
    const prompt = kind === "account" ? "Remove this account ban? The person can sign in again and must start a new session." : "Remove this email block so it can submit comments again?";
    if (!window.confirm(prompt)) return;
    startTransition(async () => {
      const result = kind === "account" ? await revokeModerationAccountBan(id) : await revokeCommenterBlock(id);
      setMessage(result.error ?? "Restriction removed.");
      if (!result.error) router.refresh();
    });
  }
  return <div className="space-y-1"><button type="button" disabled={busy} onClick={revoke} className="min-h-10 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50">{busy ? "Saving…" : kind === "account" ? "Unban account" : "Unblock email"}</button><p role="status" className="text-xs text-gray-600">{message}</p></div>;
}
