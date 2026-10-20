"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import CopyButton from "./CopyButton";

export default function ArticleShare({ title, url }: { title: string; url: string }) {
  const [message, setMessage] = useState("");
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Article link copied.");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Use Copy article link, or copy the address from your browser.");
    }
  };
  return (
    <div aria-label="Share this article" className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={share} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-coral-50"><Share2 size={16} aria-hidden="true" />Share article</button>
      <CopyButton value={url} label="Copy article link" />
      <p role="status" className="text-sm text-gray-600">{message}</p>
    </div>
  );
}
