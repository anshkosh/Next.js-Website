"use client";

import { useState, useTransition } from "react";
import { requestCommentManagement } from "@/app/actions/comment.actions";

export default function RequestCommentManagement({ commentId }: { commentId: string }) {
  const [busy, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <div className="mt-2 pl-12"><button type="button" disabled={busy} onClick={() => startTransition(async () => {
    const result = await requestCommentManagement(commentId);
    setMessage(result.message);
  })} className="min-h-9 text-xs font-semibold text-gray-600 underline disabled:opacity-50">{busy ? "Sending secure link…" : "Edit or delete your comment"}</button>{message && <p role="status" className="mt-1 text-xs text-gray-600">{message}</p>}</div>;
}
