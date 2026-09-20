"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import styles from "./HeroArtwork.module.css";

export default function HeroArtwork() {
  const artworkRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const artwork = artworkRef.current;
    const hand = handRef.current;
    if (!artwork || !hand) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let request = 0;

    const updateHand = () => {
      request = 0;
      if (reducedMotion.matches) return;
      const bounds = artwork.getBoundingClientRect();
      const travel = Math.max(bounds.height * 0.5, 1);
      const progress = Math.max(0, Math.min(1, -bounds.top / travel));
      const eased = progress * progress * (3 - 2 * progress);
      const x = 8 - 17 * eased;
      const y = -10 + 27 * eased;
      const rotation = 4 - 10 * eased;
      hand.style.transform = `translate3d(${x}%, ${y}%, 0) rotateZ(${rotation}deg)`;
    };

    const scheduleUpdate = () => {
      if (!request) request = requestAnimationFrame(updateHand);
    };

    const handleMotionPreference = () => {
      if (reducedMotion.matches) hand.style.transform = "";
      else updateHand();
    };

    updateHand();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    reducedMotion.addEventListener("change", handleMotionPreference);

    return () => {
      cancelAnimationFrame(request);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", handleMotionPreference);
    };
  }, []);

  return (
    <div ref={artworkRef} className={styles.artwork} aria-hidden="true">
      <div className={styles.frame}>
        <div className={styles.window}>
          <div className={styles.tilt}>
            <div className={styles.float}>
              <Image className={styles.base} src="/images/hero-pomegranate-background.webp" alt="" width={1670} height={941} sizes="100vw" priority />
              <div ref={handRef} className={styles.hand}>
                <Image className={styles.handImage} src="/images/hero-hand-cutout.webp" alt="" width={2146} height={733} sizes="55vw" />
              </div>
              <div className={styles.fruit}>
                <Image className={styles.fruitImage} src="/images/hero-pomegranate-cutout.webp" alt="" width={1296} height={1280} sizes="9vw" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.fade} />
    </div>
  );
}
