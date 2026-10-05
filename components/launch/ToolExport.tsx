"use client";

import { useState } from "react";
import { Copy, Download } from "lucide-react";
import { primaryButton, secondaryButton } from "./ToolFields";

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportFilename(name: string, suffix: string) {
  return `${name.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").slice(0, 60) || "startup"}-${suffix}`;
}
export default function ToolExport({ text, filename, disabled = false, mime = "text/plain;charset=utf-8", downloadLabel = "Download text" }: {
  text: string; filename: string; disabled?: boolean; mime?: string; downloadLabel?: string;
}) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(text); setStatus("Copied to clipboard."); }
    catch { setStatus("Clipboard access failed. Select and copy the export text below."); }
  }
  function download() {
    try { downloadBlob(new Blob([text], { type: mime }), filename); setStatus("Download prepared."); }
    catch { setStatus("Download failed. Select and copy the export text below."); }
  }
  return <div className="mt-6">
    <div className="flex flex-wrap gap-3"><button type="button" disabled={disabled} onClick={copy} className={secondaryButton}><Copy size={16} aria-hidden="true" />Copy results</button><button type="button" disabled={disabled} onClick={download} className={primaryButton}><Download size={16} aria-hidden="true" />{downloadLabel}</button></div>
    <p role="status" aria-live="polite" className="mt-3 min-h-5 text-sm text-gray-600">{status}</p>
    {!disabled && <details className="mt-2 text-sm text-gray-600"><summary className="cursor-pointer font-medium">View export text</summary><label className="mt-3 block">Export text<textarea readOnly value={text} rows={8} className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 font-mono text-xs" /></label></details>}
  </div>;
}
