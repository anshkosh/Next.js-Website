"use client";

import { Mascot } from "page-mascot";
import styles from "./AnshkoshMascot.module.css";

export default function AnshkoshMascot({ size = 160, label = "mascot Kosh" }: { size?: number; label?: string }) {
  return (
    <Mascot
      directions="/mascots/anshkosh-fox-directions.webp?v=2"
      reactions="/mascots/anshkosh-fox-reactions.webp?v=2"
      size={size}
      label={label}
      className={`${styles.mascot} rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral-600`}
    />
  );
}
