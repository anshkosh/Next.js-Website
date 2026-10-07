"use client";

import { Mascot } from "page-mascot";

export default function ErrorMascot({ size = 160, label = "Anshkosh fox mascot" }: { size?: number; label?: string }) {
  return (
    <div className="mx-auto mb-4 flex justify-center">
      <Mascot
        directions="/mascots/fox-riso-directions.webp"
        reactions="/mascots/fox-riso-reactions.webp"
        size={size}
        label={label}
      />
    </div>
  );
}
