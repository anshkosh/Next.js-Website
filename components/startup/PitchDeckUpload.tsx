"use client";
import { useState } from "react";
import { useUploadActivity } from "./useUploadActivity";
import { validatePitchDeck } from "@/lib/validators/pitch-deck.schema";
import { Button } from "@/components/ui/button";

export default function PitchDeckUpload({ value, onChange, onBusyChange, visibility = "private", onVisibilityChange }: {
  value: string; onChange: (url: string) => void; onBusyChange?: (busy: boolean) => void;
  visibility?: string; onVisibilityChange?: (value: "private" | "public") => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useUploadActivity(busy, onBusyChange);
  async function upload(file?: File) {
    if (!file) return;
    setError("");
    const validation = validatePitchDeck(file);
    if (validation) { setError(validation); return; }
    setBusy(true);
    try {
      const form = new FormData(); form.append("file", file);
      const response = await fetch("/api/uploads/pitch-deck", { method: "POST", body: form });
      if (response.status === 413) throw new Error("The server rejected this file's size. Try a smaller PDF or ask the site administrator to check the upload limit.");
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.url) throw new Error(result.error || "Upload failed. Please try again.");
      onChange(result.url);
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-t border-gray-100 pt-6">
    <h3 className="text-lg font-semibold">Pitch deck <span className="text-sm font-normal text-gray-500">(optional)</span></h3>
    <p className="text-sm text-gray-600">PDF, up to 5 MB. New decks are private unless you choose to publish them.</p>
    <label className="block text-sm font-medium">Who can download your deck?
      <select aria-label="Pitch deck visibility" value={visibility} disabled={busy} onChange={event => onVisibilityChange?.(event.target.value as "private" | "public")} className="mt-2 block w-full rounded-lg border bg-white p-2">
        <option value="private">Private — you and Anshkosh reviewers only</option>
        <option value="public">Public — anyone visiting your published profile</option>
      </select>
    </label>
    {visibility === "public" && <p className="text-sm text-amber-800">Remove confidential information. Public downloads cannot be recalled once saved by someone.</p>}
    {value && <div className="flex flex-wrap items-center gap-3">
      <a href={value} className="text-coral-600 underline">Download uploaded pitch deck</a>
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => onChange("")}>Remove pitch deck</Button>
    </div>}
    <input type="file" accept="application/pdf,.pdf" aria-label="Upload PDF pitch deck" disabled={busy} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} className="block w-full min-w-0 text-sm" />
    {busy && <p role="status" className="text-sm">Uploading pitch deck…</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </section>;
}
