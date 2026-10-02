"use client";

import { useId, useState } from "react";
import { useUploadActivity } from "./useUploadActivity";
import PhotoEditor from "./PhotoEditor";
import { Button } from "@/components/ui/button";

type Kind = "logo" | "gallery" | "founder-photo";
export default function EditableImageUpload({ kind, value, onChange, onBusyChange, label, disabled = false }: {
  kind: Kind; value?: string; onChange: (url: string) => void; onBusyChange?: (busy: boolean) => void; label: string; disabled?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputId = useId();
  const busy = loading || !!file;
  useUploadActivity(busy, onBusyChange);

  function selectFile(selected?: File) {
    setError("");
    if (!selected) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(selected.type)) { setError("Choose a JPG, PNG, WebP or GIF photo."); return; }
    if (!selected.size || selected.size > 15 * 1024 * 1024) { setError("Choose a photo smaller than 15 MB."); return; }
    setFile(selected);
  }

  async function editExisting() {
    if (!value) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(value);
      if (!response.ok) throw new Error("This photo could not be opened. Upload the original to edit it.");
      const blob = await response.blob();
      selectFile(new File([blob], "existing-photo", { type: blob.type }));
    } catch { setError("This photo could not be opened. Upload the original to edit it."); }
    finally { setLoading(false); }
  }

  async function upload(edited: File) {
    const data = new FormData(); data.append("file", edited);
    const response = await fetch(`/api/uploads/${kind}`, { method: "POST", body: data });
    if (response.status === 413) throw new Error("The server rejected this photo's size. Try a smaller crop or ask the site administrator to check the upload limit.");
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.url) throw new Error(result.error || "The upload failed. Try again.");
    onChange(result.url); setFile(null);
  }

  return <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
    {value && <img src={value} alt={`${label} preview`} className={kind === "gallery" ? "aspect-video w-full rounded-lg object-contain" : "h-20 w-20 rounded-lg object-contain"} />}
    <div className="flex flex-wrap items-center gap-2">
      <input id={inputId} type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy || disabled} aria-label={`Upload ${label.toLowerCase()}`} onChange={e => { selectFile(e.target.files?.[0]); e.target.value = ""; }} className="block w-full min-w-0 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium" />
      {value && <>
        <Button type="button" size="sm" variant="outline" disabled={busy || disabled} onClick={editExisting}>Edit photo</Button>
        <Button type="button" size="sm" variant="ghost" disabled={busy || disabled} onClick={() => onChange("")} aria-label={`Remove ${label.toLowerCase()}`}>Remove</Button>
      </>}
    </div>
    <p className="text-xs text-gray-500">{loading ? "Opening photo…" : "Crop, straighten and zoom before uploading."}</p>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {file && <PhotoEditor file={file} square={kind !== "gallery"} onCancel={() => setFile(null)} onApply={upload} />}
  </div>;
}
