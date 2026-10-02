"use client";
import { useState } from "react";
import EditableImageUpload from "./EditableImageUpload";
import { useUploadActivity } from "./useUploadActivity";

export default function GalleryImageEditor({ images, onChange, onBusyChange }: {
  images: string[]; onChange: (images: string[]) => void; onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const anyBusy = Object.values(busy).some(Boolean);
  useUploadActivity(anyBusy, onBusyChange);
  const reportBusy = (key: string, value: boolean) => setBusy(previous => previous[key] === value ? previous : { ...previous, [key]: value });
  return <section className="space-y-3 border-t border-gray-100 pt-6">
    <div className="flex justify-between gap-3"><h3 className="text-sm font-medium text-gray-700">Gallery images <span className="font-normal">(optional)</span></h3><span className="text-xs text-gray-500">{images.length}/4 uploaded</span></div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((url, index) => <EditableImageUpload key={url} disabled={anyBusy} kind="gallery" value={url} label={`Gallery image ${index + 1}`} onBusyChange={value => reportBusy(url, value)} onChange={next => onChange(next ? images.map((image, i) => i === index ? next : image) : images.filter((_, i) => i !== index))} />)}
      {images.length < 4 && <EditableImageUpload disabled={anyBusy} kind="gallery" label="New gallery image" onBusyChange={value => reportBusy("new", value)} onChange={url => { if (url) onChange([...images, url].slice(0, 4)); }} />}
    </div>
  </section>;
}
