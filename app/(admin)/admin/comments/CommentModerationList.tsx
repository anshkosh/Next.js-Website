"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { banCommentAccount, blockCommenterFromComment, deleteCommentAsStaff, editCommentAsStaff, purgeDeletedComment, restoreDeletedComment, setCommentModerationStatus } from "@/app/actions/moderation-controls.actions";

type CommentStatus = "PENDING" | "APPROVED" | "REJECTED" | "DELETED";
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
  deletedAt: string | null;
  deletionReason: string | null;
  staffEvents: { action: string; actorId: string | null; actorName: string; reason: string | null; createdAt: string }[];
  revisions: { authorName: string; body: string; editorId: string | null; editorName: string; createdAt: string }[];
  replyRevisions: { reply: string; repliedBy: string | null; editorId: string | null; editorName: string; createdAt: string }[];
  startup: { id: string; name: string; slug: string };
}

function CommentModerationRow({ comment, canRestore }: { comment: AdminComment; canRestore: boolean }) {
  const [busy, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [duration, setDuration] = useState("7d");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(comment.authorName);
  const [editBody, setEditBody] = useState(comment.body);
  const [deleteReason, setDeleteReason] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const router = useRouter();

  function review(nextStatus: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await setCommentModerationStatus(comment.id, comment.status, nextStatus, decisionNote);
      const hasError = "error" in result;
      const notificationPending = !hasError && "notificationPending" in result && result.notificationPending;
      setMessage(hasError ? result.error : (nextStatus === "APPROVED" ? (notificationPending ? "Comment published. The founder email is queued for retry." : "Comment published.") : "Comment hidden."));
      if (!hasError) router.refresh();
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

  function saveEdit() {
    startTransition(async () => {
      const result = await editCommentAsStaff(comment.id, editName, editBody);
      if ("error" in result) { setMessage(result.error); return; }
      setMessage(result.message);
      setEditing(false); router.refresh();
    });
  }

  function deleteComment() {
    if (!window.confirm("Remove this comment from public view? Its history and founder reply will be preserved for staff, and an admin can restore it.")) return;
    startTransition(async () => {
      const result = await deleteCommentAsStaff(comment.id, deleteReason);
      setMessage(result.error ?? "Comment removed from public view.");
      if (!result.error) router.refresh();
    });
  }

  function restoreComment() {
    if (!window.confirm("Restore this comment to its previous status?")) return;
    startTransition(async () => {
      const result = await restoreDeletedComment(comment.id);
      setMessage(result.error ?? "Comment restored.");
      if (!result.error) router.refresh();
    });
  }

  function purgeComment() {
    const reason = window.prompt("Permanently purge this comment and its content history? A body-free audit record will remain. Enter a reason:");
    if (!reason?.trim()) return;
    if (!window.confirm("This permanently removes the comment, revisions, staff history, and attached founder reply. Continue?")) return;
    startTransition(async () => {
      const result = await purgeDeletedComment(comment.id, reason);
      setMessage(result.error ?? "Comment permanently purged.");
      if (!result.error) router.refresh();
    });
  }

  const statusLabel = comment.deletedAt ? "Deleted · recoverable" : comment.status === "PENDING" ? "Needs review" : comment.status === "APPROVED" ? "Published" : "Hidden or rejected";
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

    {editing ? <div className="space-y-3 rounded-xl border bg-gray-50 p-4"><label className="block text-sm font-medium">Display name<input value={editName} onChange={event => setEditName(event.target.value)} maxLength={80} className="mt-1 block min-h-10 w-full rounded-lg border bg-white px-3" /></label><label className="block text-sm font-medium">Comment<textarea value={editBody} onChange={event => setEditBody(event.target.value)} maxLength={2000} rows={5} className="mt-1 block w-full rounded-lg border bg-white p-3" /></label><p className="text-xs text-gray-600">Saving sends this version back to review. It will stay hidden until approved.</p><div className="flex gap-2"><button type="button" disabled={busy || editName.trim().length < 2 || editBody.trim().length < 5} onClick={saveEdit} className="min-h-10 rounded-lg bg-gray-900 px-4 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save and review"}</button><button type="button" disabled={busy} onClick={() => { setEditing(false); setEditName(comment.authorName); setEditBody(comment.body); }} className="min-h-10 rounded-lg border bg-white px-4">Cancel</button></div></div> : <p className="whitespace-pre-wrap break-words rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">{comment.body}</p>}
    {!comment.deletedAt && <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => { setEditing(true); setShowDelete(false); }} className="min-h-10 rounded-lg border px-4 text-sm font-semibold">Edit</button><button type="button" disabled={busy} onClick={() => setShowDelete(value => !value)} className="min-h-10 rounded-lg border border-red-300 px-4 text-sm font-semibold text-red-800">Delete</button>{showDelete && <div className="w-full space-y-2 rounded-lg border border-red-200 bg-red-50 p-3"><label className="block text-sm font-medium text-red-950">Reason for the audit record<textarea value={deleteReason} onChange={event => setDeleteReason(event.target.value)} minLength={5} maxLength={500} rows={2} className="mt-1 block w-full rounded-lg border bg-white p-2" /></label><button type="button" disabled={busy || deleteReason.trim().length < 5} onClick={deleteComment} className="min-h-10 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50">Remove from public</button></div>}</div>}
    <details className="rounded-xl border bg-gray-50 p-4"><summary className="cursor-pointer font-semibold">History &amp; staff activity ({comment.revisions.length + comment.replyRevisions.length + comment.staffEvents.length})</summary><div className="mt-3 space-y-3">{comment.revisions.map((item, index) => <div key={`comment-${index}`} className="rounded-lg bg-white p-3"><p className="text-xs text-gray-500">Comment version · {new Date(item.createdAt).toLocaleString("en-IN")} · {item.editorName}</p><p className="mt-1 text-sm font-semibold">{item.authorName}</p><p className="mt-1 whitespace-pre-wrap text-sm">{item.body}</p></div>)}{comment.replyRevisions.map((item, index) => <div key={`reply-${index}`} className="rounded-lg bg-white p-3"><p className="text-xs text-gray-500">Founder reply version · {new Date(item.createdAt).toLocaleString("en-IN")} · {item.editorName}</p>{item.repliedBy && <p className="mt-1 text-sm font-semibold">{item.repliedBy}</p>}<p className="mt-1 whitespace-pre-wrap text-sm">{item.reply}</p></div>)}{comment.staffEvents.map((item, index) => <div key={`staff-${index}`} className="rounded-lg bg-white p-3"><p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString("en-IN")} · {item.actorName} · {item.action.toLowerCase()}</p>{item.reason && <p className="mt-1 text-sm">Reason: {item.reason}</p>}</div>)}{comment.deletedAt && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-900">Removed {new Date(comment.deletedAt).toLocaleString("en-IN")}{comment.deletionReason ? ` · ${comment.deletionReason}` : ""}</p>}{comment.revisions.length + comment.replyRevisions.length + comment.staffEvents.length === 0 && <p className="text-sm text-gray-600">No edits or staff actions recorded yet. Current version is shown above.</p>}</div></details>
    {comment.review?.reasons.length ? <ul className="list-disc space-y-1 rounded-lg bg-amber-50 p-3 pl-8 text-sm text-amber-950">{comment.review.reasons.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul> : null}

    {comment.deletedAt ? <div className="border-t pt-4">{canRestore && <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={restoreComment} className="min-h-11 rounded-lg bg-green-700 px-4 font-semibold text-white disabled:opacity-50">Restore deleted comment</button><button type="button" disabled={busy} onClick={purgeComment} className="min-h-11 rounded-lg border border-red-300 px-4 font-semibold text-red-800 disabled:opacity-50">Permanently purge</button></div>}<p className="mt-2 text-sm text-gray-600">Hidden from public view. Revision history is retained.</p></div> : <div className="space-y-3 border-t pt-4">
      {comment.status !== "REJECTED" && <label className="block max-w-2xl space-y-1 text-sm font-medium text-gray-800">Review note <span className="font-normal text-gray-500">(required to reject or hide)</span>
        <textarea value={decisionNote} onChange={event => setDecisionNote(event.target.value)} maxLength={500} rows={2} className="block w-full rounded-lg border p-2" placeholder="Reason for the moderation decision" />
      </label>}
      <div className="flex flex-wrap gap-3">
        {comment.status !== "APPROVED" && <button type="button" disabled={busy} onClick={() => review("APPROVED")} className="min-h-11 rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{comment.status === "REJECTED" ? "Restore and publish" : "Approve and publish"}</button>}
        {comment.status !== "REJECTED" && <button type="button" disabled={busy || decisionNote.trim().length < 5} onClick={() => review("REJECTED")} className="min-h-11 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 disabled:opacity-50">{comment.status === "APPROVED" ? "Hide from public" : "Reject"}</button>}
      </div>
    </div>}

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

export default function CommentModerationList({ comments, canRestore }: { comments: AdminComment[]; canRestore: boolean }) {
  if (!comments.length) return <div className="rounded-xl border border-gray-200 bg-white p-12 text-center"><div className="mb-4 text-5xl">💬</div><h2 className="mb-2 text-xl font-bold">No matching comments</h2><p className="text-gray-600">Try another status or search term.</p></div>;
  return <div className="space-y-4">{comments.map(comment => <CommentModerationRow key={comment.id} comment={comment} canRestore={canRestore} />)}</div>;
}
