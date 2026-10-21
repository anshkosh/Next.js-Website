"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Globe, LockKeyhole } from "lucide-react";
import { saveFounderEntry, deleteFounderEntry } from "@/app/actions/founder-journal.actions";
import { JOURNAL_PROMPTS, founderEntrySchema, founderEntryError } from "@/lib/founder-journal";
import { journalDeltaSchema, journalPlainText, plainTextDelta } from "@/lib/journal-rich-text";
import JournalRichContent from "@/components/journal/JournalRichContent";
import { founderEntryPath } from "@/lib/founder-journal-seo";

const QuillEditor = dynamic(() => import("@/components/admin/QuillEditor"), { ssr: false, loading: () => <p role="status" className="py-8 text-sm text-gray-500">Loading editor…</p> });

type Prompt = keyof typeof JOURNAL_PROMPTS;
type Draft = { title: string; body: string; contentJson?: unknown; scheduledFor?: string; prompt: Prompt; visibility: "PRIVATE" | "PUBLIC"; startupId: string; milestone: string; milestoneDone: boolean };
type Entry = Omit<Draft, "prompt" | "startupId" | "milestone"> & {
  id: string; prompt: string; startupId: string | null; milestone: string | null; updatedAt: string;
  startup: { name: string; slug: string; status: string } | null;
  reviewStatus?: string; reviewerNotes?: string | null; liveVersion?: boolean;
  publishedEntryPath?: string; publishedStartupSlug?: string;
};
type Startup = { id: string; name: string; status: string };
const empty: Draft = { title: "", body: "", contentJson: null, scheduledFor: "", prompt: "FREE_WRITE", visibility: "PRIVATE", startupId: "", milestone: "", milestoneDone: false };
const field = "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600";
const secondary = "min-h-11 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50";

