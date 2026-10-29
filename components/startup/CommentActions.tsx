"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteOwnComment, editOwnComment } from "@/app/actions/comment.actions";
import type { PendingComment } from "@/app/actions/comment.actions";

type EditableComment = Pick<PendingComment, "id" | "authorName" | "body" | "updatedAt">;

export default function CommentActions({
  comment,
  onEdited,
  onDeleted,
}: {
  comment: EditableComment;
  onEdited?: (comment: PendingComment) => void;
  onDeleted?: (commentId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [authorName, setAuthorName] = useState(comment.authorName);
  const [body, setBody] = useState(comment.body);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    startTransition(async () => {
      const result = await editOwnComment(comment.id, comment.updatedAt, { authorName, body });
      if ("error" in result) { setError(result.error); return; }
      setEditing(false);
      setMessage(result.message);
      if (result.pendingComment) {
        setAuthorName(result.pendingComment.authorName);
        setBody(result.pendingComment.body);
        onEdited?.(result.pendingComment);
      }
    });
  }

  function remove() {
    if (!window.confirm("Permanently delete this comment, its edit history, and any founder reply attached to it? This cannot be undone.")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteOwnComment(comment.id);
      if ("error" in result) { setError(result.error); return; }
      onDeleted?.(comment.id);
    });
  }

  return <div className="relative flex flex-col items-end gap-2">
    <button type="button" aria-label="Comment actions" aria-expanded={menuOpen} aria-haspopup="true" disabled={busy} onClick={() => setMenuOpen(open => !open)} className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700 disabled:opacity-50">
      <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
    </button>
    {menuOpen && <div className="absolute right-0 top-10 z-20 min-w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
      <button type="button" onClick={() => { setMenuOpen(false); setEditing(true); setError(""); setMessage(""); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"><Pencil className="h-4 w-4" aria-hidden="true" />Edit comment</button>
      <button type="button" onClick={() => { setMenuOpen(false); remove(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-red-800 hover:bg-red-50"><Trash2 className="h-4 w-4" aria-hidden="true" />Delete comment</button>
    </div>}
    {editing && <form onSubmit={save} className="w-full space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <label className="block text-left text-xs font-semibold text-gray-700">Display name
        <input required minLength={2} maxLength={80} value={authorName} onChange={event => setAuthorName(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal" />
      </label>
      <label className="block text-left text-xs font-semibold text-gray-700">Comment
        <textarea required minLength={5} maxLength={2000} rows={5} value={body} onChange={event => setBody(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-3 text-sm font-normal" />
      </label>
      <p className="text-left text-xs text-gray-600">Your edit goes back to review. The current comment stays hidden until the edit is approved.</p>
      {error && <p role="alert" className="text-left text-sm text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-coral-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save edit"}</button>
        <button type="button" disabled={busy} onClick={() => { setEditing(false); setAuthorName(comment.authorName); setBody(comment.body); }} className="min-h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 disabled:opacity-50">Cancel</button>
      </div>
    </form>}
    {!editing && message && <p role="status" className="text-right text-xs text-gray-600">{message}</p>}
    {!editing && error && <p role="alert" className="text-right text-xs text-red-800">{error}</p>}
  </div>;
}
