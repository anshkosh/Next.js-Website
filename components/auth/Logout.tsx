"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { clearToolDrafts } from "@/lib/browser-tool-drafts";
import { navigateAfterSignOut } from "@/lib/browser-navigation";

export default function Logout() {
  const started = useRef(false);
  const [error, setError] = useState("");
  const signOut = useCallback(async () => {
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      const cleared = clearToolDrafts();
      if (!cleared) { setError("You are signed out, but this browser blocked draft cleanup. Clear this site's browser data before sharing the device."); return; }
      // A full navigation discards every cached signed-in page and local form.
      navigateAfterSignOut();
    } catch { setError("Could not sign you out. Please try again."); }
  }, []);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void signOut();
  }, [signOut]);
  return <main className="mx-auto max-w-lg px-4 py-20 text-center">
    <h1 className="text-2xl font-bold">Sign out</h1>
    {error ? <><p role="alert" className="my-4">{error}</p><button className="rounded-lg bg-gray-900 px-5 py-3 text-white" onClick={() => void signOut()}>Try again</button></> : <p role="status" className="my-4">Signing you out…</p>}
  </main>;
}
