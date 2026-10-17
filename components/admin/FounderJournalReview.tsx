"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import JournalRichContent from "@/components/journal/JournalRichContent";
import { reviewFounderEntry } from "@/app/actions/founder-journal-review.actions";
import type { FounderEntryInput } from "@/lib/founder-journal";

export default function FounderJournalReview({ id, version, data, status, scheduledAt, notes, startup, hasLiveVersion }: {
  id: string; version: number; data: FounderEntryInput; status: string; scheduledAt: string | null; notes: string | null; startup: string; hasLiveVersion: boolean;
}) {
  const [note, setNote] = useState(notes ?? ""); const [message, setMessage] = useState(""); const [pending, start] = useTransition(); const router = useRouter();
  function review(decision: "APPROVE" | "CHANGES") {
    start(async () => {
      try { const result = await reviewFounderEntry(id, version, decision, note); setMessage(result.error ?? result.message ?? "Review saved."); if (!result.error) router.refresh(); }
      catch { setMessage("Review failed. Refresh and try again."); }
    });
  }
  return <article className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
    <div><p className="text-xs font-semibold text-blue-800">{status.replaceAll("_", " ")} · {startup}{hasLiveVersion ? " · Existing approved version stays live" : ""}</p><h2 className="mt-2 text-xl font-bold">{data.title}</h2></div>
    {scheduledAt && <p className="text-sm">Requested publication: {new Date(scheduledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>}
    <JournalRichContent content={data.contentJson} fallback={data.body ?? ""} />
    {data.milestone && <p className="rounded-lg bg-gray-50 p-3 text-sm">Milestone: {data.milestone} ({data.milestoneDone ? "complete" : "in progress"})</p>}
    <label className="block text-sm font-semibold">Reviewer note<textarea maxLength={2000} rows={3} value={note} onChange={event => setNote(event.target.value)} className="mt-2 block w-full rounded-lg border border-gray-300 p-3 font-normal" /></label>
    <div className="flex flex-wrap gap-3">{status === "PENDING_REVIEW" && <button disabled={pending} onClick={() => review("APPROVE")} className="min-h-11 rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{scheduledAt ? "Approve schedule" : "Approve and publish"}</button>}
      <button disabled={pending || !note.trim()} onClick={() => review("CHANGES")} className="min-h-11 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 font-semibold text-amber-900 disabled:opacity-50">{status === "SCHEDULED" ? "Cancel approval / request changes" : "Request changes"}</button></div>
    <p role="status" className="text-sm text-gray-700">{message}</p>
  </article>;
}
