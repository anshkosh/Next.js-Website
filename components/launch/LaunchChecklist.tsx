"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LAUNCH_CHECKLIST, readChecklist } from "@/lib/launch-resources";
import { launchLinkStyle } from "./LaunchToolLayout";

const key = "anshkosh-launch-checklist-v1";
const eventName = "anshkosh-launch-checklist-changed";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(eventName, callback); };
}
function snapshot() { try { return window.localStorage.getItem(key) ?? ""; } catch { return ""; } }

export default function LaunchChecklist() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => "");
  const [error, setError] = useState("");
  const [fallback, setFallback] = useState<string[] | null>(null);
  const checked = fallback ?? readChecklist(raw);
  const change = useCallback((id: string, done: boolean) => {
    const next = (fallback ?? readChecklist(snapshot())).filter(value => value !== id);
    if (done) next.push(id);
    try { window.localStorage.setItem(key, JSON.stringify(next)); window.dispatchEvent(new Event(eventName)); setFallback(null); setError(""); }
    catch { setFallback(next); setError("Your browser cannot save progress. Your checks work for this visit but will be lost on reload."); }
  }, [fallback]);
  return (
    <>
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
        <p role="status" className="font-semibold">{checked.length} of {LAUNCH_CHECKLIST.length} tasks complete</p>
        <progress aria-label="Launch preparation progress" value={checked.length} max={LAUNCH_CHECKLIST.length} className="mt-3 h-2 w-full accent-coral-600" />
        <p className="mt-3 text-sm text-gray-600">Progress is saved only in this browser, not in your account or per startup. Checking a task does not submit, approve or publish anything.</p>
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[...new Set(LAUNCH_CHECKLIST.map(item => item.group))].map(group => (
          <section key={group} aria-labelledby={`group-${group.replaceAll(" ", "-")}`} className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 id={`group-${group.replaceAll(" ", "-")}`} className="mb-5 font-heading text-2xl font-bold">{group}</h2>
            <ul className="space-y-5">{LAUNCH_CHECKLIST.filter(item => item.group === group).map(item => (
              <li key={item.id}><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={checked.includes(item.id)} onChange={event => change(item.id, event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-coral-600" /><span><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-sm leading-relaxed text-gray-600">{item.detail}</span></span></label></li>
            ))}</ul>
          </section>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-6"><Link href="/launch-support/kit" className={launchLinkStyle}>Prepare your launch kit →</Link><Link href="/launch-support/directories" className={launchLinkStyle}>Find relevant directories →</Link></div>
    </>
  );
}
