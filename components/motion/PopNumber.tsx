"use client";

import { useState } from "react";

// Transitions.dev number pop-in: when the value changes, the digits that changed
// rise into place; the leading digits it shares with the old value stay still.
export default function PopNumber({ value }: { value: string }) {
  const [shown, setShown] = useState({ value, previous: value, run: 0 });
  if (shown.value !== value) setShown({ value, previous: shown.value, run: shown.run + 1 });

  let same = 0;
  while (same < shown.previous.length && same < value.length && shown.previous[same] === value[same]) same++;
  const chars = value.split("");

  // A new key remounts the group, which restarts the keyframes for each change.
  return (
    <span key={shown.run} className={`t-digit-group${shown.run ? " is-animating" : ""}`}>
      {chars.map((char, index) => (
        <span
          key={index}
          className="t-digit"
          data-same={index < same ? "" : undefined}
          data-stagger={index === chars.length - 2 ? "1" : index === chars.length - 1 ? "2" : undefined}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
