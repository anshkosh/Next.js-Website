"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { banCommentAccount, blockCommenterFromComment, setCommentModerationStatus } from "@/app/actions/moderation-controls.actions";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED";
interface AdminComment {
  id: string;
  authorName: string;
  authorEmail: string;
  authorHasLinkedAccount: boolean;
  authorUserRole: string | null;
  body: string;
  status: CommentStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  review: { status: string; reasons: string[]; reviewedAt: string | null; reviewedBy: string | null } | null;
  reviewNote: string | null;
  startup: { id: string; name: string; slug: string };
}

function CommentModerationRow({ comment }: { comment: AdminComment }) {
  const [busy, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [duration, setDuration] = useState("7d");
  const [message, setMessage] = useState("");
  const router = useRouter();

  function review(nextStatus: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await setCommentModerationStatus(comment.id, comment.status, nextStatus, decisionNote);
      setMessage(result.error ?? (nextStatus === "APPROVED" ? "Comment published." : "Comment hidden."));
      if (!result.error) router.refresh();
    });
  }

  function block() {
    startTransition(async () => {
      const result = await blockCommenterFromComment(comment.id, reason, duration);
      setMessage(result.error ?? "Email blocked from future comments.");
      if (!result.error) router.refresh();
    });
  }

  function banAccount() {
    if (!window.confirm(`Ban the Anshkosh account linked to ${comment.authorName}? This blocks sign-in and removes its current sessions.`)) return;
    startTransition(async () => {
      const result = await banCommentAccount(comment.id, reason, duration);
      setMessage(result.error ?? "Account banned and linked email blocked from comments.");
      if (!result.error) router.refresh();
    });
  }

  const statusLabel = comment.status === "PENDING" ? "Needs review" : comment.status === "APPROVED" ? "Published" : "Hidden or rejected";
  const lastReviewAt = comment.reviewedAt ?? comment.review?.reviewedAt ?? null;
  const hasStaffReview = Boolean(comment.reviewedBy ?? comment.review?.reviewedBy);

  return <article className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-900">{comment.authorName}</h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{statusLabel}</span>
        </div>
        <p className="break-all text-sm text-gray-600">{comment.authorEmail} · {new Date(comment.createdAt).toLocaleString("en-IN")}</p>
        <p className="text-sm text-gray-600">On <Link className="font-medium text-coral-700 underline" href={`/startups/${comment.startup.slug}`} target="_blank">{comment.startup.name}</Link></p>
        {hasStaffReview && <p className="text-xs text-gray-500">Last staff decision {lastReviewAt ? new Date(lastReviewAt).toLocaleString("en-IN") : "recorded"}{comment.reviewNote ? ` · ${comment.reviewNote}` : ""}</p>}
      </div>
    </header>

    <p className="whitespace-pre-wrap break-words rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">{comment.body}</p>
    {comment.review?.reasons.length ? <ul className="list-disc space-y-1 rounded-lg bg-amber-50 p-3 pl-8 text-sm text-amber-950">{comment.review.reasons.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : null}

    <div className="space-y-3 border-t pt-4">
      {comment.status !== "REJECTED" && <label className="block max-w-2xl space-y-1 text-sm font-medium text-gray-800">Review note <span className="font-normal text-gray-500">(required to reject or hide)</span>
        <textarea value={decisionNote} onChange={event => setDecisionNote(event.target.value)} maxLength={500} rows={2} className="block w-full rounded-lg border p-2" placeholder="Reason for the moderation decision" />
      </label>}
      <div className="flex flex-wrap gap-3">
        {comment.status !== "APPROVED" && <button type="button" disabled={busy} onClick={() => review("APPROVED")} className="min-h-11 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{comment.status === "REJECTED" ? "Restore and publish" : "Approve and publish"}</button>}
        {comment.status !== "REJECTED" && <button type="button" disabled={busy || decisionNote.trim().length < 5} onClick={() => review("REJECTED")} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">{comment.status === "APPROVED" ? "Hide from public" : "Reject"}</button>}
      </div>
    </div>

    <details className="rounded-xl border border-red-100 bg-red-50/50 p-4">
      <summary className="min-h-8 cursor-pointer font-semibold text-red-900">Restrict this commenter</summary>
      <p className="mt-2 text-sm text-gray-700">A verified email block stops future comments using this address. Account bans also sign out the linked Anshkosh account. Product criticism alone is not a reason to restrict someone.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="space-y-1 text-sm font-medium text-gray-800">Reason
          <textarea value={reason} onChange={event => setReason(event.target.value)} minLength={5} maxLength={500} rows={2} className="block w-full rounded-lg border bg-white p-2" placeholder="Describe the behavior that led to this restriction" />
        </label>
        <label className="space-y-1 text-sm font-medium text-gray-800">Duration
          <select value={duration} onChange={event => setDuration(event.target.value)} className="block min-h-10 w-full rounded-lg border bg-white px-2">
            <option value="1d">1 day</option><option value="7d">7 days</option><option value="30d">30 days</option><option value="permanent">Until removed</option>
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        {comment.authorHasLinkedAccount && comment.authorUserRole === "user" && <>
          <button type="button" disabled={busy || reason.trim().length < 5} onClick={block} className="min-h-11 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 disabled:opacity-50">Block verified email from comments</button>
          <button type="button" disabled={busy || reason.trim().length < 5} onClick={banAccount} className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Ban linked user account</button>
        </>}
      </div>
      {comment.authorHasLinkedAccount && comment.authorUserRole === "user" ? <p className="mt-2 text-xs text-gray-600">This comment was linked at submission to a verified ordinary account. Staff accounts are protected.</p> : <p className="mt-2 text-xs text-gray-600">{comment.authorHasLinkedAccount ? "This is a staff or unavailable account; staff accounts cannot be restricted here." : "No verified account was linked at submission, so account and email blocks are unavailable."} You can still reject or hide this comment.</p>}
    </details>

    <p role="status" aria-live="polite" className="min-h-5 text-sm text-gray-700">{message}</p>
  </article>;
}

export default function CommentModerationList({ comments }: { comments: AdminComment[] }) {
  if (!comments.length) return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><div className="mb-4 text-5xl">💬</div><h2 className="mb-2 text-xl font-bold">No matching comments</h2><p className="text-gray-600">Try another status or search term.</p></div>;
  return <div className="space-y-4">{comments.map(comment => <CommentModerationRow key={comment.id} comment={comment} />)}</div>;
}
