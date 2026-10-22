"use client";

import Link from "next/link";
import { buildPitch, FOUNDER_KEY, readFounder } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft, DraftNotice, FounderFields, secondaryButton } from "./ToolFields";
import ToolExport, { exportFilename } from "./ToolExport";

export default function PitchBuilder() {
  const { data, update, clear, storageError } = useBrowserDraft(FOUNDER_KEY, readFounder);
  const pitch = buildPitch(data);
  const results = pitch ? `ONE-LINE PITCH\n${pitch.oneLine}\n\nSHORT INTRODUCTION\n${pitch.introduction}\n\nLAUNCH ANNOUNCEMENT\n${pitch.announcement}` : "";
  return <>
    <DraftNotice error={storageError} />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7" aria-labelledby="pitch-details"><h2 id="pitch-details" className="mb-6 font-heading text-2xl font-bold">Explain the essentials</h2>
        <FounderFields include={["name", "audience", "problem", "outcome", "approach", "stage", "websiteUrl"]} />
        <div className="mt-6"><ClearDraft onClear={clear} label="Clear shared startup details" /></div>
      </section>
      <section aria-labelledby="pitch-results" className="min-w-0 rounded-2xl border border-coral-200 bg-coral-50 p-5 sm:p-7 lg:sticky lg:top-28">
        <p className="text-xs font-semibold uppercase tracking-wider text-coral-700">Your launch copy</p><h2 id="pitch-results" className="mt-2 font-heading text-3xl font-bold">A story you can reuse.</h2>
        {pitch ? <div className="mt-6 space-y-6">{[["One-line pitch", pitch.oneLine], ["Short introduction", pitch.introduction], ["Launch announcement", pitch.announcement]].map(([label, value]) => <div key={label}><h3 className="text-sm font-semibold text-coral-800">{label}</h3><p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-gray-900">{value}</p></div>)}</div> : <p className="mt-5 leading-relaxed text-gray-600">Add a startup name, audience, customer outcome and approach to see your copy here. Write the outcome as a phrase such as “organise lunch orders in minutes”.</p>}
        <ToolExport disabled={!pitch} text={results} filename={exportFilename(data.name, "pitch.txt")} />
        {pitch && <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => update({ tagline: pitch.oneLine.slice(0, 180) })} className={secondaryButton}>Use pitch as card tagline</button><Link href="/launch-support/launch-card" className={secondaryButton}>Make a launch card →</Link></div>}
        <p className="mt-5 text-xs leading-relaxed text-gray-600">Built from your own words. The one-line pitch is shortened to 180 characters; the introduction keeps your full details. Review the wording and claims before sharing.</p>
      </section>
    </div>
  </>;
}
