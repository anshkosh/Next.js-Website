"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import MorphText from "@/components/motion/MorphText";

export default function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const reset = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(reset.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.clearTimeout(reset.current);
      reset.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={copy} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-coral-300 hover:bg-coral-50 hover:text-coral-600 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
      <span className="t-icon-swap" data-state={copied ? "b" : "a"} aria-hidden="true">
        <Copy size={15} className="t-icon" data-icon="a" />
        <Check size={15} className="t-icon" data-icon="b" />
      </span>
      <MorphText text={copied ? "Copied" : label} />
      <span role="status" className="sr-only">{copied ? "Copied" : ""}</span>
    </button>
  );
}
