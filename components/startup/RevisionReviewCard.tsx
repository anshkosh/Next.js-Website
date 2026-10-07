"use client";
import { useState } from "react";
import { reviewRevision } from "@/app/actions/revision.actions";
import { useRouter } from "next/navigation";

type Change = { label: string; current: string; proposed: string };
export default function RevisionReviewCard({ id, version, name, owner, changes }: {
  id: string; version: string; name: string; owner: string; changes: Change[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  async function review(decision: "approve" | "reject") {
    setBusy(true); setError("");
    try {
      const result = await reviewRevision(id, version, decision, notes);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch { setError("Review could not be saved. Please try again."); }
    finally { setBusy(false); }
  }
  return <article className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
    <div><h2 className="text-xl font-bold font-heading">{name}: profile changes</h2>
      <p className="text-sm text-gray-600">Submitted by {owner}. The existing profile stays live.</p></div>
    <details><summary className="cursor-pointer font-medium text-coral-600">Compare published and proposed content ({changes.length} fields)</summary>
      <div className="mt-4 space-y-4">{changes.map(change => <section key={change.label}>
        <h3 className="font-semibold">{change.label}</h3>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3"><p className="text-xs font-semibold text-gray-500">Published</p><pre className="text-sm whitespace-pre-wrap break-words font-sans">{change.current || "Not provided"}</pre></div>
          <div className="rounded-lg bg-coral-50 p-3"><p className="text-xs font-semibold text-coral-600">Proposed</p><pre className="text-sm whitespace-pre-wrap break-words font-sans">{change.proposed || "Removed"}</pre></div>
        </div>
      </section>)}</div>
    </details>
    {rejecting && <label className="block text-sm font-medium">Reason for rejection
      <textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={2000} className="mt-2 w-full rounded-lg border p-3" rows={3} /></label>}
    <div className="flex flex-wrap gap-3">
      <button type="button" disabled={busy} onClick={() => void review("approve")} className="rounded-lg bg-green-700 px-4 py-2 text-white disabled:opacity-50">Approve changes</button>
      <button type="button" disabled={busy || (rejecting && !notes.trim())} onClick={() => rejecting ? void review("reject") : setRejecting(true)} className="rounded-lg border border-red-200 px-4 py-2 text-red-700 disabled:opacity-50">{rejecting ? "Confirm rejection" : "Reject changes"}</button>
      {rejecting && <button type="button" disabled={busy} onClick={() => setRejecting(false)}>Cancel</button>}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </article>;
}
