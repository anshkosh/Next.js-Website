"use client";

import { useLayoutEffect, useRef, useState } from "react";

function cssMs(name: string) {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;
}

// Transitions.dev text morph: letters both labels share stay put; only the part
// that differs cross-blurs while its width eases ("Copy link" to "Copied").
export default function MorphText({ text }: { text: string }) {
  const [shown, setShown] = useState({ from: text, to: text });
  if (shown.to !== text) setShown({ from: shown.to, to: text });
  const swap = useRef<HTMLSpanElement>(null);
  const before = useRef<HTMLSpanElement>(null);
  const after = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const cell = swap.current, out = before.current, next = after.current;
    if (shown.from === shown.to || !cell || !out || !next) return;
    cell.style.width = `${out.getBoundingClientRect().width}px`;
    void cell.offsetWidth; // reflow so the width change transitions
    cell.classList.add("is-morphing");
    cell.style.width = `${next.getBoundingClientRect().width}px`;
    const settle = window.setTimeout(
      () => setShown(current => ({ from: current.to, to: current.to })),
      Math.max(cssMs("--text-morph-dur"), cssMs("--text-morph-resize-dur")) + 40,
    );
    return () => window.clearTimeout(settle);
  }, [shown]);

  if (shown.from === shown.to) return <span className="t-morph">{shown.to}</span>;

  const { from, to } = shown;
  let start = 0;
  while (start < from.length && start < to.length && from[start] === to[start]) start++;
  let end = 0;
  while (end < from.length - start && end < to.length - start && from[from.length - 1 - end] === to[to.length - 1 - end]) end++;

  return (
    <span className="t-morph">
      {to.slice(0, start)}
      <span key={`${from}>${to}`} ref={swap} className="t-morph-swap">
        <span ref={before} className="t-morph-old" aria-hidden="true">{from.slice(start, from.length - end)}</span>
        <span ref={after} className="t-morph-new">{to.slice(start, to.length - end)}</span>
      </span>
      {to.slice(to.length - end)}
    </span>
  );
}
