"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteCommentWithToken, editCommentWithToken } from "@/app/actions/comment.actions";

export default function CommentManagementForm({ token, initial }: { token: string; initial: { id: string; authorName: string; body: string; status: string; startup: { slug: string; name: string } } }) {
  const [name, setName] = useState(initial.authorName);
  const [body, setBody] = useState(initial.body);
  const [message, setMessage] = useState("");
  const [deleted, setDeleted] = useState(false);
  const [busy, startTransition] = useTransition();
  function save(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    startTransition(async () => {
      const result = await editCommentWithToken(token, { authorName: name, body });
      setMessage(("error" in result ? result.error : undefined) ?? ("message" in result ? result.message : undefined) ?? "Your comment was updated.");
      if (!("error" in result)) setDeleted(true);
    });
  }
  function remove() {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteCommentWithToken(token);
      setMessage(("error" in result ? result.error : undefined) ?? ("message" in result ? result.message : undefined) ?? "Your comment was deleted.");
      if (!("error" in result)) setDeleted(true);
    });
  }
  return <main className="mx-auto max-w-2xl px-4 py-12">
    <p className="text-sm text-gray-600">Comment on <Link className="font-semibold text-coral-700 underline" href={`/startups/${initial.startup.slug}`}>{initial.startup.name}</Link></p>
    <h1 className="mt-2 font-heading text-3xl font-bold text-gray-900">Manage your comment</h1>
    {deleted ? <div className="mt-6 space-y-4"><p role="status" className="rounded-lg bg-green-50 p-4 text-green-900">{message}</p><Link className="font-semibold text-coral-700 underline" href={`/startups/${initial.startup.slug}`}>Return to startup</Link></div> : <>
      <p className="mt-3 text-sm text-gray-600">Changes return to moderation before appearing publicly. This secure link works once.</p>
      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">Display name<input required minLength={2} maxLength={80} value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-lg border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Comment<textarea required minLength={5} maxLength={2000} rows={7} value={body} onChange={e => setBody(e.target.value)} className="mt-1 block w-full rounded-lg border p-3 font-normal" /></label>
        {message && <p role="status" className="text-sm text-red-800">{message}</p>}
        <div className="flex flex-wrap gap-3"><button disabled={busy} className="min-h-11 rounded-lg bg-coral-700 px-5 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Save and resubmit"}</button><button type="button" disabled={busy} onClick={remove} className="min-h-11 rounded-lg border border-red-300 px-5 font-semibold text-red-800 disabled:opacity-50">Delete comment</button></div>
      </form>
    </>}
  </main>;
}
