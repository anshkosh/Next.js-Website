"use client";

import { useState } from "react";
import { featureBucket, FOUNDER_KEY, readFounder, readMvp, type MvpFeature } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft, DraftNotice, Field, FounderFields, inputStyle, primaryButton } from "./ToolFields";
import ToolExport, { exportFilename } from "./ToolExport";

export default function MvpScopeCutter() {
  const { data, update, clear, storageError } = useBrowserDraft("anshkosh-mvp-v1", readMvp);
  const { data: founder } = useBrowserDraft(FOUNDER_KEY, readFounder);
  const [name, setName] = useState("");
  const buckets = ["Build first", "Handle manually", "Save for later"] as const;
  const exportText = `${founder.name || "Startup"} — MVP plan\n\nProblem: ${founder.problem || "Not recorded"}\nSuccess criterion: ${data.success || "Not recorded"}\n\n` +
    buckets.map(bucket => `${bucket}\n${data.features.filter(feature => featureBucket(feature) === bucket).map(feature => `• ${feature.name}`).join("\n") || "None yet"}`).join("\n\n");
  function change(id: string, patch: Partial<MvpFeature>) { update(previous => ({ ...previous, features: previous.features.map(row => row.id === id ? { ...row, ...patch } : row) })); }
  return <>
    <DraftNotice error={storageError} />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className="min-w-0 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7" aria-labelledby="mvp-plan">
        <h2 id="mvp-plan" className="font-heading text-2xl font-bold">What must your first version prove?</h2>
        <FounderFields include={["name", "problem"]} />
        <Field label="What result would make this test worthwhile?"><textarea className={inputStyle} rows={3} maxLength={2000} value={data.success} onChange={event => update({ success: event.target.value })} placeholder="e.g. Three teams complete a real lunch order without our help" /></Field>
        <form onSubmit={event => { event.preventDefault(); if (!name.trim() || data.features.length >= 40) return; update(previous => ({ ...previous, features: [...previous.features, { id: crypto.randomUUID(), name: name.trim(), promise: false, essential: false, manual: false }] })); setName(""); }}>
          <Field label="Add a planned feature"><input className={inputStyle} maxLength={160} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Shared lunch order list" /></Field>
          <button disabled={!name.trim() || data.features.length >= 40} className={`${primaryButton} mt-3`}>Add feature</button>
          <p className="mt-2 text-xs text-gray-600">{data.features.length}/40 features. Start with a short list.</p>
        </form>
        <div className="space-y-4">{data.features.map(feature => <fieldset key={feature.id} className="rounded-xl border border-gray-200 p-4">
          <legend className="max-w-full break-words px-1 text-sm font-semibold">{feature.name}</legend>
          <div className="space-y-3 text-sm">{[["promise", "Needed to test our main promise"], ["essential", "Needed to complete the core customer task"], ["manual", "We can handle this manually during the test"]].map(([id, label]) => <label key={id} className="flex items-start gap-3"><input type="checkbox" checked={feature[id as "promise" | "essential" | "manual"]} onChange={event => change(feature.id, { [id]: event.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 accent-coral-600" /><span>{label}</span></label>)}</div>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-coral-700">{featureBucket(feature)}</span><button type="button" aria-label={`Remove ${feature.name}`} onClick={() => update(previous => ({ ...previous, features: previous.features.filter(row => row.id !== feature.id) }))} className="text-xs text-gray-600 underline underline-offset-4">Remove</button></div>
        </fieldset>)}</div>
        <ClearDraft onClear={clear} />
      </section>
      <section aria-labelledby="mvp-results" className="min-w-0 rounded-2xl border border-coral-200 bg-coral-50 p-5 sm:p-7 lg:sticky lg:top-28">
        <h2 id="mvp-results" className="font-heading text-3xl font-bold">Less to build. More to learn.</h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">Your answers decide the groups. Keep features that test the promise or enable the core task; do suitable work manually for the pilot.</p>
        {buckets.map(bucket => <div key={bucket} className="mt-6"><h3 className="font-semibold text-coral-800">{bucket}</h3><ul className="mt-2 space-y-2 text-sm">{data.features.filter(feature => featureBucket(feature) === bucket).map(feature => <li key={feature.id} className="break-words rounded-lg bg-white p-3">{feature.name}</li>)}</ul>{!data.features.some(feature => featureBucket(feature) === bucket) && <p className="mt-2 text-sm text-gray-500">No features here yet.</p>}</div>)}
        <ToolExport disabled={!data.features.length} text={exportText} filename={exportFilename(founder.name, "mvp-plan.txt")} />
      </section>
    </div>
  </>;
}
