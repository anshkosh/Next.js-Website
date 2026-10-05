"use client";

import { useState } from "react";
import Link from "next/link";
import { exportLaunchKit, type LaunchKitData } from "@/lib/launch-resources";
import { launchLinkStyle } from "./LaunchToolLayout";
import { EMPTY_KIT, FOUNDER_KEY, KIT_KEY, readFounder, readKit } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft } from "./ToolFields";

const fields = [
  ["name", "Startup name", 120], ["tagline", "Short pitch / tagline", 180],
  ["description", "Longer description", 4000], ["websiteUrl", "Website URL", 2048],
  ["audience", "Target audience", 500], ["stage", "Current stage", 200],
  ["evidence", "Evidence and limitations", 2000], ["team", "Team introduction", 2000],
] as const;

export default function LaunchKit({ initialData = EMPTY_KIT, fromProfile = false }: { initialData?: LaunchKitData; fromProfile?: boolean }) {
  const [profileKit, setProfileKit] = useState(initialData);
  const draft = useBrowserDraft(KIT_KEY, raw => raw ? readKit(raw) : initialData);
  const shared = useBrowserDraft(FOUNDER_KEY, readFounder);
  const kit = fromProfile ? profileKit : { ...draft.data, ...(shared.hasDraft ? {
    name: shared.data.name, tagline: shared.data.tagline, audience: shared.data.audience,
    websiteUrl: shared.data.websiteUrl, stage: shared.data.stage,
  } : {}) };
  const [status, setStatus] = useState("");
  function updateField(id: typeof fields[number][0], value: string) {
    if (fromProfile) { setProfileKit(previous => ({ ...previous, [id]: value })); return; }
    const next = { ...kit, [id]: value };
    draft.update(next);
    if (["name", "tagline", "audience", "websiteUrl", "stage"].includes(id)) {
      shared.update({ name: next.name, tagline: next.tagline, audience: next.audience, websiteUrl: next.websiteUrl, stage: next.stage });
    }
  }
  function reuseInTools() {
    const kitSaved = draft.update(kit);
    const detailsSaved = shared.update({ name: kit.name, tagline: kit.tagline, audience: kit.audience, websiteUrl: kit.websiteUrl, stage: kit.stage });
    setStatus(kitSaved && detailsSaved ? "Details saved in this browser for your free founder tools. Your startup profile was not changed." : "Details are available for this visit. Download your kit before leaving.");
  }
  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setStatus(`${label} copied.`); }
    catch { setStatus("Clipboard access failed. Select the text in the field and copy it manually."); }
  }
  function download() {
    const blob = new Blob([exportLaunchKit(kit)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `${kit.name.replace(/[^a-z0-9-]/gi, "-").slice(0, 60) || "startup"}-launch-kit.txt`;
    link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Launch kit downloaded as text. Images are included as links, not bundled files.");
  }
  return (
    <>
      <aside className="mb-7 rounded-xl border border-coral-200 bg-coral-50 p-5 text-sm leading-relaxed text-gray-700">
        {fromProfile ? "Prefilled from your saved startup profile. Pending revisions are not included." : "Your kit is saved in this browser on this device. Shared startup details carry across your free founder tools."}
        <p className="mt-2">{fromProfile ? "Edits here are temporary and do not change your startup profile. Copy, download, or choose to reuse these details in your free tools before leaving." : "No account needed. To start from a saved profile, open its launch kit from your dashboard and choose to reuse its details."}</p>
        {fromProfile && <p className="mt-2">Reusing details replaces the shared startup details in this browser. Other tool drafts remain; download and clear them before switching startups.</p>}
        <p className="mt-2">No automatic submissions, invented traction or AI-generated claims.</p>
      </aside>
      {(draft.storageError || shared.storageError) && <p role="alert" className="mb-5 text-sm text-red-800">{draft.storageError || shared.storageError}</p>}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => copy(exportLaunchKit(kit), "Full launch kit")} className="rounded-lg bg-coral-600 px-4 py-3 text-sm font-semibold text-white hover:bg-coral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">Copy full kit</button>
        <button type="button" onClick={download} className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold hover:border-coral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500">Download text kit</button>
        {!fromProfile && <Link href="/dashboard" className={launchLinkStyle}>Use an existing startup →</Link>}
        {fromProfile && <button type="button" onClick={reuseInTools} className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold hover:border-coral-400">Use these details in free tools</button>}
      </div>
      <p role="status" aria-live="polite" className="mb-5 min-h-6 text-sm text-gray-700">{status}</p>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map(([id, label, limit]) => (
          <section key={id} className={`rounded-xl border border-gray-200 bg-white p-5 ${id === "description" ? "md:col-span-2" : ""}`}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><label htmlFor={`kit-${id}`} className="text-sm font-semibold">{label}</label><button type="button" disabled={!kit[id].trim()} onClick={() => copy(kit[id], label)} className={`${launchLinkStyle} disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline`} aria-label={`Copy ${label.toLowerCase()}`}>Copy</button></div>
            <textarea id={`kit-${id}`} value={kit[id]} maxLength={limit} rows={["description", "evidence", "team"].includes(id) ? 5 : 2} onChange={event => updateField(id, event.target.value)} placeholder={`Add your ${label.toLowerCase()}`} className="w-full resize-y rounded-lg border border-gray-300 p-3 text-sm leading-relaxed" />
            <p className="mt-2 text-right text-xs text-gray-500">{kit[id].length}/{limit}</p>
          </section>
        ))}
      </div>
      <section aria-labelledby="kit-assets" className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 id="kit-assets" className="font-heading text-2xl font-bold">Your logo & images</h2>
        <p className="mt-2 text-sm text-gray-600">Assets remain in your startup profile. This kit shares links only; it does not upload, crop or download images in bulk. Check sharing rights before reuse.</p>
        {kit.assets.length ? <ul className="mt-4 space-y-3">{kit.assets.map(asset => <li key={`${asset.label}-${asset.url}`} className="flex flex-wrap items-center gap-4"><a href={asset.url} target="_blank" rel="noopener noreferrer" className={launchLinkStyle}>Open {asset.label.toLowerCase()}</a><button type="button" onClick={() => copy(asset.url, `${asset.label} link`)} className={launchLinkStyle}>Copy {asset.label.toLowerCase()} link</button></li>)}</ul> : <p className="mt-4 text-sm text-gray-600">No profile images loaded. Open a saved startup&apos;s kit from the dashboard, or add images in its profile editor.</p>}
      </section>
      {!fromProfile && <div className="mt-7"><ClearDraft onClear={() => { draft.clear(); shared.clear(); }} label="Clear kit and shared startup details" /></div>}
    </>
  );
}
