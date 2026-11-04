"use client";
import { useState } from "react";
import Image from "next/image";
import EditableImageUpload from "./EditableImageUpload";
import { withdrawFromWall } from "@/app/actions/startup-wall";
export default function StartupWallControls({ startupId, optedIn, imageUrl, logoUrl, galleryImages, onChange, onBusyChange }: {
  startupId: string; optedIn: boolean; imageUrl: string; logoUrl: string; galleryImages: string[];
  onChange: (optedIn: boolean, imageUrl: string) => void; onBusyChange: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function withdraw() {
    setBusy(true); onBusyChange(true); setMessage("");
    try {
      const result = await withdrawFromWall(startupId);
      if (result.error) setMessage(result.error);
      else { onChange(false, imageUrl); setMessage("Withdrawn. Your startup is now hidden from the Wall."); }
    } catch { setMessage("Withdrawal could not be confirmed. Please try again."); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <section id="startup-wall-settings" className="scroll-mt-28 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5" aria-labelledby="wall-settings-title">
    <h2 id="wall-settings-title" className="font-heading text-2xl font-bold">Startup Wall</h2>
    <p className="text-sm text-gray-600">Admins can place your public profile logo on the Wall. You can request a placement or submit a custom image for review, and you can withdraw your startup at any time.</p>
    <label className="flex items-center gap-3 font-medium"><input type="checkbox" checked={optedIn} onChange={e => onChange(e.target.checked, imageUrl)} />Request a place on the Startup Wall</label>
    <button type="button" onClick={() => void withdraw()} disabled={busy} className="min-h-11 text-sm font-semibold text-coral-700 underline disabled:opacity-50">Withdraw from Wall now</button>
    {optedIn && <div className="space-y-3">
      <p className="text-sm font-semibold">Choose your Wall image</p>
      <div className="flex flex-wrap gap-3">
        {[{ url: "", label: "Startup logo", preview: logoUrl }, ...galleryImages.map((url, i) => ({ url, label: `Gallery image ${i + 1}`, preview: url }))].map(item =>
          <label key={item.url} className="flex w-28 cursor-pointer flex-col gap-2 rounded-lg border bg-white p-2 text-xs">
            <input type="radio" name="wall-image-choice" checked={imageUrl === item.url} onChange={() => onChange(true, item.url)} />
            {item.preview && <Image src={item.preview} alt="" width={96} height={96} className="h-20 w-full object-contain" />}{item.label}
          </label>)}
      </div>
      <EditableImageUpload kind="gallery" label="Wall creative" value={imageUrl && !galleryImages.includes(imageUrl) ? imageUrl : ""} onChange={url => onChange(true, url)} onBusyChange={onBusyChange} />
      <p className="text-xs text-gray-600">Or upload a new creative above. The Wall fits the whole image without cropping. Save your profile changes to submit for review.</p>
      {imageUrl && <Image src={imageUrl} alt="Selected Wall creative" width={320} height={320} className="max-h-48 w-full object-contain" />}
    </div>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </section>;
}
