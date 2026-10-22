"use client";

import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/components/useHydrated";
import { TOOL_DRAFT_CHANGED as changed, temporaryToolDrafts as temporary, toolDraftErrors as errors } from "@/lib/browser-tool-drafts";
import { FOUNDER_KEY, KIT_KEY, parseRecord } from "@/lib/founder-toolkit";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changed, callback); };
}
function snapshot(key: string) { if (temporary.has(key)) return temporary.get(key)!; try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; } }

export function useBrowserDraft<T>(baseKey: string, read: (raw: string) => T) {
  const { data: session, isPending } = authClient.useSession();
  const hydrated = useHydrated();
  // Never migrate legacy global data: its account owner is unknown.
  const key = !hydrated || isPending ? null : `${baseKey}:${session?.user.id ? `user:${session.user.id}` : "guest"}`;
  const raw = useSyncExternalStore(subscribe, () => key ? snapshot(key) : "", () => "");
  const storageError = useSyncExternalStore(subscribe, () => key ? errors.get(key) ?? "" : "", () => "");
  const data = read(raw);
  function update(change: Partial<T> | ((previous: T) => T)) {
    if (!key) return false;
    const previous = read(snapshot(key));
    const next = typeof change === "function" ? change(previous) : { ...previous, ...change };
    let saved = true;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
      temporary.delete(key); errors.delete(key);
    } catch {
      saved = false;
      temporary.set(key, JSON.stringify(next)); errors.set(key, "This browser could not save your draft. You can keep working, but download your results before leaving.");
    }
    window.dispatchEvent(new Event(changed));
    return saved;
  }
  function clear() {
    if (!key) return false;
    let sharedCleared = true;
    if (baseKey === FOUNDER_KEY) {
      const kitKey = key.replace(FOUNDER_KEY, KIT_KEY);
      const kit = snapshot(kitKey);
      if (kit) {
        const cleared = JSON.stringify({ ...parseRecord(kit), name: "", tagline: "", audience: "", websiteUrl: "", stage: "" });
        try { window.localStorage.setItem(kitKey, cleared); temporary.delete(kitKey); errors.delete(kitKey); }
        catch { sharedCleared = false; temporary.set(kitKey, cleared); errors.set(kitKey, "This browser could not clear its saved shared details. Clear site storage before sharing the device."); }
      }
    }
    try { window.localStorage.removeItem(key); temporary.delete(key); errors.delete(key); }
    catch { temporary.set(key, ""); errors.set(key, "This browser could not clear its saved draft. Changes apply only to this visit."); }
    window.dispatchEvent(new Event(changed));
    return sharedCleared && !errors.has(key);
  }
  return { data, update, clear, storageError, ready: key !== null, hasDraft: raw !== "" };
}
