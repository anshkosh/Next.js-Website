"use client";

import type { ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/components/useHydrated";

export default function ToolWorkspace({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  const ready = hydrated && !isPending;
  // Mount each account's local component state afresh, including unsaved input
  // fields and uploaded logos. Never show the previous account while resolving.
  return <>
    {!ready && <p role="status" className="mb-5 text-sm text-gray-600">Loading your account and saved drafts…</p>}
    <fieldset key={ready ? session?.user.id ?? "guest" : "loading"} disabled={!ready} aria-busy={!ready} className="min-w-0">
      <legend className="sr-only">Founder tool workspace</legend>
      {children}
    </fieldset>
  </>;
}
