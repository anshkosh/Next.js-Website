"use client";

import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";

const changed = "anshkosh-founder-draft-changed";
const temporary = new Map<string, string>();
const errors = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changed, callback); };
}
function snapshot(key: string) { if (temporary.has(key)) return temporary.get(key)!; try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; } }

export function useBrowserDraft<T>(baseKey: string, read: (raw: string) => T) {
  const { data: session, isPending } = authClient.useSession();
  // Never migrate legacy global data: its account owner is unknown.
  const key = isPending ? null : `${baseKey}:${session?.user.id ? `user:${session.user.id}` : "guest"}`;
  const raw = useSyncExternalStore(subscribe, () => key ? snapshot(key) : "", () => "");
  const storageError = useSyncExternalStore(subscribe, () => key ? errors.get(key) ?? "" : "Loading your account…", () => "");
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
    if (!key) return;
    try { window.localStorage.removeItem(key); temporary.delete(key); errors.delete(key); }
    catch { temporary.set(key, ""); errors.set(key, "This browser could not clear its saved draft. Changes apply only to this visit."); }
    window.dispatchEvent(new Event(changed));
  }
  return { data, update, clear, storageError, hasDraft: raw !== "" };
}
