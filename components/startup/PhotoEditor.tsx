"use client";

import { useEffect, useRef, useState, useId } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { boundedPhotoSize, cropGeometry, drawPhoto, initialAdjustment, type ImageAdjustment } from "@/lib/image-editor";

export default function PhotoEditor({ file, square, onCancel, onApply }: {
  file: File; square: boolean; onCancel: () => void; onApply: (file: File) => Promise<void>;
}) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [adjustment, setAdjustment] = useState<ImageAdjustment>(initialAdjustment);
  const [aspect, setAspect] = useState(square ? "square" : "original");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; adjustment: ImageAdjustment } | null>(null);
  const controlId = useId();

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const photo = new Image();
    let alive = true;
    photo.onload = () => {
      if (!alive) return;
      if (photo.naturalWidth * photo.naturalHeight > 40_000_000) setError("Choose a photo smaller than 40 megapixels.");
      else setImage(photo);
    };
    photo.onerror = () => alive && setError("This image could not be opened. Choose a JPG, PNG or WebP photo.");
    photo.src = url;
    return () => { alive = false; URL.revokeObjectURL(url); };
  }, [file]);

  const ratio = aspect === "square" ? 1 : aspect === "landscape" ? 16 / 9 : image ? image.naturalWidth / image.naturalHeight : 16 / 9;
  // Limit preview and output dimensions, including very tall or panoramic photos.
  const { width, height } = boundedPhotoSize(ratio, 600);
  useEffect(() => {
    if (image && canvasRef.current) drawPhoto(canvasRef.current, image, adjustment);
  }, [image, adjustment, width, height]);

  async function apply() {
    if (!image) return;
    setSaving(true); setError("");
    try {
      const output = document.createElement("canvas");
      const max = square ? 512 : 1280;
      const dimensions = boundedPhotoSize(ratio, max);
      output.width = dimensions.width;
      output.height = dimensions.height;
      drawPhoto(output, image, adjustment);
      const blob = await new Promise<Blob>((resolve, reject) => output.toBlob(
        value => value ? resolve(value) : reject(new Error("The edited photo could not be saved.")),
        "image/webp", 0.88,
      ));
      const extension = blob.type === "image/webp" ? "webp" : "png";
      await onApply(new File([blob], `edited-photo.${extension}`, { type: blob.type }));
    } catch (e) { setError(e instanceof Error ? e.message : "Please try uploading the photo again."); }
    finally { setSaving(false); }
  }

  return <Dialog open onOpenChange={open => { if (!open && !saving) onCancel(); }}>
    <DialogContent showCloseButton={false} className="max-h-[94dvh] overflow-y-auto bg-white text-gray-900 sm:max-w-2xl">
      <DialogTitle className="text-2xl">Edit photo</DialogTitle>
      <DialogDescription>Crop, straighten and zoom. Drag the photo to position it, or use the position controls.</DialogDescription>
      {image ? <>
        <div className="flex min-h-36 max-h-[40dvh] items-center justify-center overflow-hidden rounded-xl bg-gray-100">
          <canvas ref={canvasRef} width={width} height={height} aria-label="Photo crop preview" className="max-h-[40dvh] max-w-full cursor-grab touch-none" style={{ background: "repeating-conic-gradient(#e5e7eb 0% 25%, white 0% 50%) 0 / 20px 20px" }}
            onPointerDown={e => { if (saving) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, adjustment }; }}
            onPointerMove={e => {
              if (!drag.current) return;
              const bounds = e.currentTarget.getBoundingClientRect();
              const geometry = cropGeometry(image.naturalWidth, image.naturalHeight, width, height, drag.current.adjustment);
              const dx = (e.clientX - drag.current.x) * width / bounds.width;
              const dy = (e.clientY - drag.current.y) * height / bounds.height;
              const cos = Math.cos(geometry.angle), sin = Math.sin(geometry.angle);
              setAdjustment({ ...drag.current.adjustment,
                x: Math.max(-1, Math.min(1, drag.current.adjustment.x + (geometry.xLimit ? (dx * cos + dy * sin) / geometry.xLimit : 0))),
                y: Math.max(-1, Math.min(1, drag.current.adjustment.y + (geometry.yLimit ? (-dx * sin + dy * cos) / geometry.yLimit : 0))),
              });
            }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} />
        </div>
        {!square && <label className="flex items-center justify-between gap-4">Crop shape
          <select aria-label="Crop shape" value={aspect} disabled={saving} onChange={e => { setAspect(e.target.value); setAdjustment(initialAdjustment); }} className="rounded-lg border p-2">
            <option value="original">Original</option><option value="landscape">Landscape (16:9)</option><option value="square">Square</option>
          </select>
        </label>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ["zoom", "Zoom", 1, 3, 0.01, `${adjustment.zoom.toFixed(2)}×`],
            ["rotation", "Straighten", -45, 45, 0.5, `${adjustment.rotation}°`],
            ["x", "Horizontal position", -1, 1, 0.01, ""],
            ["y", "Vertical position", -1, 1, 0.01, ""],
          ] as const).map(([key, label, min, max, step, display]) => <div key={key}>
            <label htmlFor={`${controlId}-${key}`} className="mb-2 flex justify-between text-sm font-medium">{label}<span>{display}</span></label>
            <input id={`${controlId}-${key}`} type="range" min={min} max={max} step={step} value={adjustment[key]} disabled={saving} onChange={e => setAdjustment(previous => ({ ...previous, [key]: Number(e.target.value) }))} className="w-full accent-orange-600" />
          </div>)}
        </div>
      </> : !error && <p role="status">Opening photo…</p>}
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="ghost" disabled={saving} onClick={() => setAdjustment(initialAdjustment)}>Reset</Button>
        <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
        <Button type="button" disabled={!image || saving} onClick={apply}>{saving ? "Uploading…" : "Apply & upload"}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
