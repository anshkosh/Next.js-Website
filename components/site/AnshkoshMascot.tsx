"use client";

import dynamic from "next/dynamic";
import styles from "./AnshkoshMascot.module.css";

// Keep the sprite/animation library out of ordinary page loads. Its parent
// reserves the exact space until the error/empty-state mascot is needed.
const Mascot = dynamic(() => import("page-mascot").then(module => module.Mascot), { ssr: false });

export default function AnshkoshMascot({ size = 160, label = "mascot Kosh" }: { size?: number; label?: string }) {
  return (
    <div style={{ width: size, height: size }}>
      <Mascot
      directions="/mascots/anshkosh-fox-directions.webp?v=2"
      reactions="/mascots/anshkosh-fox-reactions.webp?v=2"
      size={size}
      label={label}
      className={`${styles.mascot} rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-600`}
      />
    </div>
  );
}