export default function FounderJournal({ entries, startups }: { entries: Entry[]; startups: Startup[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>({ ...empty });
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const selected = startups.find(startup => startup.id === draft.startupId);
  const canPublish = selected?.status === "LIVE";

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(update: Partial<Draft>) {
    setDraft(previous => ({ ...previous, ...update }));
    setDirty(true); setError(""); setStatus(""); setPreview(false);
  }
  function reset() {
    setDraft({ ...empty }); setEditing(null); setDirty(false); setPreview(false); setError("");
  }
  function edit(entry: Entry) {
    if (dirty && !window.confirm("Discard your unsaved changes and open this entry?")) return;
    setDraft({ title: entry.title, body: entry.body, contentJson: entry.contentJson ?? plainTextDelta(entry.body), prompt: entry.prompt in JOURNAL_PROMPTS ? entry.prompt as Prompt : "FREE_WRITE", visibility: entry.visibility, startupId: entry.startupId ?? "", milestone: entry.milestone ?? "", milestoneDone: entry.milestoneDone });
    setDraft(previous => ({ ...previous, scheduledFor: entry.scheduledFor ?? "" }));
    setEditing(entry.id); setDirty(false); setPreview(false); setError(""); setStatus("");
    document.getElementById("entry-title")?.focus();
  }
  function save() {
    if (uploading) return;
    const parsed = founderEntrySchema.safeParse({ ...draft, startupId: draft.startupId || null });
    if (!parsed.success) { setError(founderEntryError(parsed.error)); return; }
    startTransition(async () => {
      try {
        const result = await saveFounderEntry(editing, parsed.data);
        if (result.error) { setError(result.error); return; }
        const wasPublic = draft.visibility === "PUBLIC";
        reset(); setStatus(wasPublic ? "Submitted for review. Your approved version, if any, stays live until the replacement is approved and published." : "Private entry saved. Only you can view it. Any pending review or schedule has been cancelled.");
        router.refresh();
      } catch { setError("Could not save your entry. Your text is still here; please try again."); }
    });
  }
  function remove(id: string) {
    startTransition(async () => {
      try {
        const result = await deleteFounderEntry(id);
        if (result.error) { setError(result.error); return; }
        if (editing === id) reset();
        setDeleting(null); setStatus("Entry deleted."); router.refresh();
      } catch { setError("Could not delete your entry. Please try again."); }
    });
  }
  async function copyEntryLink(entry: Entry) {
    try {
      await navigator.clipboard.writeText(new URL(entry.publishedEntryPath ?? founderEntryPath(entry), window.location.origin).href);
      setStatus("Public entry link copied.");
    } catch { setError("Open the shareable page and copy its address to share this entry."); }
  }
  function withdraw(entry: Entry) {
    startTransition(async () => {
      try { const result = await saveFounderEntry(entry.id, { ...entry, visibility: "PRIVATE" }); if (result.error) setError(result.error); else { if (editing === entry.id) reset(); setStatus("Entry is private. Pending review and scheduled publication cancelled."); router.refresh(); } }
      catch { setError("Could not withdraw the entry. Please try again."); }
    });
  }

  return <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <section aria-labelledby="journal-editor" className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 id="journal-editor" className="font-heading text-xl font-bold">{editing ? "Edit entry" : "New entry"}</h2>
        {editing && <button type="button" disabled={pending || uploading} className={secondary} onClick={() => { if (!dirty || window.confirm("Discard your unsaved changes?")) reset(); }}>New entry</button>}
      </div>
      <form onSubmit={event => { event.preventDefault(); save(); }} className="space-y-5">
        <fieldset disabled={pending || uploading} className="space-y-5 disabled:opacity-60">
          <label className="block text-sm font-semibold">Entry style
            <select value={draft.prompt} onChange={event => change({ prompt: event.target.value as Prompt })} className={field}>
              {Object.entries(JOURNAL_PROMPTS).map(([value, prompt]) => <option key={value} value={value}>{prompt.label}</option>)}
            </select>
          </label>
          {draft.prompt !== "FREE_WRITE" && <aside className="rounded-xl border-l-4 border-coral-400 bg-coral-50 p-4 text-sm leading-relaxed text-gray-700">
            <p className="whitespace-pre-line">{JOURNAL_PROMPTS[draft.prompt].text}</p>
            <button type="button" disabled={uploading} className="mt-2 min-h-11 font-semibold text-coral-700 hover:underline" onClick={() => {
              const parsed = journalDeltaSchema.safeParse(draft.contentJson);
              const contentJson = { ops: [...(parsed.success ? parsed.data : plainTextDelta(draft.body)).ops, { insert: `${draft.body ? "\n" : ""}${JOURNAL_PROMPTS[draft.prompt].text}\n` }] };
              change({ body: journalPlainText(contentJson), contentJson });
            }}>Add prompts to my entry</button>
          </aside>}
          <label className="block text-sm font-semibold">Title
            <input id="entry-title" required maxLength={180} value={draft.title} onChange={event => change({ title: event.target.value })} className={field} placeholder="What is on your mind?" />
          </label>
          <div><p className="mb-3 text-sm font-semibold">Your entry</p>
            <QuillEditor value={draft.contentJson ?? plainTextDelta(draft.body)} ariaLabel="Your entry" readOnly={pending || uploading} imageUploadUrl="/api/uploads/founder-journal" onUploadStateChange={setUploading} placeholder="Ideas, decisions, progress, or a lesson worth keeping…" onChange={(delta, _html, text) => {
              const parsed = journalDeltaSchema.safeParse(delta);
              change({ body: parsed.success ? journalPlainText(parsed.data) : text.trim(), contentJson: delta });
            }} />
          </div>
          <p className="text-right text-xs text-gray-500">{draft.body.length.toLocaleString()} / 12,000 characters</p>
          <div className="rounded-xl bg-gray-50 p-4">
            <label className="block text-sm font-semibold">Milestone (optional)
              <input maxLength={180} value={draft.milestone} onChange={event => change({ milestone: event.target.value, milestoneDone: event.target.value ? draft.milestoneDone : false })} className={field} placeholder="e.g. Speak to five potential customers" />
            </label>
            <label className="mt-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" disabled={!draft.milestone.trim()} checked={draft.milestoneDone} onChange={event => change({ milestoneDone: event.target.checked })} className="h-4 w-4 accent-coral-600" />Milestone complete</label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Who can see this entry?</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["PRIVATE", "PUBLIC"] as const).map(visibility => <label key={visibility} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${draft.visibility === visibility ? "border-coral-500 bg-coral-50" : "border-gray-200"}`}>
                <input type="radio" name="entry-visibility" value={visibility} checked={draft.visibility === visibility} onChange={() => change({ visibility })} className="mt-1 accent-coral-600" />
                <span className="text-sm"><span className="font-semibold">{visibility === "PRIVATE" ? "Private" : "Public"}</span><span className="mt-1 block text-gray-600">{visibility === "PRIVATE" ? "Only you can view it" : "On your startup page"}</span></span>
              </label>)}
            </div>
          </fieldset>
          <label className="block text-sm font-semibold">{draft.visibility === "PUBLIC" ? "Publish on startup" : "Related startup (optional)"}
            <select required={draft.visibility === "PUBLIC"} value={draft.startupId} onChange={event => change({ startupId: event.target.value })} className={field}>
              <option value="">{draft.visibility === "PUBLIC" ? "Choose a live startup" : "No startup selected"}</option>
              {startups.map(startup => <option key={startup.id} value={startup.id} disabled={draft.visibility === "PUBLIC" && startup.status !== "LIVE"}>{startup.name}{startup.status !== "LIVE" ? " (not live)" : ""}</option>)}
            </select>
          </label>
          {draft.visibility === "PUBLIC" && <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-900"><p>{canPublish ? `Public entries for ${selected.name} require review. After approval, the entry and milestone can appear on your startup page, its shareable page, and in search results. An existing approved version stays live while edits are reviewed. Making an entry private withdraws it immediately; old copies or search results may remain for a while.` : "You need a live startup to share publicly. You can write and save private entries before your startup goes live."}</p>
            <label className="block font-semibold">Preferred publication time (IST, optional)<input type="datetime-local" value={draft.scheduledFor ?? ""} onChange={event => change({ scheduledFor: event.target.value })} className={field} /></label>
            <p className="text-xs">Leave blank to publish after approval. Times use India Standard Time (UTC+05:30). If your requested time passes before approval, a reviewer will return the entry so you can choose a new time. Publication is checked every minute and may be delayed by outages.</p>
          </div>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setPreview(value => !value)} className={secondary}>{preview ? "Hide preview" : "Preview entry"}</button>
            <button type="submit" disabled={uploading || (draft.visibility === "PUBLIC" && !canPublish)} className="min-h-11 rounded-xl bg-coral-600 px-5 py-3 text-sm font-semibold text-white hover:bg-coral-700 disabled:cursor-not-allowed disabled:opacity-50">{uploading ? "Uploading image…" : pending ? "Saving…" : draft.visibility === "PUBLIC" ? "Submit for review" : "Save private entry"}</button>
          </div>
        </fieldset>
      </form>
      {preview && <article aria-label="Entry preview" className="mt-6 space-y-3 rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-600">Preview · {draft.visibility === "PRIVATE" ? "Private · Only you" : `Public · ${selected?.name ?? "Choose a startup"}`}</p>
        <h3 className="break-words text-xl font-bold">{draft.title || "Untitled entry"}</h3>
        <JournalRichContent content={draft.contentJson} fallback={draft.body || "Your entry will appear here."} />
        {draft.milestone && <p className="break-words text-sm">{draft.milestoneDone ? "✓ Completed" : "○ In progress"}: {draft.milestone}</p>}
      </article>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <p role="status" className="mt-4 text-sm text-green-800">{status}</p>
      {dirty && <p className="mt-3 text-xs text-gray-500">Unsaved changes. Save your entry before leaving this page.</p>}
    </section>
    <section aria-labelledby="saved-entries" className="min-w-0">
      <h2 id="saved-entries" className="mb-5 flex items-center gap-2 font-heading text-xl font-bold"><BookOpen aria-hidden="true" className="h-5 w-5 text-coral-600" />Your entries</h2>
      {entries.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm leading-relaxed text-gray-600">Your journal starts here. Write freely, or choose a prompt to reflect on your week. Entries start private.</div> : <div className="space-y-4">{entries.map(entry => <article key={entry.id} className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-semibold">{entry.visibility === "PRIVATE" ? <LockKeyhole aria-hidden="true" className="h-3 w-3" /> : <Globe aria-hidden="true" className="h-3 w-3" />}{entry.visibility === "PRIVATE" ? "Private" : entry.liveVersion ? "Public" : "Not published"}</span>
          <time dateTime={entry.updatedAt}>{new Date(entry.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}</time>
        </div>
        {entry.reviewStatus && entry.reviewStatus !== "PRIVATE" && <p className="mt-3 text-xs font-semibold text-blue-800">{entry.reviewStatus.replaceAll("_", " ")}{entry.liveVersion && entry.reviewStatus !== "PUBLISHED" ? " · Approved version still live" : ""}{entry.scheduledFor ? ` · ${entry.scheduledFor.replace("T", " ")} IST` : ""}</p>}
        {entry.reviewerNotes && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Reviewer note: {entry.reviewerNotes}</p>}
        <h3 className="mt-3 break-words text-lg font-semibold">{entry.title}</h3>
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-600">{entry.body}</p>
        {entry.milestone && <p className="mt-3 break-words text-sm text-slate-700">{entry.milestoneDone ? "✓ Completed" : "○ In progress"}: {entry.milestone}</p>}
        {entry.startup && <p className="mt-3 text-xs text-gray-500">{entry.startup.name}{entry.visibility === "PUBLIC" && entry.startup.status !== "LIVE" ? " · Hidden while startup is not live" : ""}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending || uploading} onClick={() => edit(entry)} className={secondary}>Read / edit<span className="sr-only"> {entry.title}</span></button>
          {entry.liveVersion && <Link href={`/startups/${entry.publishedStartupSlug ?? entry.startup?.slug}#section-founder-journal`} className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 hover:underline">View approved version on startup</Link>}
          {entry.liveVersion && <Link href={entry.publishedEntryPath ?? founderEntryPath(entry)} className="inline-flex min-h-11 items-center text-sm font-semibold text-coral-700 hover:underline">Open shareable page</Link>}
          {entry.liveVersion && <button type="button" className="min-h-11 text-sm font-semibold text-coral-700 hover:underline" onClick={() => copyEntryLink(entry)}>Copy link<span className="sr-only"> for {entry.title}</span></button>}
          {entry.visibility === "PUBLIC" && <button type="button" disabled={pending || uploading} onClick={() => withdraw(entry)} className="min-h-11 text-sm font-semibold text-gray-700 hover:underline">Make private / cancel publication</button>}
          <button type="button" disabled={pending || uploading} onClick={() => setDeleting(entry.id)} className="min-h-11 text-sm text-red-700 hover:underline">Delete<span className="sr-only"> {entry.title}</span></button>
        </div>
        {deleting === entry.id && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm"><p>Delete “{entry.title}”? This permanently removes it{entry.visibility === "PUBLIC" ? " from your journal and startup page" : ""}.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={pending || uploading} onClick={() => remove(entry.id)} className="min-h-11 rounded-xl bg-red-700 px-4 py-2 font-semibold text-white">Delete permanently</button><button type="button" disabled={pending || uploading} onClick={() => setDeleting(null)} className={secondary}>Keep entry</button></div></div>}
      </article>)}</div>}
    </section>
  </div>;
}
