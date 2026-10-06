"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export function readDraft<T>(raw: string | null, now = Date.now()): T | null {
  if (!raw || raw.length > 1_000_000) return null;
  try {
    const entry = JSON.parse(raw);
    return entry.version === 1 && typeof entry.savedAt === "number" && now - entry.savedAt <= MAX_AGE && now >= entry.savedAt
      && entry.value && typeof entry.value === "object" && !Array.isArray(entry.value) ? entry.value as T : null;
  } catch { return null; }
}

// Device-only recovery: never submits a profile or sends unreviewed content live.
export function useDraftRecovery<T extends object>(key: string | null, value: T, restore: (value: T) => void, active = true) {
  const serialized = JSON.stringify(value);
  const latest = useRef({ value, serialized, restore });
  useLayoutEffect(() => { latest.current = { value, serialized, restore }; });
  const [baseline, setBaseline] = useState(serialized);
  const ready = useRef(false);
  const [recovery, setRecovery] = useState<T | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [storageError, setStorageError] = useState(false);
  const dirty = active && serialized !== baseline;

  useEffect(() => {
    ready.current = false;
    let alive = true;
    const initial = latest.current.serialized;
    queueMicrotask(() => {
      if (!alive) return;
      setBaseline(initial); setSavedAt(null); setRecovery(null); setStorageError(false);
      if (key) {
        try {
          const raw = window.localStorage.getItem(key), saved = readDraft<T>(raw);
          setRecovery(saved);
          if (raw && !saved) window.localStorage.removeItem(key);
        }
        catch { setStorageError(true); }
      }
      ready.current = true;
    });
    return () => { alive = false; ready.current = false; };
  }, [key]);

  useEffect(() => {
    if (!key || !active || !ready.current || recovery || !dirty) return;
    function save() {
      try {
        const now = Date.now();
        window.localStorage.setItem(key!, JSON.stringify({ version: 1, savedAt: now, value: latest.current.value }));
        setSavedAt(now); setStorageError(false);
      } catch { setStorageError(true); }
    }
    const timer = window.setTimeout(save, 350);
    window.addEventListener("pagehide", save);
    return () => { clearTimeout(timer); window.removeEventListener("pagehide", save); };
  }, [key, serialized, active, recovery, dirty]);

  useEffect(() => {
    if (!dirty) return;
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      const target = new URL(anchor.href, window.location.href);
      if (target.pathname === window.location.pathname && target.search === window.location.search) return;
      if (!window.confirm("Your changes have not been submitted. Leave this page? A recovery copy is saved on this device when available.")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", navigate, true); };
  }, [dirty]);

  function clear() {
    if (key) { try { window.localStorage.removeItem(key); } catch { /* Warning is already shown if unavailable. */ } }
    setRecovery(null); setSavedAt(null);
  }
  function markSaved() { setBaseline(latest.current.serialized); clear(); }
  return {
    recovery, dirty, savedAt, storageError, markSaved,
    restoreDraft: () => { if (recovery) latest.current.restore(recovery); setRecovery(null); },
    discardDraft: clear,
  };
}
