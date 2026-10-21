"use client";

import { useEffect, useRef, type ReactNode } from "react";

const SPEED = 26; // pixels per second: a slow drift

// Slow looping strip that can also be dragged either way. The children hold the list
// twice, so the track wraps seamlessly at half its width. Movement is driven here, not
// by a CSS animation, so it keeps working when the visitor prefers reduced motion (by
// request). It stops while hovered, focused or being dragged.
export default function FeaturedMarquee({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const view = viewport.current;
    const el = track.current;
    if (!view || !el) return;
    let offset = 0, last = performance.now(), frame = 0;
    let hover = false, focus = false, dragging = false, captured = false;
    let startX = 0, startOffset = 0, moved = 0;
    // Measure on resize, not every frame; idle while off-screen or in a hidden tab.
    let half = el.scrollWidth / 2, onScreen = true;

    const wrap = (value: number) => half > 0 ? (((value % half) - half) % half) : 0;
    const apply = () => { el.style.transform = `translate3d(${offset}px,0,0)`; };
    const tick = (now: number) => {
      const seconds = Math.min((now - last) / 1000, 0.1);
      last = now;
      if (!hover && !focus && !dragging) { offset = wrap(offset - SPEED * seconds); apply(); }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame || !onScreen || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const sync = () => (onScreen && !document.hidden ? start() : stop());
    const resize = new ResizeObserver(() => { half = el.scrollWidth / 2; });
    const visible = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; sync(); });

    const down = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true; captured = false; moved = 0;
      startX = event.clientX; startOffset = offset;
    };
    const move = (event: PointerEvent) => {
      if (!dragging) return;
      const delta = event.clientX - startX;
      moved = Math.max(moved, Math.abs(delta));
      // Capture only once it is really a drag, so a plain click still reaches the link.
      if (!captured && moved > 5) { captured = true; view.setPointerCapture(event.pointerId); view.dataset.dragging = "true"; }
      if (captured) { offset = wrap(startOffset + delta); apply(); }
    };
    const up = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (captured && view.hasPointerCapture(event.pointerId)) view.releasePointerCapture(event.pointerId);
      delete view.dataset.dragging;
    };
    const click = (event: MouseEvent) => {
      if (moved > 5) { event.preventDefault(); event.stopPropagation(); }
      moved = 0;
    };
    const noDrag = (event: Event) => event.preventDefault();
    const enter = (event: PointerEvent) => { if (event.pointerType === "mouse") hover = true; };
    const leave = () => { hover = false; };
    const focusIn = () => { focus = true; };
    const focusOut = () => { focus = false; };

    view.addEventListener("pointerdown", down);
    view.addEventListener("pointermove", move);
    view.addEventListener("pointerup", up);
    view.addEventListener("pointercancel", up);
    view.addEventListener("click", click, true);
    view.addEventListener("dragstart", noDrag);
    view.addEventListener("pointerenter", enter);
    view.addEventListener("pointerleave", leave);
    view.addEventListener("focusin", focusIn);
    view.addEventListener("focusout", focusOut);
    document.addEventListener("visibilitychange", sync);
    resize.observe(el);
    visible.observe(view);
    start();
    return () => {
      stop();
      resize.disconnect();
      visible.disconnect();
      document.removeEventListener("visibilitychange", sync);
      view.removeEventListener("pointerdown", down);
      view.removeEventListener("pointermove", move);
      view.removeEventListener("pointerup", up);
      view.removeEventListener("pointercancel", up);
      view.removeEventListener("click", click, true);
      view.removeEventListener("dragstart", noDrag);
      view.removeEventListener("pointerenter", enter);
      view.removeEventListener("pointerleave", leave);
      view.removeEventListener("focusin", focusIn);
      view.removeEventListener("focusout", focusOut);
    };
  }, []);

  return (
    <div ref={viewport} className="featured-marquee cursor-grab select-none overflow-hidden" style={{ touchAction: "pan-y" }}>
      <div ref={track} className="featured-marquee-track w-max will-change-transform">
        {children}
      </div>
    </div>
  );
}
