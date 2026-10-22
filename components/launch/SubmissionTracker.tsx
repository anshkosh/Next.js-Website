"use client";

import Link from "next/link";
import { useState } from "react";
import { readSubmissions, SUBMISSION_STATUSES, submissionsCsv, type Submission } from "@/lib/founder-toolkit";
import { safeLaunchUrl } from "@/lib/launch-resources";
import { useBrowserDraft } from "./useBrowserDraft";
import { ClearDraft, DraftNotice, Field, inputStyle, primaryButton } from "./ToolFields";
import { launchLinkStyle } from "./LaunchToolLayout";
import ToolExport from "./ToolExport";

function readTracker(raw: string) { return { rows: readSubmissions(raw) }; }
export default function SubmissionTracker() {
  const { data, update, clear, storageError } = useBrowserDraft("anshkosh-submissions-v1", readTracker);
  const [name, setName] = useState(""); const [url, setUrl] = useState(""); const [error, setError] = useState("");
  function change(id: string, patch: Partial<Submission>) { update(previous => ({ rows: previous.rows.map(row => row.id === id ? { ...row, ...patch } : row) })); }
  function externalUrl(value: string) { const safe = safeLaunchUrl(value); return /^https?:\/\//.test(safe) ? safe : ""; }
  return <>
    <DraftNotice error={storageError} />
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-coral-200 bg-coral-50 p-5"><p className="text-sm"><strong>{data.rows.filter(row => row.status === "Submitted").length}</strong> awaiting a response · <strong>{data.rows.filter(row => row.status === "Accepted").length}</strong> accepted</p><Link href="/launch-support/directories" className={launchLinkStyle}>Check directory requirements →</Link></div>
    <p className="mb-6 text-sm text-gray-600">Update statuses yourself after submitting through each directory’s official website. Follow-up dates are for your reference; this tool does not send reminders or submissions.</p>
    <div className="grid items-start gap-5 lg:grid-cols-2">{data.rows.map(row => <section key={row.id} aria-labelledby={`tracker-${row.id}`} className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id={`tracker-${row.id}`} className="break-words font-heading text-2xl font-bold">{row.name}</h2>{externalUrl(row.url) && <a href={externalUrl(row.url)} target="_blank" rel="noopener noreferrer" className={launchLinkStyle}>Open directory ↗</a>}</div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label={`${row.name} status`}><select value={row.status} onChange={event => change(row.id, { status: event.target.value as Submission["status"] })} className={inputStyle}>{SUBMISSION_STATUSES.map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label={`${row.name} follow-up date`}><input type="date" value={row.followUp} onChange={event => change(row.id, { followUp: event.target.value })} className={inputStyle} /></Field>
        <div className="sm:col-span-2"><Field label={`${row.name} published listing URL`}><input type="url" maxLength={2048} placeholder="https://…" value={row.listingUrl} onChange={event => change(row.id, { listingUrl: event.target.value })} className={inputStyle} /></Field>{row.listingUrl && !externalUrl(row.listingUrl) && <p className="mt-2 text-xs text-red-700">Use a complete http or https URL.</p>}{externalUrl(row.listingUrl) && <a href={externalUrl(row.listingUrl)} target="_blank" rel="noopener noreferrer" className={`${launchLinkStyle} mt-2 inline-block`}>View listing ↗</a>}</div>
        <div className="sm:col-span-2"><Field label={`${row.name} notes`}><textarea maxLength={2000} rows={3} value={row.notes} onChange={event => change(row.id, { notes: event.target.value })} className={inputStyle} placeholder="Submission details, response or next action" /></Field></div>
      </div><button type="button" aria-label={`Remove ${row.name} from tracker`} onClick={() => update(previous => ({ rows: previous.rows.filter(item => item.id !== row.id) }))} className="mt-4 text-xs text-gray-600 underline underline-offset-4">Remove directory</button>
    </section>)}</div>
    {!data.rows.length && <p className="rounded-xl border border-gray-200 p-6 text-sm text-gray-600">No directories tracked. Add one below, or reset the tracker to restore the starter catalogue.</p>}
    <section aria-labelledby="add-directory" className="mt-7 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"><h2 id="add-directory" className="font-heading text-2xl font-bold">Track another directory</h2><form className="mt-5 grid gap-5 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); const safe = externalUrl(url); if (!name.trim() || (url.trim() && !safe)) { setError("Enter a name and, optionally, a complete http or https URL."); return; } if (data.rows.some(row => row.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) { setError("That name is already in your tracker. Update the existing entry instead."); return; } if (data.rows.length >= 50) { setError("This draft supports up to 50 directories."); return; } update(previous => ({ rows: [...previous.rows, { id: crypto.randomUUID(), name: name.trim(), url: safe, status: "Not started", listingUrl: "", followUp: "", notes: "" }] })); setName(""); setUrl(""); setError(""); }}>
      <Field label="Directory name"><input required maxLength={120} value={name} onChange={event => setName(event.target.value)} className={inputStyle} /></Field><Field label="Official URL (optional)"><input type="url" maxLength={2048} value={url} onChange={event => setUrl(event.target.value)} className={inputStyle} placeholder="https://… (optional)" /></Field><div className="sm:col-span-2"><button disabled={data.rows.length >= 50} className={primaryButton}>Add directory</button><p className="mt-2 text-xs text-gray-600">{data.rows.length}/50 directories in this draft.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div>
    </form>
      <ToolExport text={submissionsCsv(data.rows)} disabled={!data.rows.length} filename="startup-directory-tracker.csv" mime="text/csv;charset=utf-8" downloadLabel="Download CSV" />
      <div className="mt-5"><ClearDraft onClear={clear} label="Reset tracker to starter directories" /></div>
    </section>
  </>;
}
