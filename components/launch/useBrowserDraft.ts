"use client";

import { useSyncExternalStore } from "react";

const changed = "anshkosh-founder-draft-changed";
const temporary = new Map<string, string>();
const errors = new Map<string, string>();
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changed, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(changed, callback); };
}
function snapshot(key: string) { if (temporary.has(key)) return temporary.get(key)!; try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; } }

export function useBrowserDraft<T>(key: string, read: (raw: string) => T) {
  const raw = useSyncExternalStore(subscribe, () => snapshot(key), () => "");
  const storageError = useSyncExternalStore(subscribe, () => errors.get(key) ?? "", () => "");
  const data = read(raw);
  function update(change: Partial<T> | ((previous: T) => T)) {
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
    try { window.localStorage.removeItem(key); temporary.delete(key); errors.delete(key); }
    catch { temporary.set(key, ""); errors.set(key, "This browser could not clear its saved draft. Changes apply only to this visit."); }
    window.dispatchEvent(new Event(changed));
  }
  return { data, update, clear, storageError, hasDraft: raw !== "" };
}
