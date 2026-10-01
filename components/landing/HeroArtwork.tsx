"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { getHeroMotion, getHeroScrollProgress } from "@/lib/hero-motion";
import styles from "./HeroArtwork.module.css";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function prefersReducedMotion() {
  return window.matchMedia(motionQuery).matches;
}

export default function HeroArtwork() {
  const artworkRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, prefersReducedMotion, () => true);
  const [motionOverride, setMotionOverride] = useState<boolean | null>(null);
  const motionEnabled = motionOverride ?? !reducedMotion;

  useEffect(() => {
    const artwork = artworkRef.current;
    if (!artwork) return;

    let request = 0;
    let visible = true;
    let top = 0;
    let height = 1;

    const render = () => {
      request = 0;
      const progress = motionEnabled ? getHeroScrollProgress(window.scrollY, top, height) : 0;
      const motion = getHeroMotion(progress);
      artwork.style.setProperty("--hand-x", `${motion.handX}%`);
      artwork.style.setProperty("--hand-y", `${motion.handY}%`);
      artwork.style.setProperty("--hand-rotation", `${motion.handRotation}deg`);
    };

    const measure = () => {
      const bounds = artwork.getBoundingClientRect();
      top = bounds.top + window.scrollY;
      height = bounds.height;
      render();
    };

    const schedule = () => {
      if (motionEnabled && visible && !request) request = requestAnimationFrame(render);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    const resize = new ResizeObserver(measure);
    visibility.observe(artwork);
    resize.observe(artwork);
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(request);
      visibility.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
    };
  }, [motionEnabled]);

  return (
    <>
      <div ref={artworkRef} className={styles.artwork} aria-hidden="true" data-hero-artwork>
        <div className={styles.frame}>
          <div className={styles.window}>
            <Image className={styles.base} src="/images/hero-scroll-background.webp" alt="" width={1672} height={941} sizes="(max-width: 767px) 760px, 100vw" preload />
            <div className={styles.shadow} />
            <div className={styles.openHand}>
              <div className={styles.sleeveTail} />
              <Image className={styles.handImage} src="/images/hero-scroll-hand-open.webp" alt="" width={960} height={427} sizes="(max-width: 767px) 370px, 48vw" loading="eager" />
            </div>
            <div className={styles.fruit}>
              <Image className={styles.layerImage} src="/images/hero-scroll-fruit.webp" alt="" width={184} height={201} sizes="(max-width: 767px) 65px, 8vw" loading="eager" />
            </div>
          </div>
        </div>
        <div className={styles.fade} />
      </div>
      <div className={styles.motionControls}>
        <span>{motionEnabled ? "Scroll to bring the hand to the pomegranate" : "Illustration motion is paused"}</span>
        <button type="button" aria-pressed={motionEnabled} onClick={() => setMotionOverride(!motionEnabled)}>
          {motionEnabled ? "Pause animation" : "Enable scroll animation"}
        </button>
      </div>
    </>
  );
}
