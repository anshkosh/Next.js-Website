"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-coral-300 hover:bg-coral-50 hover:text-coral-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" aria-label={copied ? "Copied" : label}>
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      {copied ? "Copied" : label}
    </button>
  );
}
