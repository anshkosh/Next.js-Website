"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewContent } from "@/app/actions/content-moderation.actions";

export default function ReviewButtons({ id, hash, published = false }: { id: string; hash: string; published?: boolean }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();
  function review(approve: boolean) {
    start(async () => {
      try {
        const result = await reviewContent(id, hash, approve);
        setMessage(result.error ?? "Review saved.");
        if (!result.error) router.refresh();
      } catch { setMessage("Review could not be confirmed. Refresh before trying again."); }
    });
  }
  return <div className="space-y-2"><div className="flex gap-3">
    {!published && <button type="button" disabled={pending} onClick={() => review(true)} className="min-h-11 rounded-lg bg-green-700 px-4 py-2 font-semibold text-white disabled:opacity-50">Approve and publish</button>}
    <button type="button" disabled={pending} onClick={() => review(false)} className="min-h-11 rounded-lg border px-4 py-2 font-semibold disabled:opacity-50">{published ? "Hide published content" : "Reject submission"}</button>
  </div><p role="status" className="text-sm">{message}</p></div>;
}
