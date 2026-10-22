"use client";

import Image from "next/image";
import { useState } from "react";

export default function JournalCover({ src, title }: { src: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  return <div className="relative h-[420px] w-full bg-gray-900 md:h-[520px]">
    {!loaded && !failed && <p role="status" className="absolute inset-x-0 top-16 px-4 text-center text-sm text-white">Loading article cover…</p>}
    {failed ? <div className="absolute inset-x-0 top-16 z-10 px-4 text-center text-white">
      <p role="status">The cover image could not load.</p>
      <button className="mt-3 min-h-11 rounded-lg border border-white/60 px-4" onClick={() => { setAttempt(value => value + 1); setFailed(false); }}>Retry cover image</button>
    </div> : <Image key={attempt} src={src} alt={title} fill className="object-cover opacity-70" priority sizes="100vw" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
  </div>;
}
