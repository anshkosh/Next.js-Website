"use client";

import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from "react";
import { useHydrated } from "@/components/useHydrated";
import { authClient } from "@/lib/auth-client";
import { FOUNDER_KEY, readFounder, type FounderDetails } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";

export const inputStyle = "mt-2 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-normal leading-relaxed text-gray-900 placeholder:text-gray-500";
export const primaryButton = "inline-flex items-center justify-center gap-2 rounded-lg bg-coral-600 px-4 py-3 text-sm font-semibold text-white hover:bg-coral-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500";
export const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:border-coral-400 disabled:cursor-not-allowed disabled:text-gray-400";

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const hintId = useId();
  const { isPending } = authClient.useSession();
  const hydrated = useHydrated();
  const field = isValidElement(children) ? cloneElement(children as ReactElement<{ "aria-describedby"?: string; disabled?: boolean }>, { ...(hint ? { "aria-describedby": hintId } : {}), ...(!hydrated || isPending ? { disabled: true } : {}) }) : children;
  return <div className="min-w-0"><label className="block text-sm font-semibold text-gray-900">{label}{field}</label>{hint && <p id={hintId} className="mt-2 text-xs leading-relaxed text-gray-600">{hint}</p>}</div>;
}
export function DraftNotice({ error }: { error?: string }) {
  return error ? <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p> :
    <p className="mb-6 text-sm leading-relaxed text-gray-600">Drafts stay on this device, separately for each signed-in account or signed-out visitor. They do not sync between devices or change your public profile. Signing out removes free-tool drafts from this browser. Shared startup details carry across these tools; download and clear drafts before switching startups.</p>;
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

export function ClearDraft({ onClear, label = "Clear this draft" }: { onClear: () => boolean | void; label?: string }) {
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  return <div>
    <button type="button" aria-expanded={confirming} onClick={() => setConfirming(true)} className="text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-coral-700">{label}</button>
    {confirming && <div role="group" aria-label="Confirm clearing draft" className="mt-3 rounded-lg border border-gray-200 p-4 text-sm">
      <p>Remove this saved draft from this browser? This cannot be undone.</p>
      <div className="mt-3 flex flex-wrap gap-3"><button type="button" className={primaryButton} onClick={() => { const result = onClear(); setStatus(result === false ? "This browser could not remove the saved draft. Clear this site's browser storage before sharing the device." : "Draft cleared."); setConfirming(false); }}>Yes, clear draft</button><button type="button" className={secondaryButton} onClick={() => setConfirming(false)}>Keep draft</button></div>
    </div>}
    {status && <p role="status" className="mt-2 text-sm text-gray-700">{status}</p>}
  </div>;
}
