"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_BADGES, CARD_THEMES, canvasLines, readCardSettings } from "@/lib/launch-card";
import { FOUNDER_KEY, readFounder } from "@/lib/founder-toolkit";
import { useBrowserDraft } from "./useBrowserDraft";
import { DraftNotice, Field, FounderFields, inputStyle, primaryButton } from "./ToolFields";
import { downloadBlob, exportFilename } from "./ToolExport";

export default function LaunchCardMaker() {
  const { data: founder, storageError: detailError } = useBrowserDraft(FOUNDER_KEY, readFounder);
  const { data: settings, update, storageError } = useBrowserDraft("anshkosh-launch-card-v1", readCardSettings);
  const canvas = useRef<HTMLCanvasElement>(null); const uploadVersion = useRef(0);
  const [logo, setLogo] = useState<ImageBitmap | null>(null);
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [status, setStatus] = useState("");
  useEffect(() => () => logo?.close(), [logo]);
  useEffect(() => () => { uploadVersion.current += 1; }, []);
  useEffect(() => {
    let cancelled = false;
    async function draw() {
      const element = canvas.current; if (!element) return;
      const ctx = element.getContext("2d"); if (!ctx) { setStatus("This browser cannot draw a launch card. Try a browser with canvas support."); return; }
      setReady(false);
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-oswald").trim() || "Arial";
      try { await document.fonts?.load(`700 80px ${family}`); } catch { /* System fonts still produce a usable card. */ }
      if (cancelled) return;
      const width = settings.format === "square" ? 1080 : 1200;
      const height = settings.format === "square" ? 1080 : 630;
      element.width = width; element.height = height;
      const theme = CARD_THEMES[settings.theme]; const padding = 64; const contentWidth = width - padding * 2;
      ctx.fillStyle = theme.background; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = theme.accent; ctx.fillRect(0, 0, width, 10);
      ctx.textBaseline = "top";
      ctx.fillStyle = theme.accent; ctx.font = "600 22px Arial, sans-serif";
      ctx.fillText(settings.badge.toUpperCase(), padding, padding);
      const logoY = settings.format === "square" ? 150 : 112;
      const size = settings.format === "square" ? 120 : 88;
      if (logo) {
        const ratio = Math.min(size / logo.width, size / logo.height);
        ctx.drawImage(logo, padding + (size - logo.width * ratio) / 2, logoY + (size - logo.height * ratio) / 2, logo.width * ratio, logo.height * ratio);
      } else {
        ctx.fillStyle = theme.accent; ctx.fillRect(padding, logoY, size, size);
        ctx.fillStyle = theme.background; ctx.font = `700 ${size * 0.55}px Arial, sans-serif`;
        ctx.fillText(Array.from(founder.name.trim() || "S")[0].toUpperCase(), padding + size * 0.28, logoY + size * 0.24);
      }
      const titleY = logoY + size + (settings.format === "square" ? 48 : 30);
      const fontSize = settings.format === "square" ? 88 : 74;
      ctx.fillStyle = theme.foreground; ctx.font = `700 ${fontSize}px ${family}, Arial, sans-serif`;
      const nameLines = canvasLines(ctx, founder.name || "Your startup", contentWidth, 2);
      nameLines.forEach((line, index) => ctx.fillText(line, padding, titleY + index * fontSize * 1.15));
      const taglineY = titleY + nameLines.length * fontSize * 1.15 + 20;
      ctx.font = `${settings.format === "square" ? 38 : 30}px Arial, sans-serif`; ctx.fillStyle = theme.muted;
      const taglineMaxLines = settings.format === "square" ? 4 : 2;
      canvasLines(ctx, founder.tagline || "Add a tagline to tell people what you’re building.", contentWidth, taglineMaxLines).forEach((line, index) => ctx.fillText(line, padding, taglineY + index * (settings.format === "square" ? 49 : 39)));
      ctx.strokeStyle = theme.muted; ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.moveTo(padding, height - 115); ctx.lineTo(width - padding, height - 115); ctx.stroke(); ctx.globalAlpha = 1;
      ctx.fillStyle = theme.foreground; ctx.font = "500 24px Arial, sans-serif";
      const link = founder.websiteUrl.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
      canvasLines(ctx, link || "Your startup link", contentWidth, 1).forEach(line => ctx.fillText(line, padding, height - 82));
      setReady(true);
    }
    void draw(); return () => { cancelled = true; };
  }, [founder.name, founder.tagline, founder.websiteUrl, settings.theme, settings.format, settings.badge, logo]);

  async function upload(file?: File) {
    const version = ++uploadVersion.current; if (!file) { setBusy(false); return; }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setStatus("Choose a PNG, JPG or WebP logo smaller than 5 MB."); setBusy(false); return;
    }
    setBusy(true); setStatus("");
    try {
      const bitmap = await createImageBitmap(file);
      if (version !== uploadVersion.current) { bitmap.close(); return; }
      if (bitmap.width * bitmap.height > 16000000) { bitmap.close(); setStatus("Choose a logo with fewer than 16 million pixels."); return; }
      setLogo(bitmap); setStatus("Logo added. It stays on this device for this visit.");
    } catch { if (version === uploadVersion.current) setStatus("The logo could not be opened. Try another PNG, JPG or WebP file."); }
    finally { if (version === uploadVersion.current) setBusy(false); }
  }
  function download() {
    canvas.current?.toBlob(blob => {
      if (!blob) { setStatus("The image could not be exported. Try again."); return; }
      try { downloadBlob(blob, exportFilename(founder.name, "launch-card.png")); setStatus("PNG download prepared."); }
      catch { setStatus("The download could not be prepared. Try again."); }
    }, "image/png");
  }
  return <>
    <DraftNotice error={storageError || detailError} />
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
      <section aria-labelledby="card-details" className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7"><h2 id="card-details" className="font-heading text-2xl font-bold">Make it yours</h2><FounderFields include={["name", "tagline", "websiteUrl"]} />
        <Field label="Logo (optional)" hint="PNG, JPG or WebP, up to 5 MB. The logo is not uploaded or saved between visits."><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => void upload(event.target.files?.[0])} className={`${inputStyle} text-xs file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-2`} /></Field>
        {logo && <button type="button" onClick={() => { ++uploadVersion.current; setBusy(false); setLogo(null); setStatus("Logo removed."); }} className="text-sm text-gray-600 underline underline-offset-4">Remove logo</button>}
        <Field label="Card format"><select value={settings.format} onChange={event => update({ format: event.target.value as typeof settings.format })} className={inputStyle}><option value="landscape">Landscape · 1200 × 630</option><option value="square">Square · 1080 × 1080</option></select></Field>
        <Field label="Colour theme"><select value={settings.theme} onChange={event => update({ theme: event.target.value as typeof settings.theme })} className={inputStyle}>{Object.entries(CARD_THEMES).map(([id, theme]) => <option key={id} value={id}>{theme.label}</option>)}</select></Field>
        <Field label="Launch message"><select value={settings.badge} onChange={event => update({ badge: event.target.value as typeof settings.badge })} className={inputStyle}>{CARD_BADGES.map(badge => <option key={badge}>{badge}</option>)}</select></Field>
      </section>
      <section aria-labelledby="card-preview" className="min-w-0 lg:sticky lg:top-28"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 id="card-preview" className="font-heading text-2xl font-bold">Your launch card</h2><span className="text-xs text-gray-600">PNG · Full-size export</span></div>
        <canvas ref={canvas} role="img" aria-label={`Launch card preview for ${founder.name || "your startup"}: ${founder.tagline || "add a tagline"}`} className="h-auto w-full rounded-xl border border-gray-200 bg-gray-100" />
        <p className="mt-3 text-xs text-gray-600">Long text is shortened to fit the graphic. Check the preview before downloading.</p>
        <button type="button" disabled={!ready || busy || !founder.name.trim() || !founder.tagline.trim()} onClick={download} className={`${primaryButton} mt-6`}>{busy ? "Opening logo…" : "Download PNG"}</button>
        {(!founder.name.trim() || !founder.tagline.trim()) && <p className="mt-3 text-sm text-gray-600">Add a startup name and tagline to download your card.</p>}
        <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm text-gray-600">{status}</p>
      </section>
    </div>
  </>;
}
