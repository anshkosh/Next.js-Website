"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { FOUNDER_KEY, readFounder, type FounderDetails } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";

export const inputStyle = "mt-2 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed text-gray-900 placeholder:text-gray-500";
export const primaryButton = "inline-flex items-center justify-center gap-2 rounded-lg bg-coral-600 px-4 py-3 text-sm font-semibold text-white hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500";
export const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-coral-400 disabled:cursor-not-allowed disabled:text-gray-400";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const hintId = useId();
  const field = hint && isValidElement(children) ? cloneElement(children as ReactElement<{ "aria-describedby"?: string }>, { "aria-describedby": hintId }) : children;
  return <div className="min-w-0"><label className="block text-sm font-semibold text-gray-900">{label}{field}</label>{hint && <p id={hintId} className="mt-2 text-xs leading-relaxed text-gray-600">{hint}</p>}</div>;
}
export function DraftNotice({ error }: { error?: string }) {
  return error ? <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> :
    <p className="mb-6 text-sm leading-relaxed text-gray-600">No account needed. One startup workspace in this browser on this device. Details are shared across these tools. Download and clear your drafts before switching startups.</p>;
}
const fields: Record<keyof FounderDetails, { label: string; placeholder: string; limit: number }> = {
  name: { label: "Startup name", placeholder: "e.g. DabbaLoop", limit: 120 },
  tagline: { label: "Tagline", placeholder: "e.g. Lunch planning made simple", limit: 180 },
  audience: { label: "Who is it for?", placeholder: "e.g. Office teams arranging daily lunches", limit: 500 },
  problem: { label: "What problem do they face?", placeholder: "e.g. Coordinating lunch orders takes too much time", limit: 1000 },
  approach: { label: "How does your product help?", placeholder: "e.g. bringing everyone’s orders into one shared list", limit: 1000 },
  outcome: { label: "What can customers achieve?", placeholder: "e.g. organise lunch orders in minutes", limit: 1000 },
  websiteUrl: { label: "Website or startup profile URL", placeholder: "https://…", limit: 2048 },
  stage: { label: "Current stage (optional)", placeholder: "e.g. Testing a prototype with two teams", limit: 200 },
};
export function FounderFields({ include }: { include: (keyof FounderDetails)[] }) {
  const { data, update, storageError } = useBrowserDraft(FOUNDER_KEY, readFounder);
  return <div className="space-y-5">{include.map(id => <Field key={id} label={fields[id].label}>
    <textarea rows={["problem", "approach", "outcome"].includes(id) ? 3 : 2} maxLength={fields[id].limit} value={data[id]} onChange={event => update({ [id]: event.target.value })} placeholder={fields[id].placeholder} className={inputStyle} />
  </Field>)}{storageError && <p role="alert" className="text-sm text-red-800">{storageError}</p>}</div>;
}

export function ClearDraft({ onClear, label = "Clear this draft" }: { onClear: () => void; label?: string }) {
  return <button type="button" onClick={() => { if (window.confirm("Clear this draft from this browser? This cannot be undone.")) onClear(); }} className="text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-coral-700">{label}</button>;
}
